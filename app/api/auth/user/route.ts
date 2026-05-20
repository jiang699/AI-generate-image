import { NextResponse, type NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 获取 Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    const supabase = createServiceClient();

    // 验证 JWT token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, credits, is_admin, created_at')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('USER_NOT_FOUND', 'User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        credits: user.credits,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
      })
    );
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
