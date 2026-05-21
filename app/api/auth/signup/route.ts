import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { email, password, displayName } = result.data;
    const supabaseAdmin = createServiceClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (authError) {
      console.error('Signup auth error:', authError);
      return NextResponse.json(
        createErrorResponse('AUTH_ERROR', authError.message),
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        createErrorResponse('AUTH_ERROR', 'Failed to create user'),
        { status: 500 }
      );
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        display_name: displayName,
        credits: 100,
        is_admin: false,
      });

    if (userError) {
      console.error('Signup user error:', userError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (e) {
        console.error('Failed to cleanup auth user:', e);
      }

      return NextResponse.json(
        createErrorResponse('DB_ERROR', 'Failed to create user record'),
        { status: 500 }
      );
    }

    await supabaseAdmin.from('transactions').insert({
      user_id: authData.user.id,
      type: 'purchase',
      amount: 100,
      description: 'Welcome bonus',
    });

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: signinData, error: signinError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          displayName,
          credits: 100,
        },
        access_token: signinData?.session?.access_token || null,
        refresh_token: signinData?.session?.refresh_token || null,
        session: signinData?.session?.access_token || null,
        message: signinError
          ? 'User created successfully. Welcome bonus 100 credits added! Please sign in.'
          : 'User created successfully. Welcome bonus 100 credits added!',
      })
    );
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
