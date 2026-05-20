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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    // 获取用户积分
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        createErrorResponse('USER_NOT_FOUND', 'User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        credits: userData.credits,
      })
    );
  } catch (error) {
    console.error('Get credits API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
