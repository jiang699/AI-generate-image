import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAuth, checkAndDeductCredits, createGenerationRecord, createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

const optimizeSchema = z.object({
  imageUrl: z.string().url(),
  format: z.enum(['jpeg', 'png', 'webp']).optional().default('webp'),
  quality: z.number().min(10).max(100).optional().default(80),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    // 2. 验证请求参数
    const body = await request.json();
    const result = optimizeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { imageUrl, format, quality } = result.data;
    
    // 3. 检查并扣除积分
    const creditCost = parseInt(process.env.CREDIT_COST_IMAGE_OPTIMIZE || '5');
    const creditResult = await checkAndDeductCredits(user.id, creditCost);
    if (!creditResult.success) {
      return NextResponse.json(
        createErrorResponse(creditResult.error!.code, creditResult.error!.message),
        { status: 400 }
      );
    }

    // 4. 创建生成记录
    const settings = { imageUrl, format, quality };
    const recordResult = await createGenerationRecord(user.id, 'Image Optimization', 'optimize', settings);
    if (!recordResult.success) {
      return NextResponse.json(
        createErrorResponse(recordResult.error!.code, recordResult.error!.message),
        { status: 500 }
      );
    }

    const generationId = recordResult.data!.id;

    // 5. 图像优化（这里使用简化实现，实际项目中可以集成图像优化服务）
    try {
      // 暂时直接使用原图 URL 作为优化后图像
      // 实际项目中可以集成 sharp 或其他图像处理服务
      const optimizedImageUrl = imageUrl;

      // 6. 更新记录
      const supabase = createServiceClient();
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          image_url: optimizedImageUrl,
        })
        .eq('id', generationId);

      // 7. 返回结果
      return NextResponse.json(
        createSuccessResponse({
          id: generationId,
          status: 'completed',
          prompt: 'Image Optimization',
          imageUrl: optimizedImageUrl,
          settings,
          createdAt: recordResult.data!.created_at,
        })
      );
    } catch (optimizeError) {
      console.error('Image optimization error:', optimizeError);
      
      // 更新为失败状态
      const supabase = createServiceClient();
      await supabase
        .from('generations')
        .update({ status: 'failed' })
        .eq('id', generationId);
      
      // 回滚积分
      await supabase.rpc('update_credits', {
        user_id: user.id,
        amount: creditCost,
      });

      return NextResponse.json(
        createErrorResponse('OPTIMIZATION_FAILED', 'Image optimization failed'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image optimize API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
