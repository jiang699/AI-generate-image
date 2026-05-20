import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAuth, checkAndDeductCredits, createGenerationRecord, createSuccessResponse, createErrorResponse } from '@/lib/api';
import { generateStyleTransfer } from '@/lib/replicate';
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

    // 5. 调用 Replicate API
    try {
      const output = await generateStyleTransfer(contentImageUrl, styleImageUrl, styleStrength);

      // 6. 处理输出
      let imageUrl: string | null = null;
      if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (typeof output === 'string') {
        imageUrl = output;
      }

      // 7. 更新记录
      const supabase = createServiceClient();
      await supabase
        .from('generations')
        .update({
          status: imageUrl ? 'completed' : 'failed',
          image_url: imageUrl,
        })
        .eq('id', generationId);

      // 8. 返回结果
      return NextResponse.json(
        createSuccessResponse({
          id: generationId,
          status: imageUrl ? 'completed' : 'failed',
          prompt: 'Style Transfer',
          imageUrl,
          settings,
          createdAt: recordResult.data!.created_at,
        })
      );
    } catch (replicateError) {
      console.error('Replicate API error:', replicateError);
      
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
        createErrorResponse('GENERATION_FAILED', 'Image generation failed'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Style transfer API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
