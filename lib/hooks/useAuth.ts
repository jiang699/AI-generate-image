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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // 获取用户信息
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, display_name, credits, is_admin')
          .eq('id', data.user.id)
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
            token: data.session?.access_token || null,
          });
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // 创建用户记录（赠送100积分）
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName,
          credits: 100,
          is_admin: false,
        });

        // 创建交易记录
        await supabase.from('transactions').insert({
          user_id: data.user.id,
          type: 'purchase',
          amount: 100,
          description: 'Welcome bonus',
        });

        setAuthState({
          user: {
            id: data.user.id,
            email: data.user.email!,
            displayName,
            credits: 100,
            isAdmin: false,
          },
          loading: false,
          token: data.session?.access_token || null,
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
