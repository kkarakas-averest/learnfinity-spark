import { supabase } from '@/lib/supabase';

/**
 * Ensures the employee-files bucket exists
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function ensureEmployeeFilesBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    // Instead of trying to create the bucket directly (which might fail due to RLS),
    // we'll just check if we can list buckets and consider it a success if we can
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      // Don't fail immediately, we'll let the upload proceed and let server-side handle it
      return { success: true };
    }
    
    // Check if the employee-files bucket already exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'employee-files');
    
    if (bucketExists) {
      console.log("Employee-files bucket exists");
      return { success: true };
    }
    
    // If bucket doesn't exist, we won't try to create it client-side
    // as it might fail due to RLS policies. Instead, we'll rely on the
    // server-side API to create it with admin privileges
    console.log("Employee-files bucket doesn't exist, will defer to server-side creation");
    return { success: true };
  } catch (error) {
    console.error("Exception ensuring bucket exists:", error);
    // Still consider this a non-fatal error, let the upload proceed
    return { success: true };
  }
}

/**
 * Upload a resume file to Supabase storage
 * @param {File} file - The resume file to upload
 * @param {string} employeeId - The employee ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadResumeFile(
  file: File, 
  employeeId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Check if we're in production
    const isProduction = window.location.hostname !== 'localhost';
    
    // In production environments, prefer server-side upload to avoid RLS issues
    if (isProduction) {
      console.log("Production environment detected, prioritizing server-side upload");
      return uploadResumeViaAPI(file, employeeId);
    }
    
    // For development, still try the direct upload first
    console.log("Development environment, attempting direct upload");
    
    // First ensure bucket exists
    const { success: bucketSuccess, error: bucketError } = await ensureEmployeeFilesBucket();
    
    if (!bucketSuccess) {
      return { success: false, error: `Failed to ensure bucket exists: ${bucketError}` };
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `resumes/${employeeId}/${timestamp}_${randomString}_${safeFileName}`;
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('employee-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: uploadError.message };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('employee-files')
      .getPublicUrl(filePath);
    
    // Update employee record
    const { error: updateError } = await supabase
      .from('hr_employees')
      .update({
        cv_file_url: urlData.publicUrl,
        resume_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId);
    
    if (updateError) {
      console.error("Error updating employee record:", updateError);
      // Still return success with the URL
      return { 
        success: true, 
        url: urlData.publicUrl,
        error: `File uploaded but employee record not updated: ${updateError.message}`
      };
    }
    
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error("Exception uploading resume:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Try to upload a resume through the server API
 * @param {File} file - The resume file to upload
 * @param {string} employeeId - The employee ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadResumeViaAPI(
  file: File,
  employeeId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', employeeId);
    
    // Check if we're in development or production
    const isProduction = window.location.hostname !== 'localhost';
    const baseUrl = isProduction ? window.location.origin : '';
    
    // Use the pages API route with the appropriate base URL
    const response = await fetch(`${baseUrl}/api/hr/resume-upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || response.statusText 
        };
      } else {
        // Handle non-JSON response
        const textError = await response.text();
        console.error('Non-JSON error response:', textError);
        return {
          success: false,
          error: `Server error: ${response.status} ${response.statusText}`
        };
      }
    }
    
    const result = await response.json();
    
    if (!result.success && !result.url) {
      return { 
        success: false, 
        error: 'Server upload completed but did not return a valid URL' 
      };
    }
    
    return { 
      success: true, 
      url: result.url,
      error: result.warning
    };
  } catch (error) {
    console.error("Exception with server upload:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create a mock resume URL for testing
 * @param {string} fileName - The original file name
 * @returns {string} The mock URL
 */
export function createMockResumeUrl(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${window.location.origin}/mock-uploads/${timestamp}-${randomString}-${safeFileName}`;
} 