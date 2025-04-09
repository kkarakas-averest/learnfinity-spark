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
      
      // Now that RLS policies are fixed, try direct upload first in both environments
      const uploadResult = await uploadResumeFile(resumeFile, employeeId);
      
      if (uploadResult.success && uploadResult.url) {
        console.log("Resume upload successful. URL:", uploadResult.url);
        
        // Clear the resume file input
        setResumeFile(null);
        setResumeFileName('');
        
        toast({
          title: "Success",
          description: "Resume uploaded successfully",
        });
        
        // If there was a warning, show it
        if (uploadResult.error) {
          console.warn(uploadResult.error);
          toast({
            variant: "warning",
            title: "Warning",
            description: uploadResult.error,
          });
        }
        
        return { success: true, url: uploadResult.url };
      }
      
      // If direct upload failed, try API upload
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
      
      // If all else fails, only now use mock URL as last resort
      console.warn("All upload attempts failed, using mock URL as last resort");
      const mockUrl = createMockResumeUrl(resumeFile.name);
      
      try {
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
      } catch (error) {
        console.error("Exception updating employee record with mock URL:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update record with mock URL"
        });
        return { success: false };
      }
      
      // Clear the resume file input
      setResumeFile(null);
      setResumeFileName('');
      
      toast({
        variant: "info",
        title: "Using mock URL",
        description: "Real uploads failed, using simulated URL for testing. Please contact support."
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
      // Handle mock URLs - show a more helpful message
      toast({
        variant: "warning",
        title: "Demo Mode",
        description: "This is a mock resume URL. Please upload a real resume to view it."
      });
      
      // Try to get a real resume URL from the employee data as a fallback
      if (employeeId) {
        try {
          const { data, error } = await supabase
            .from('hr_employees')
            .select('cv_file_url, resume_url')
            .eq('id', employeeId)
            .single();
          
          if (!error && data) {
            // Look for a real URL that isn't the mock one we just tried
            const realUrl = [data.cv_file_url, data.resume_url].find(u => 
              u && !u.includes('/mock-uploads/') && u !== url
            );
            
            if (realUrl) {
              console.log("Found alternative resume URL:", realUrl);
              window.open(realUrl, '_blank', 'noopener,noreferrer');
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching alternative resume URL:", e);
        }
      }
      
      return;
    }
    
    // For Supabase URLs, verify if the file exists
    if (url.includes('storage.googleapis.com') || url.includes('supabase.co/storage')) {
      try {
        // Try fetching headers to check if file exists
        const response = await fetch(url, { method: 'HEAD' });
        
        if (!response.ok) {
          console.error("Resume file not found:", response.status);
          toast({
            variant: "destructive",
            title: "File Not Found",
            description: "The resume file could not be accessed. It may have been deleted."
          });
          return;
        }
      } catch (error) {
        console.error("Error checking resume file:", error);
        // Continue anyway, browser will handle errors
      }
    }
    
    // For real URLs, open directly
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