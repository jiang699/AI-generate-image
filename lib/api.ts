import { createServiceClient } from './supabase-server';
import type { Generation } from './supabase';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
}

// 创建成功响应
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// 创建错误响应
export function createErrorResponse(code: string, message: string): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

// 验证用户身份
export async function verifyAuth(request: Request) {
  const supabase = createServiceClient();
  
  // 获取授权头
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  // 验证 JWT
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// 检查用户积分
export async function checkAndDeductCredits(
  userId: string,
  requiredCredits: number
): Promise<{ success: boolean; error?: ApiError }> {
  const supabase = createServiceClient();
  
  try {
    // 获取用户积分
    const { data: user } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', userId)
      .single();
    
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }
    
    if (user.credits < requiredCredits) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'Need more credits',
        },
      };
    }
    
    // 扣除积分
    await supabase
      .from('users')
      .update({ credits: user.credits - requiredCredits })
      .eq('id', userId);
    
    // 创建消费记录
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'consume',
      amount: requiredCredits,
      description: `Image generation (${requiredCredits} credits)`,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error checking and deducting credits:', error);
    return {
      success: false,
      error: {
        code: 'CREDIT_ERROR',
        message: 'Failed to deduct credits',
      },
    };
  }
}

// 创建生成记录
export async function createGenerationRecord(
  userId: string,
  prompt: string,
  mode: Generation['mode'],
  settings: Record<string, unknown>
): Promise<{ success: boolean; data?: Generation; error?: ApiError }> {
  const supabase = createServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        prompt,
        mode,
        settings,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating generation record:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Failed to create generation record',
        },
      };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating generation record:', error);
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to create generation record',
      },
    };
  }
}

// 更新生成记录
export async function updateGenerationRecord(
  generationId: string,
  updates: Partial<Pick<Generation, 'status' | 'image_url'>>
) {
  const supabase = createServiceClient();
  
  await supabase
    .from('generations')
    .update(updates)
    .eq('id', generationId);
}
