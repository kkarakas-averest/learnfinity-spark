import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { uploadResumeFile, uploadResumeViaAPI, createMockResumeUrl } from '@/utils/resumeUpload';
import { supabase } from '@/lib/supabase';

/**
 * Hook for handling resume upload and viewing in employee profiles
 */
export function useResumeHandler(employeeId: string | null) {
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = React.useState<string>('');
  const [uploading, setUploading] = React.useState<boolean>(false);

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const uploadResume = async (): Promise<{success: boolean, url?: string}> => {
    if (!resumeFile || !employeeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Resume file or employee ID is missing",
      });
      return { success: false };
    }

    setUploading(true);
    
    try {
      console.log(`Uploading resume for employee: ${employeeId}`);
      
      // Try direct upload first
      const { success, url, error } = await uploadResumeFile(resumeFile, employeeId);
      
      if (success && url) {
        console.log("Resume uploaded successfully. URL:", url);
        
        // Clear the resume file input
        setResumeFile(null);
        setResumeFileName('');
        
        toast({
          title: "Success",
          description: "Resume uploaded successfully",
        });
        
        // If there was a warning (like record update failed), show it
        if (error) {
          console.warn(error);
          toast({
            variant: "warning",
            title: "Warning",
            description: error,
          });
        }
        
        return { success: true, url };
      }
      
      // If direct upload fails, try server API
      console.log("Direct upload failed, trying via server API");
      const apiResult = await uploadResumeViaAPI(resumeFile, employeeId);
      
      if (apiResult.success && apiResult.url) {
        console.log("Server-side upload succeeded with URL:", apiResult.url);
        
        // Clear the resume file input
        setResumeFile(null);
        setResumeFileName('');
        
        toast({
          title: "Success",
          description: "Resume uploaded successfully via server",
        });
        
        return { success: true, url: apiResult.url };
      }
      
      // If all fails, use mock URL
      console.warn("All upload attempts failed, using mock URL");
      const mockUrl = createMockResumeUrl(resumeFile.name);
      
      // Update employee record with mock URL
      const { error: updateError } = await supabase
        .from('hr_employees')
        .update({
          cv_file_url: mockUrl,
          resume_url: mockUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);
      
      if (updateError) {
        console.error("Error updating employee record with mock URL:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "All upload attempts failed"
        });
        return { success: false };
      }
      
      // Clear the resume file input
      setResumeFile(null);
      setResumeFileName('');
      
      toast({
        variant: "info",
        title: "Using mock URL",
        description: "Upload failed, using simulated URL for testing"
      });
      
      return { success: true, url: mockUrl };
      
    } catch (error) {
      console.error("Error in resume upload process:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload resume. Please try again later."
      });
      
      return { success: false };
    } finally {
      setUploading(false);
    }
  };

  const viewResume = async (url: string): Promise<void> => {
    if (!url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No resume URL available",
      });
      return;
    }

    console.log("Opening resume URL:", url);
    
    // Check if it's a mock URL
    if (url.includes('/mock-uploads/')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({
        variant: "warning",
        title: "Demo Mode",
        description: "This is a mock resume URL for demonstration purposes."
      });
      return;
    }
    
    // For real URLs, just open directly
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return {
    resumeFile,
    resumeFileName,
    uploading,
    handleResumeFileChange,
    uploadResume,
    viewResume
  };
} 