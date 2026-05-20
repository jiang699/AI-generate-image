import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuth, createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户身份
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    const { id } = params;

    // 2. 查询生成记录
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Generation not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(data));
  } catch (error) {
    console.error('Get generation API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户身份
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    const { id } = params;

    // 2. 删除生成记录
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database delete error:', error);
      return NextResponse.json(
        createErrorResponse('DELETE_FAILED', 'Failed to delete generation'),
        { status: 500 }
      );
    }

    return NextResponse.json(createSuccessResponse({ message: 'Generation deleted' }));
  } catch (error) {
    console.error('Delete generation API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
