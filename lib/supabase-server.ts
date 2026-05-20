import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';

export const createClient = async (request?: NextRequest) => {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 服务器组件不能设置 cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 服务器组件不能删除 cookies
          }
        },
      },
    }
  );
};

// 用于 API Route 的服务角色客户端（不需要 cookies）
export const createServiceClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        get(_name: string) {
          return null;
        },
        setAll(_cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // 不保存 cookies
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // 不保存 cookies
        },
        remove(_name: string, _options: CookieOptions) {
          // 不删除 cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
