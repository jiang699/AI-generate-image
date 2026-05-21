import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Signin auth error:', authError);
      return NextResponse.json(
        createErrorResponse('AUTH_ERROR', 'Invalid email or password'),
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        createErrorResponse('AUTH_ERROR', 'Failed to authenticate'),
        { status: 500 }
      );
    }

    const supabaseAdmin = createServiceClient();

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, credits, is_admin')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      const { error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          display_name: authData.user.email!.split('@')[0],
          credits: 100,
          is_admin: false,
        });

      if (createError) {
        console.error('Failed to create user record:', createError);
        return NextResponse.json(
          createErrorResponse('DB_ERROR', 'Failed to get user info'),
          { status: 500 }
        );
      }

      return NextResponse.json(
        createSuccessResponse({
          user: {
            id: authData.user.id,
            email: authData.user.email,
            displayName: authData.user.email!.split('@')[0],
            credits: 100,
            isAdmin: false,
          },
          access_token: authData.session?.access_token || null,
          refresh_token: authData.session?.refresh_token || null,
          session: authData.session?.access_token || null,
        })
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          credits: user.credits,
          isAdmin: user.is_admin,
        },
        access_token: authData.session?.access_token || null,
        refresh_token: authData.session?.refresh_token || null,
        session: authData.session?.access_token || null,
      })
    );
  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
