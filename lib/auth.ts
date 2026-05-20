import { supabase, supabaseAdmin } from './supabase';
import { createUser, getUserById } from './database';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  if (data.user) {
    const existingUser = await getUserById(data.user.id);
    if (!existingUser) {
      await createUser(data.user.id, data.user.email!, data.user.email!.split('@')[0]);
    }
  }
  
  return data;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  if (data.user) {
    await createUser(data.user.id, data.user.email!, displayName);
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  const userData = await getUserById(user.id);
  
  return {
    ...user,
    ...userData
  };
}

export async function getServerUser(session: any) {
  if (!session?.user?.id) {
    return null;
  }
  
  const userData = await getUserById(session.user.id);
  
  if (!userData) {
    return null;
  }
  
  return {
    ...session.user,
    ...userData
  };
}

export function getAuthToken(): string | null {
  const session = supabase.auth.session();
  return session?.access_token || null;
}

export async function updateUserEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function updateUserPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}
