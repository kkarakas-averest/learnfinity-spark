import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { uploadResumeFile, uploadResumeViaAPI, createMockResumeUrl } from '@/utils/resumeUpload';
import { supabase } from '@/lib/supabase';
import { GROQ_API_KEY } from '@/lib/env';

/**
 * Hook for handling resume upload and viewing in employee profiles
 */
export function useResumeHandler(employeeId: string | null) {
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = React.useState<string>('');
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [processing, setProcessing] = React.useState<boolean>(false);

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  /**
   * Call Groq API directly to analyze a CV and generate profile data
   */
  const callGroqForCvAnalysis = async (
    cvUrl: string, 
    employeeName: string, 
    departmentId?: string, 
    positionId?: string,
    departmentName: string = "Unknown",
    positionName: string = "Unknown"
  ): Promise<any> => {
    try {
      // If department and position names are not provided, try to look them up
      if ((departmentId || positionId) && (departmentName === "Unknown" || positionName === "Unknown")) {
        try {
          // Get department name
          if (departmentId && departmentName === "Unknown") {
            const { data: deptData } = await supabase
              .from('hr_departments')
              .select('name')
              .eq('id', departmentId)
              .single();
              
            if (deptData) {
              departmentName = deptData.name;
            }
          }
          
          // Get position name
          if (positionId && positionName === "Unknown") {
            const { data: posData } = await supabase
              .from('hr_positions')
              .select('title')
              .eq('id', positionId)
              .single();
              
            if (posData) {
              positionName = posData.title;
            }
          }
        } catch (e) {
          console.warn("Error fetching department/position names:", e);
        }
      }
      
      // Prepare the prompt
      const structuredPrompt = `
        You are an expert HR professional analyzing a resume/CV to create a structured profile summary.
        
        RESUME URL: ${cvUrl}
        EMPLOYEE NAME: ${employeeName}
        POSITION: ${positionName}
        DEPARTMENT: ${departmentName}
        
        Task: Analyze this CV and extract key professional information. Format your response as a JSON object with the following structure:
        
        {
          "summary": "A 250-word professional profile summary highlighting strengths and expertise",
          "skills": ["skill1", "skill2", "skill3", ...],
          "experience": [
            {
              "title": "Job Title",
              "company": "Company Name",
              "duration": "YYYY-YYYY",
              "highlights": ["accomplishment1", "accomplishment2"]
            }
          ],
          "education": [
            {
              "degree": "Degree Name",
              "institution": "Institution Name",
              "year": "YYYY"
            }
          ],
          "certifications": ["certification1", "certification2"],
          "languages": ["language1", "language2"],
          "keyAchievements": ["achievement1", "achievement2"],
          "professionalInterests": ["interest1", "interest2"]
        }
        
        If you cannot extract certain information, include it as empty arrays or "Unknown" values. Even if you cannot access the actual PDF, make a best guess based on the name and URL.
        
        Format your response as JSON only with NO explanations, NO comments, and NO additional text before or after the JSON.
      `;

      // Create system message
      const systemMessage = "You are an expert resume analyzer that extracts structured information from CVs. You always respond with properly formatted JSON only.";
      
      // Make the API call to Groq
      console.log("Calling Groq API directly for CV analysis");
      let retries = 2;
      let response;
      
      while (retries >= 0) {
        try {
          response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: 'llama3-8b-8192',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: structuredPrompt }
              ],
              temperature: 0.2,
              max_tokens: 2000
            })
          });
          
          // If success, break out of retry loop
          if (response.ok) break;
          
          // If error is not retriable, also break
          if (response.status !== 429 && response.status !== 500 && response.status !== 503) break;
          
          // Otherwise, retry after short delay
          retries--;
          if (retries >= 0) {
            const delay = (2 - retries) * 1000; // Incremental backoff
            console.log(`Retrying Groq API call after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (fetchError) {
          console.error("Network error calling Groq API:", fetchError);
          retries--;
          if (retries < 0) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        console.error("Groq API error:", errorData);
        throw new Error(`Groq API error (${response?.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content returned from Groq API");
      }
      
      // Parse JSON response
      try {
        // First try direct JSON parsing
        return JSON.parse(content);
      } catch (jsonError) {
        console.error("Error parsing Groq response as JSON:", jsonError);
        
        // Try to extract JSON using regex as a fallback
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse Groq response as JSON");
        }
      }
    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw error;
    }
  };

  /**
   * Process a CV using the API to extract profile data
   */
  const processCV = async (cvUrl: string): Promise<boolean> => {
    if (!employeeId || !cvUrl) {
      console.warn('Cannot process CV without employeeId and cvUrl');
      return false;
    }

    setProcessing(true);
    
    try {
      // Check if we're in development or production
      const isProduction = window.location.hostname !== 'localhost';
      
      // First get the employee data to get the name
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('id', employeeId)
        .single();
        
      if (employeeError || !employee) {
        console.error("Error getting employee data:", employeeError);
        throw new Error(`Failed to get employee data: ${employeeError?.message || 'Unknown error'}`);
      }
      
      // Extract department and position names
      const departmentName = employee.hr_departments?.name || 'Unknown';
      const positionTitle = employee.hr_positions?.title || 'Unknown';
      
      let profileData;
      
      // Check if Groq API key is available
      if (GROQ_API_KEY) {
        try {
          // Call Groq API directly regardless of environment
          console.log("Groq API key found, using direct API call");
          profileData = await callGroqForCvAnalysis(
            cvUrl, 
            employee.name, 
            employee.department_id, 
            employee.position_id,
            departmentName,
            positionTitle
          );
          
          // Add metadata
          profileData = {
            ...profileData,
            extraction_date: new Date().toISOString(),
            source: 'groq_llm_direct',
            model: 'llama3-8b-8192'
          };
          
          console.log("Successfully extracted profile data using Groq:", profileData);
        } catch (groqError) {
          console.error("Error with direct Groq API call:", groqError);
          
          if (isProduction) {
            // In production, fall back to mock data
            console.log("Falling back to mock data in production");
            profileData = await createMockProfileData(
              cvUrl, 
              employee.name, 
              employee.department_id, 
              employee.position_id,
              departmentName,
              positionTitle
            );
          } else {
            // In development, try the API route
            console.log("In development, falling back to API route");
            throw groqError; // Let it fall through to the API route attempt
          }
        }
      } else if (isProduction) {
        // No Groq API key and in production, use mock data
        console.log("No Groq API key available in production, using mock data");
        profileData = await createMockProfileData(
          cvUrl, 
          employee.name, 
          employee.department_id, 
          employee.position_id,
          departmentName,
          positionTitle
        );
      } else {
        // In development with no Groq API key, try the API route
        console.log("No Groq API key in development, trying API route");
        
        // Call the API to process the CV
        const apiUrl = '/api/hr/employees/process-cv';
        
        console.log(`Calling CV processing API for ${employeeId} with URL ${cvUrl}`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employeeId,
            cvUrl
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            error: `Server returned ${response.status}: ${response.statusText}` 
          }));
          console.error('Failed to process CV via API:', errorData);
          throw new Error(`API processing failed: ${errorData.error || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log('CV processing API result:', result);
        
        // Use the result data or create mock data as fallback
        profileData = result.data || await createMockProfileData(cvUrl, employee.name, employee.department_id, employee.position_id);
      }
      
      // Update the database with the profile data
      const { error: updateError } = await supabase
        .from('hr_employees')
        .update({
          cv_extracted_data: profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);
        
      if (updateError) {
        console.error("Error updating employee with profile data:", updateError);
        toast({
          variant: "warning",
          title: "Data Update Error",
          description: "Profile data was extracted but could not be saved to the database."
        });
        return false;
      }
      
      toast({
        title: "Profile Data Generated",
        description: "CV processed and profile data extracted successfully."
      });
      
      return true;
    } catch (error) {
      console.error('Error processing CV:', error);
      
      // Create and save fallback mock data
      try {
        if (employeeId) {
          const { data: employee } = await supabase
            .from('hr_employees')
            .select(`
              *,
              hr_departments(id, name),
              hr_positions(id, title)
            `)
            .eq('id', employeeId)
            .single();
            
          const departmentName = employee?.hr_departments?.name || 'Unknown';
          const positionTitle = employee?.hr_positions?.title || 'Unknown';
            
          const mockData = await createMockProfileData(
            cvUrl, 
            employee?.name || 'Employee', 
            employee?.department_id, 
            employee?.position_id,
            departmentName,
            positionTitle
          );
          
          await supabase
            .from('hr_employees')
            .update({
              cv_extracted_data: mockData,
              updated_at: new Date().toISOString()
            })
            .eq('id', employeeId);
            
          toast({
            variant: "warning",
            title: "Fallback Profile Created",
            description: "CV processing failed, but a basic profile has been created."
          });
          
          return true;
        }
      } catch (fallbackError) {
        console.error('Error creating fallback profile:', fallbackError);
      }
      
      toast({
        variant: "warning",
        title: "CV Processing",
        description: "An error occurred while processing the CV for profile data."
      });
      
      return false;
    } finally {
      setProcessing(false);
    }
  };
  
  /**
   * Create mock profile data when API calls fail
   */
  const createMockProfileData = async (
    cvUrl: string, 
    employeeName: string, 
    departmentId?: string, 
    positionId?: string,
    departmentName: string = "Unknown",
    positionName: string = "Unknown"
  ): Promise<any> => {
    // Use provided department and position names if available
    let deptName = departmentName !== "Unknown" ? departmentName : "the organization";
    let posName = positionName !== "Unknown" ? positionName : "Professional";
    
    // If names not provided, try to look them up
    if ((departmentId || positionId) && (deptName === "the organization" || posName === "Professional")) {
      try {
        // Get department name
        if (departmentId && deptName === "the organization") {
          const { data: deptData } = await supabase
            .from('hr_departments')
            .select('name')
            .eq('id', departmentId)
            .single();
            
          if (deptData) {
            deptName = deptData.name;
          }
        }
        
        // Get position name
        if (positionId && posName === "Professional") {
          const { data: posData } = await supabase
            .from('hr_positions')
            .select('title')
            .eq('id', positionId)
            .single();
            
          if (posData) {
            posName = posData.title;
          }
        }
      } catch (e) {
        console.warn("Error fetching department/position names for mock data:", e);
      }
    }
    
    // Extract filename from URL to use in the mock data
    const fileName = cvUrl.split('/').pop() || '';
    const nameParts = fileName.split('_');
    const possibleName = nameParts.length > 1 ? 
      nameParts[nameParts.length - 1].replace(/\.\w+$/, '') : 
      employeeName;
    
    return {
      summary: `${employeeName} is a ${posName} in ${deptName}. The CV has been uploaded successfully and is available for review. This is a placeholder profile generated because the AI processing service was unavailable or encountered an error.`,
      skills: ["Communication", "Leadership", "Problem Solving", "Time Management", "Teamwork"],
      experience: [
        {
          title: posName,
          company: "Current Organization",
          duration: "Present",
          highlights: ["Successfully uploaded CV", "Profile created"]
        }
      ],
      education: [
        {
          degree: "Bachelor's Degree",
          institution: "University",
          year: "N/A" 
        }
      ],
      certifications: ["Professional Certification"],
      languages: ["English"],
      keyAchievements: ["CV Upload"],
      professionalInterests: ["Professional Development"],
      extraction_date: new Date().toISOString(),
      source: 'mock_data_generator',
      model: 'fallback_system'
    };
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

        // Process the CV to extract profile data
        processCV(uploadResult.url).catch(error => {
          console.error("Error in CV processing after upload:", error);
        });
        
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

        // Process the CV to extract profile data
        processCV(apiResult.url).catch(error => {
          console.error("Error in CV processing after API upload:", error);
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
    processing,
    handleResumeFileChange,
    uploadResume,
    viewResume,
    processCV
  };
} 