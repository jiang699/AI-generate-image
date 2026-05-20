import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAuth, createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

const historyQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  mode: z.enum(['text', 'image', 'style', 'optimize']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const result = historyQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      mode: searchParams.get('mode'),
    });

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { page, limit, mode } = result.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 3. 构建查询
    const supabase = createServiceClient();
    let query = supabase
      .from('generations')
      .select('*, count(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (mode) {
      query = query.eq('mode', mode);
    }

    const { data, error, count } = await query
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        createErrorResponse('DB_ERROR', 'Failed to fetch generations'),
        { status: 500 }
      );
    }

    // 4. 处理数据
    const generations = data || [];
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    return NextResponse.json(
      createSuccessResponse({
        items: generations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
        },
      })
    );
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
