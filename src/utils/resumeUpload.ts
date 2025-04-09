import { supabase } from '@/lib/supabase';

/**
 * Ensures the employee-files bucket exists
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function ensureEmployeeFilesBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return { success: false, error: bucketsError.message };
    }
    
    // If bucket already exists, return success
    if (buckets?.some(bucket => bucket.name === 'employee-files')) {
      return { success: true };
    }
    
    // Create bucket
    const { error: createError } = await supabase.storage.createBucket('employee-files', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError);
      return { success: false, error: createError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Exception ensuring bucket exists:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
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
    
    const response = await fetch('/api/hr/resume-upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || response.statusText 
      };
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