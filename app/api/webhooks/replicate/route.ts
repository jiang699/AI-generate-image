import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';

interface ReplicateWebhookPayload {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  webhook_received_at?: string;
  started_at?: string;
  completed_at?: string;
  logs?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证请求来源（生产环境应该验证签名）
    const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
    const signature = request.headers.get('replicate-signature');
    
    // 验证签名（如果配置了）
    if (webhookSecret && signature) {
      // 在生产环境中实现签名验证
      // const isValid = await verifyWebhookSignature(signature, webhookSecret, body);
      // if (!isValid) {
      //   return NextResponse.json(
      //     createErrorResponse('INVALID_SIGNATURE', 'Invalid webhook signature'),
      //     { status: 401 }
      //   );
      // }
    }

    // 2. 解析 Webhook 数据
    const payload: ReplicateWebhookPayload = await request.json();
    
    if (!payload.id) {
      return NextResponse.json(
        createErrorResponse('INVALID_PAYLOAD', 'Missing task ID'),
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 3. 查找对应的生成记录
    const { data: generation, error: findError } = await supabase
      .from('generations')
      .select('*, users!inner(id, credits)')
      .eq('settings->>replicate_id', payload.id)
      .single();

    if (findError || !generation) {
      console.error('Generation not found for replicate ID:', payload.id);
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Generation not found'),
        { status: 404 }
      );
    }

    // 4. 根据状态处理不同的逻辑
    switch (payload.status) {
      case 'succeeded':
        await handleSuccess(supabase, generation, payload);
        break;
      
      case 'failed':
      case 'canceled':
        await handleFailure(supabase, generation, payload);
        break;
      
      case 'processing':
      case 'starting':
        // 更新状态为处理中
        await supabase
          .from('generations')
          .update({ status: 'processing' })
          .eq('id', generation.id);
        break;
      
      default:
        console.log('Unknown status:', payload.status);
    }

    return NextResponse.json(createSuccessResponse({ message: 'Webhook processed' }));
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Webhook processing failed'),
      { status: 500 }
    );
  }
}

async function handleSuccess(
  supabase: ReturnType<typeof createServiceClient>,
  generation: any,
  payload: ReplicateWebhookPayload
) {
  try {
    // 1. 获取图片 URL
    let imageUrl: string | null = null;
    if (Array.isArray(payload.output) && payload.output.length > 0) {
      imageUrl = payload.output[0];
    } else if (typeof payload.output === 'string') {
      imageUrl = payload.output;
    }

    if (!imageUrl) {
      throw new Error('No image URL in output');
    }

    // 2. 下载图片
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // 3. 上传到 Supabase Storage
    const userId = generation.user_id;
    const generationId = generation.id;
    const filePath = `${userId}/${generationId}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload to storage:', uploadError);
      // 如果上传失败，仍然更新为成功状态，使用原始 URL
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    } else {
      // 获取公共 URL
      const { data: urlData } = supabase.storage
        .from('generated')
        .getPublicUrl(filePath);

      // 4. 更新生成记录
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          image_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);

      // 5. 记录成功日志
      await supabase.from('generation_history').insert({
        generation_id: generationId,
        status: 'completed',
      });
    }

    console.log('Generation completed successfully:', generationId);
  } catch (error) {
    console.error('Error in handleSuccess:', error);
    
    // 即使处理失败，也将状态更新为 failed
    await supabase
      .from('generations')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id);
    
    // 回滚积分
    await handleRollback(supabase, generation);
  }
}

async function handleFailure(
  supabase: ReturnType<typeof createServiceClient>,
  generation: any,
  payload: ReplicateWebhookPayload
) {
  try {
    console.error('Generation failed:', generation.id, payload.error);

    // 1. 更新生成记录为失败
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id);

    // 2. 记录失败日志
    await supabase.from('generation_history').insert({
      generation_id: generation.id,
      status: 'failed',
      error_message: payload.error || 'Generation failed',
    });

    // 3. 回滚积分
    await handleRollback(supabase, generation);

    console.log('Generation failed and credits rolled back:', generation.id);
  } catch (error) {
    console.error('Error in handleFailure:', error);
  }
}

async function handleRollback(
  supabase: ReturnType<typeof createServiceClient>,
  generation: any
) {
  try {
    // 获取本次生成消耗的积分
    const creditCost = getCreditCost(generation.mode);

    // 1. 回滚积分
    await supabase.rpc('update_credits', {
      user_id: generation.user_id,
      amount: creditCost,
    });

    // 2. 删除消费记录（如果之前有创建）
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', generation.user_id)
      .eq('description', `Image generation (${creditCost} credits)`)
      .eq('type', 'consume');

    console.log('Credits rolled back:', creditCost, 'for user:', generation.user_id);
  } catch (error) {
    console.error('Error rolling back credits:', error);
  }
}

function getCreditCost(mode: string): number {
  const costs: Record<string, number> = {
    text: parseInt(process.env.CREDIT_COST_TEXT_TO_IMAGE || '10'),
    image: parseInt(process.env.CREDIT_COST_IMAGE_TO_IMAGE || '15'),
    style: parseInt(process.env.CREDIT_COST_STYLE_TRANSFER || '20'),
    optimize: parseInt(process.env.CREDIT_COST_IMAGE_OPTIMIZE || '5'),
  };
  return costs[mode] || 10;
}
