import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAuth, checkAndDeductCredits, createGenerationRecord, createSuccessResponse, createErrorResponse } from '@/lib/api';
import Replicate from 'replicate';
import { createServiceClient } from '@/lib/supabase-server';

const textToImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  width: z.number().min(512).max(2048).optional().default(1024),
  height: z.number().min(512).max(2048).optional().default(1024),
  steps: z.number().min(10).max(50).optional().default(30),
  guidance: z.number().min(1).max(20).optional().default(7.5),
  seed: z.number().optional(),
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
    const result = textToImageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters'),
        { status: 400 }
      );
    }

    const { prompt, width, height, steps, guidance, seed } = result.data;
    
    // 3. 检查并扣除积分
    const creditCost = parseInt(process.env.CREDIT_COST_TEXT_TO_IMAGE || '10');
    const creditResult = await checkAndDeductCredits(user.id, creditCost);
    if (!creditResult.success) {
      return NextResponse.json(
        createErrorResponse(creditResult.error!.code, creditResult.error!.message),
        { status: 400 }
      );
    }

    // 4. 创建生成记录
    const settings = { width, height, steps, guidance, seed };
    const recordResult = await createGenerationRecord(user.id, prompt, 'text', settings);
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

      const model = process.env.REPLICATE_MODEL || 'stability-ai/stable-diffusion';
      const version = process.env.REPLICATE_MODEL_VERSION;

      // 启动预测
      const prediction = await replicate.predictions.create({
        version: version || undefined,
        input: {
          prompt,
          width,
          height,
          num_inference_steps: steps,
          guidance_scale: guidance,
          seed: seed || undefined,
        },
      });

      // 6. 更新生成记录，保存 Replicate 预测 ID
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

      // 7. 返回结果（任务正在处理中）
      return NextResponse.json(
        createSuccessResponse({
          id: generationId,
          status: 'processing',
          prompt,
          predictionId: prediction.id,
          settings,
          createdAt: recordResult.data!.created_at,
          message: 'Generation started. Use predictionId to check status via webhook.',
        })
      );
    } catch (replicateError) {
      console.error('Failed to start Replicate prediction:', replicateError);
      
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
        createErrorResponse('START_FAILED', 'Failed to start generation'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Text to image async API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
