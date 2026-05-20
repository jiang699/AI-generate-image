import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
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

    const supabase = createServiceClient();

    // 创建 Supabase Auth 用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
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

    // 在 users 表中创建用户记录
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        display_name: displayName,
        credits: 100, // 新用户赠送100积分
        is_admin: false,
      });

    if (userError) {
      console.error('Signup user error:', userError);
      // 清理已创建的 Auth 用户
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (e) {
        console.error('Failed to cleanup auth user:', e);
      }
      
      return NextResponse.json(
        createErrorResponse('DB_ERROR', 'Failed to create user record'),
        { status: 500 }
      );
    }

    // 创建赠送积分的交易记录
    await supabase.from('transactions').insert({
      user_id: authData.user.id,
      type: 'purchase',
      amount: 100,
      description: 'Welcome bonus',
    });

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          displayName,
          credits: 100,
        },
        message: 'User created successfully. Welcome bonus 100 credits added!',
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
