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
    // Normalize the path to ensure it doesn't start with a slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // In Supabase Storage, we don't need to create directories explicitly
    // They're automatically created when files are uploaded
    
    console.log(`Uploading file to ${bucket}/${normalizedPath}`);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(normalizedPath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error(`Upload error: ${error.message}`, error);
      return { success: false, error };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(normalizedPath);
    
    console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
    
    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Unexpected error in uploadFileToStorage:', error);
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
    if (!url) return null;
    
    // Handle new format URLs (supabase.co/storage/v1/object/public/bucket/path)
    let match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^\/]+)\/(.+)$/);
    
    if (match) {
      return {
        bucket: match[1],
        path: match[2]
      };
    }
    
    // Try alternate format (subdomain.supabase.co/storage/v1/object/bucket/path)
    match = url.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)$/);
    
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
  try {
    if (!url) return '';
    
    // If URL is already a public URL, return it as is
    if (url.includes('/storage/v1/object/public/')) {
      return url;
    }

    // If URL is a direct path, construct the public URL
    if (!url.includes('://')) {
      return getPublicUrl(defaultBucket, url);
    }

    // Try to parse the URL to extract bucket and path
    const parsed = parseStorageUrl(url);
    if (parsed) {
      return getPublicUrl(parsed.bucket, parsed.path);
    }

    // If we can't parse properly but URL contains a path, try to reconstruct it
    const pathParts = url.split('/');
    const simplePath = pathParts.slice(Math.max(pathParts.length - 2, 0)).join('/');
    if (simplePath) {
      return getPublicUrl(defaultBucket, simplePath);
    }

    // If all else fails, return the original URL
    return url;
  } catch (error) {
    console.error('Error fixing storage URL:', error);
    return url || '';
  }
} 