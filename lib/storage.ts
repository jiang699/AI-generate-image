import { supabase, supabaseAdmin } from './supabase';

export async function uploadGeneratedImage(userId: string, generationId: string, file: File): Promise<string | null> {
  const filePath = `${userId}/${generationId}.png`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('generated')
    .upload(filePath, file, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }
  
  const { data: urlData } = supabase.storage
    .from('generated')
    .getPublicUrl(filePath);
  
  return urlData?.publicUrl || null;
}

export async function deleteGeneratedImage(userId: string, generationId: string): Promise<boolean> {
  const filePath = `${userId}/${generationId}.png`;
  
  const { error } = await supabaseAdmin.storage
    .from('generated')
    .remove([filePath]);
  
  if (error) {
    console.error('Error deleting image:', error);
    return false;
  }
  
  return true;
}

export async function getImageUrl(userId: string, generationId: string): Promise<string | null> {
  const filePath = `${userId}/${generationId}.png`;
  
  const { data, error } = supabase.storage
    .from('generated')
    .getPublicUrl(filePath);
  
  if (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
  
  return data?.publicUrl || null;
}

export async function uploadTempFile(taskId: string, file: File): Promise<string | null> {
  const filePath = `${taskId}.tmp`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('temp')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading temp file:', error);
    return null;
  }
  
  return filePath;
}

export async function deleteTempFile(filePath: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from('temp')
    .remove([filePath]);
  
  if (error) {
    console.error('Error deleting temp file:', error);
    return false;
  }
  
  return true;
}

export async function downloadTempFile(filePath: string): Promise<Blob | null> {
  const { data, error } = await supabaseAdmin.storage
    .from('temp')
    .download(filePath);
  
  if (error) {
    console.error('Error downloading temp file:', error);
    return null;
  }
  
  return data;
}
