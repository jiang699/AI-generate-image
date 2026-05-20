import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

const imageToImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must not exceed 1000 characters'),
  strength: z.number().min(0.1).max(1).optional().default(0.7),
  width: z.number().min(512).max(2048).optional().default(1024),
  height: z.number().min(512).max(2048).optional().default(1024),
  steps: z.number().min(10).max(50).optional().default(30),
  guidance: z.number().min(1).max(20).optional().default(7.5),
  seed: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 获取 Authorization header 并验证用户身份
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

    // 2. 验证请求参数
    const body = await request.json();
    const result = imageToImageSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid request parameters: ' + result.error.message),
        { status: 400 }
      );
    }

    const { imageUrl, prompt, strength, width, height, steps, guidance, seed } = result.data;

    // 3. 检查用户积分
    const creditCost = parseInt(process.env.CREDIT_COST_IMAGE_TO_IMAGE || '15');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        createErrorResponse('USER_NOT_FOUND', 'User not found'),
        { status: 404 }
      );
    }

    // 4. 检查积分是否充足
    if (userData.credits < creditCost) {
      return NextResponse.json(
        createErrorResponse(
          'INSUFFICIENT_CREDITS',
          `Insufficient credits. You need ${creditCost} credits but only have ${userData.credits}`
        ),
        { status: 400 }
      );
    }

    // 5. 扣除积分
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: userData.credits - creditCost })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return NextResponse.json(
        createErrorResponse('CREDIT_ERROR', 'Failed to deduct credits'),
        { status: 500 }
      );
    }

    // 6. 创建生成记录
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        prompt,
        mode: 'image',
        settings: {
          imageUrl,
          strength,
          width,
          height,
          steps,
          guidance,
          seed,
        },
        status: 'processing',
      })
      .select()
      .single();

    if (genError || !generation) {
      console.error('Failed to create generation record:', genError);
      
      // 回滚积分
      await supabase
        .from('users')
        .update({ credits: userData.credits })
        .eq('id', user.id);
      
      return NextResponse.json(
        createErrorResponse('DB_ERROR', 'Failed to create generation record'),
        { status: 500 }
      );
    }

    // 7. 创建消费记录
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'consume',
      amount: creditCost,
      description: 'Image-to-image generation',
    });

    // 8. 调用 Replicate API 生成图片
    try {
      const Replicate = (await import('replicate')).default;
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!,
      });

      const model = process.env.REPLICATE_MODEL || 'bytedance/seedream-5-lite';
      const version = process.env.REPLICATE_MODEL_VERSION;

      const output = await replicate.run(
        version ? `${model}:${version}` : model,
        {
          input: {
            prompt,
            image: imageUrl,
            strength,
            width,
            height,
            num_inference_steps: steps,
            guidance_scale: guidance,
            seed: seed || undefined,
          },
        }
      );

      // 9. 处理输出
      let resultImageUrl: string | null = null;
      if (Array.isArray(output) && output.length > 0) {
        resultImageUrl = output[0];
      } else if (typeof output === 'string') {
        resultImageUrl = output;
      }

      // 10. 更新生成记录
      await supabase
        .from('generations')
        .update({
          status: resultImageUrl ? 'completed' : 'failed',
          image_url: resultImageUrl,
        })
        .eq('id', generation.id);

      // 11. 返回结果
      return NextResponse.json(
        createSuccessResponse({
          id: generation.id,
          status: resultImageUrl ? 'completed' : 'failed',
          prompt,
          imageUrl: resultImageUrl,
          inputImageUrl: imageUrl,
          creditsUsed: creditCost,
          remainingCredits: userData.credits - creditCost,
          settings: { strength, width, height, steps, guidance, seed },
          createdAt: generation.created_at,
        })
      );
    } catch (replicateError) {
      console.error('Replicate API error:', replicateError);
      
      // 更新为失败状态
      await supabase
        .from('generations')
        .update({ status: 'failed' })
        .eq('id', generation.id);
      
      // 回滚积分
      await supabase
        .from('users')
        .update({ credits: userData.credits })
        .eq('id', user.id);
      
      // 删除消费记录
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'consume')
        .eq('description', 'Image-to-image generation')
        .order('created_at', { ascending: false })
        .limit(1);

      return NextResponse.json(
        createErrorResponse('GENERATION_FAILED', 'Image generation failed. Credits have been refunded.'),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image-to-image API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}
