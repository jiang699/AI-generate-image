"use client";

import { createContext, useContext, useCallback, useState } from 'react';
import { useAuth, type User } from '@/lib/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<{ success: boolean; error?: string }>;
  showSigninModal: boolean;
  setShowSigninModal: (show: boolean) => void;
  showSignupModal: boolean;
  setShowSignupModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, loading, signin, signup, signout } = useAuth();
  const [showSigninModal, setShowSigninModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleSignin = useCallback(async (email: string, password: string) => {
    const result = await signin(email, password);
    if (result.success) {
      setShowSigninModal(false);
    }
    return result;
  }, [signin]);

  const handleSignup = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await signup(email, password, displayName);
    if (result.success) {
      setShowSignupModal(false);
    }
    return result;
  }, [signup]);

  const handleSignout = useCallback(async () => {
    const result = await signout();
    return result;
  }, [signout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signin: handleSignin,
        signup: handleSignup,
        signout: handleSignout,
        showSigninModal,
        setShowSigninModal,
        showSignupModal,
        setShowSignupModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
