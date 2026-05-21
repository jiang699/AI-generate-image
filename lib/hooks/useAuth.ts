"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  displayName: string;
  credits: number;
  isAdmin: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    token: null,
  });

  // 初始化时检查用户状态
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setAuthState({ user: null, loading: false, token: null });
          return;
        }

        // 获取用户会话token
        const { data: session } = await supabase.auth.getSession();
        
        // 获取用户信息（包括积分）
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, display_name, credits, is_admin')
          .eq('id', user.id)
          .single();

        if (userData) {
          setAuthState({
            user: {
              id: userData.id,
              email: userData.email,
              displayName: userData.display_name,
              credits: userData.credits,
              isAdmin: userData.is_admin,
            },
            loading: false,
            token: session?.session?.access_token || null,
          });
        } else {
          setAuthState({ user: null, loading: false, token: null });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setAuthState({ user: null, loading: false, token: null });
      }
    };

    fetchUser();

    // 监听认证状态变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setAuthState({ user: null, loading: false, token: null });
      }
    });

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    try {
      // 使用服务端 API 进行登录
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Login failed' };
      }

      if (data.success && data.data) {
        const accessToken = data.data.access_token || data.data.session || null;
        const refreshToken = data.data.refresh_token || null;

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }

        setAuthState({
          user: {
            id: data.data.user.id,
            email: data.data.user.email,
            displayName: data.data.user.displayName,
            credits: data.data.user.credits,
            isAdmin: data.data.user.isAdmin,
          },
          loading: false,
          token: accessToken,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Registration failed' };
      }

      if (data.success && data.data) {
        const accessToken = data.data.access_token || data.data.session || null;
        const refreshToken = data.data.refresh_token || null;

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }

        setAuthState({
          user: {
            id: data.data.user.id,
            email: data.data.user.email,
            displayName: data.data.user.displayName,
            credits: data.data.user.credits,
            isAdmin: false,
          },
          loading: false,
          token: accessToken,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({ user: null, loading: false, token: null });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  return {
    ...authState,
    signin,
    signup,
    signout,
  };
}
