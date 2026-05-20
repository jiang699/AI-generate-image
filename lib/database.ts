import { supabase, supabaseAdmin, type User, type Generation, type Transaction, type ApiKey } from './supabase';

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

export async function createUser(userId: string, email: string, displayName: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      credits: 0,
      is_admin: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  
  return data;
}

export async function updateUser(userId: string, updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  
  return data;
}

export async function updateUserCredits(userId: string, amount: number): Promise<boolean> {
  const { error } = await supabaseAdmin.rpc('update_credits', {
    user_id: userId,
    amount: amount
  });
  
  if (error) {
    console.error('Error updating credits:', error);
    return false;
  }
  
  return true;
}

export async function createGeneration(
  userId: string,
  prompt: string,
  mode: Generation['mode'],
  settings: Record<string, unknown>
): Promise<Generation | null> {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .insert({
      user_id: userId,
      prompt,
      mode,
      settings,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating generation:', error);
    return null;
  }
  
  return data;
}

export async function updateGeneration(
  generationId: string,
  updates: Partial<Pick<Generation, 'status' | 'image_url'>>
): Promise<Generation | null> {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .update(updates)
    .eq('id', generationId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating generation:', error);
    return null;
  }
  
  return data;
}

export async function getGenerationsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20,
  mode?: Generation['mode']
): Promise<{ items: Generation[]; total: number }> {
  let query = supabaseAdmin
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  if (mode) {
    query = query.eq('mode', mode);
  }
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('Error fetching generations:', error);
    return { items: [], total: 0 };
  }
  
  return { items: data || [], total: count || 0 };
}

export async function deleteGeneration(generationId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('generations')
    .delete()
    .eq('id', generationId);
  
  if (error) {
    console.error('Error deleting generation:', error);
    return false;
  }
  
  return true;
}

export async function createTransaction(
  userId: string,
  type: Transaction['type'],
  amount: number,
  stripeId?: string,
  description?: string
): Promise<Transaction | null> {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      stripe_id: stripeId,
      description
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  
  return data;
}

export async function getTransactionsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20,
  type?: Transaction['type']
): Promise<{ items: Transaction[]; total: number }> {
  let query = supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return { items: [], total: 0 };
  }
  
  return { items: data || [], total: count || 0 };
}

export async function createApiKey(
  userId: string,
  keyHash: string,
  name: string,
  expiresAt?: string
): Promise<ApiKey | null> {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: userId,
      key_hash: keyHash,
      name,
      expires_at: expiresAt
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating API key:', error);
    return null;
  }
  
  return data;
}

export async function deleteApiKey(apiKeyId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .delete()
    .eq('id', apiKeyId);
  
  if (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
  
  return true;
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single();
  
  if (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
  
  return data;
}
