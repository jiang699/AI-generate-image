import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 客户端配置 - 使用公共环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 检查环境变量是否配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not properly configured');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
}

// 客户端 Supabase 实例
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  credits: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string | null;
  mode: 'text' | 'image' | 'style' | 'optimize';
  settings: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'consume' | 'refund';
  amount: number;
  stripe_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  name: string | null;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}
