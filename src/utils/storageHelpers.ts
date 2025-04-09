import { supabase } from '@/lib/supabase';

/**
 * Get the public URL for a file in Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param file - The file to upload
 * @returns Result object with success, error and publicUrl
 */
export async function uploadFileToStorage(
  bucket: string, 
  path: string, 
  file: File
): Promise<{ success: boolean; error?: any; publicUrl?: string }> {
  try {
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      return { success: false, error };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Check if a Supabase storage URL is valid/accessible
 * @param url - The URL to check
 * @returns True if valid, false otherwise
 */
export async function checkStorageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking storage URL:', error);
    return false;
  }
}

/**
 * Parse and extract bucket and path from a Supabase storage URL
 * @param url - The Supabase storage URL
 * @returns Object with bucket and path if valid, null otherwise
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    // Handle new format URLs (supabase.co/storage/v1/object/public/bucket/path)
    const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^\/]+)\/(.+)$/);
    
    if (match) {
      return {
        bucket: match[1],
        path: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
  }
}

/**
 * Fix a potentially broken Supabase storage URL
 * @param url - The URL to fix
 * @param defaultBucket - Default bucket if URL cannot be parsed
 * @returns The fixed URL or the original if it cannot be fixed
 */
export function fixStorageUrl(url: string, defaultBucket: string = 'employee-files'): string {
  // Handle cases where the URL is already correct
  if (url.includes('/storage/v1/object/public/')) {
    return url;
  }
  
  const parsed = parseStorageUrl(url);
  if (parsed) {
    return getPublicUrl(parsed.bucket, parsed.path);
  }
  
  // If we can't parse properly but URL contains a path, try to reconstruct it
  const simplePath = url.split('/').pop();
  if (simplePath) {
    return getPublicUrl(defaultBucket, simplePath);
  }
  
  return url;
} 