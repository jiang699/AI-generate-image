import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAuth, checkAndDeductCredits, createGenerationRecord, createSuccessResponse, createErrorResponse } from '@/lib/api';
import Replicate from 'replicate';
import { createServiceClient } from '@/lib/supabase-server';

const styleTransferSchema = z.object({
  contentImageUrl: z.string().url(),
  styleImageUrl: z.string().url(),
  styleStrength: z.number().min(0.1).max(1).optional().default(0.8),
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
    const result = styleTransferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { contentImageUrl, styleImageUrl, styleStrength } = result.data;
    
    // 3. 检查并扣除积分
    const creditCost = parseInt(process.env.CREDIT_COST_STYLE_TRANSFER || '20');
    const creditResult = await checkAndDeductCredits(user.id, creditCost);
    if (!creditResult.success) {
      return NextResponse.json(
        createErrorResponse(creditResult.error!.code, creditResult.error!.message),
        { status: 400 }
      );
    }

    // 4. 创建生成记录
    const settings = { contentImageUrl, styleImageUrl, styleStrength };
    const recordResult = await createGenerationRecord(user.id, 'Style Transfer', 'style', settings);
    if (!recordResult.success) {
      return NextResponse.json(
        createErrorResponse(recordResult.error!.code, recordResult.error!.message),
        { status: 500 }
      );
    }

    const generationId = recordResult.data!.id;

    // 5. 启动异步生成
    try {
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });

      // 使用支持风格迁移的模型
      const prediction = await replicate.predictions.create({
        version: 'c2aad2fc5b7d5588392a5a9b5b58a90b1c2d6c50c25f2e2a6e2f9e2a2c2d6c5',
        input: {
          content_image: contentImageUrl,
          style_image: styleImageUrl,
          style_strength: styleStrength,
        },
      });

      // 6. 更新生成记录
      const supabase = createServiceClient();
      await supabase
        .from('generations')
        .update({
          settings: {
            ...settings,
            replicate_id: prediction.id,
            webhook_url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/replicate',
          },
        })
        .eq('id', generationId);

      // 7. 返回结果
      return NextResponse.json(
        createSuccessResponse({
          id: generationId,
          status: 'processing',
          predictionId: prediction.id,
          settings,
          createdAt: recordResult.data!.created_at,
        })
      );
    } catch (replicateError) {
      console.error('Failed to start style transfer prediction:', replicateError);
      
      const supabase = createServiceClient();
      await supabase
        .from('generations')
        .update({ status: 'failed' })
        .eq('id', generationId);
      
      await supabase.rpc('update_credits', {
        user_id: user.id,
        amount: creditCost,
      });

      return NextResponse.json(
        createErrorResponse('START_FAILED', 'Failed to start style transfer'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Style transfer async API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
