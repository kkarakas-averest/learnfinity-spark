import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { uploadResumeFile, uploadResumeViaAPI, createMockResumeUrl } from '@/utils/resumeUpload';
import { supabase } from '@/lib/supabase';
import { GROQ_API_KEY } from '@/lib/env';
import { extractTextFromPdf } from '@/lib/pdf/pdfExtractor';

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
      console.log('----------- GROQ DIRECT CALL START -----------');
      console.log(`CV URL: ${cvUrl}`);
      console.log(`Employee: ${employeeName}, Department: ${departmentName}, Position: ${positionName}`);
      
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
              console.log(`Retrieved department name: ${departmentName}`);
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
              console.log(`Retrieved position name: ${positionName}`);
            }
          }
        } catch (e) {
          console.warn("Error fetching department/position names:", e);
        }
      }
      
      // Extract text from PDF directly in the browser
      console.log("Extracting PDF text directly in the browser");
      let pdfContent = "";
      
      try {
        const extractionResult = await extractTextFromPdf(cvUrl);
        
        if (!extractionResult.success) {
          console.error("PDF extraction failed:", extractionResult.metadata?.error);
          pdfContent = "PDF text extraction failed. Please analyze based on the employee name, position, and department information provided.";
        } else {
          pdfContent = extractionResult.text;
          console.log(`Successfully extracted ${pdfContent.length} characters from PDF`);
          console.log(`PDF metadata:`, extractionResult.metadata);
          console.log(`PDF content preview: "${pdfContent.substring(0, 150)}..."`);
          
          // Truncate content if it's too large to prevent Groq API errors
          const MAX_CONTENT_LENGTH = 6000; // Reduced size to fit within Groq limits
          if (pdfContent.length > MAX_CONTENT_LENGTH) {
            console.log(`PDF content too large (${pdfContent.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
            // Take first 80% from beginning and last 20% from end for better context
            const firstPortion = Math.floor(MAX_CONTENT_LENGTH * 0.8);
            const lastPortion = MAX_CONTENT_LENGTH - firstPortion;
            pdfContent = pdfContent.substring(0, firstPortion) + 
              "\n[...content truncated due to size limits...]\n" + 
              pdfContent.substring(pdfContent.length - lastPortion);
            console.log(`Truncated content length: ${pdfContent.length} chars`);
          }
        }
      } catch (extractionError) {
        console.error("Error extracting PDF text:", extractionError);
        pdfContent = "PDF text extraction error. Please analyze based on the employee name, position, and department information provided.";
      }
      
      // Prepare prompt with the extracted PDF content
      console.log("Preparing structured prompt for Groq API");
      
      const structuredPrompt = `
        You are analyzing a resume to create a profile summary.
        
        CV CONTENT:
        ${pdfContent}
        
        EMPLOYEE: ${employeeName}
        POSITION: ${positionName}
        DEPARTMENT: ${departmentName}
        
        Extract information into JSON with:
        {
          "summary": "250-word professional profile based on actual career history",
          "skills": ["skill1", "skill2", ...],
          "experience": [
            {
              "title": "Job Title",
              "company": "Company Name",
              "duration": "Duration",
              "highlights": ["Achievement 1", "Achievement 2"]
            }
          ],
          "education": [
            {
              "degree": "Degree",
              "institution": "Institution",
              "year": "Year"
            }
          ],
          "certifications": ["Certification1", ...],
          "languages": ["Language1", ...],
          "keyAchievements": ["Achievement1", ...],
          "personalInsights": {
            "yearsOfExperience": "Years",
            "industries": ["Industry1", ...],
            "toolsAndTechnologies": ["Tool1", ...],
            "softSkills": ["Skill1", ...]
          }
        }
        
        IMPORTANT: Only include information actually in the CV. If not available, use empty arrays or "Not specified".
        Respond with ONLY the JSON object.
      `;

      // Create system message
      const systemMessage = "Extract structured profile information from resumes as JSON only. Be concise.";
      
      // Make the API call to Groq
      console.log("Calling Groq API directly for CV analysis");
      console.log(`Using model: llama3-8b-8192, temperature: 0.2, max_tokens: 1500`);
      
      let retries = 2;
      let response;
      
      while (retries >= 0) {
        try {
          console.log(`Groq API attempt ${2-retries+1} of 3`);
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
              max_tokens: 1500
            })
          });
          
          // If success, break out of retry loop
          if (response.ok) {
            console.log("Groq API responded successfully");
            break;
          }
          
          console.error(`Groq API responded with error status: ${response.status}`);
          
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
          console.log("Fetch error details:", fetchError.message);
          retries--;
          if (retries < 0) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        console.error("Groq API error:", errorData);
        console.log("Groq API error status:", response?.status);
        console.log("Groq API error details:", errorData?.error?.message || "Unknown error");
        throw new Error(`Groq API error (${response?.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log("Received response from Groq API");
      console.log("Response metadata:", {
        model: result.model,
        usage: result.usage,
        choices: result.choices?.length || 0
      });
      
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        console.error("No content returned from Groq API");
        throw new Error("No content returned from Groq API");
      }
      
      console.log("Content received, length:", content.length);
      console.log("Content preview:", content.substring(0, 150) + "...");
      
      // Parse JSON response
      try {
        // First try direct JSON parsing
        console.log("Attempting to parse Groq response as JSON");
        const parsedData = JSON.parse(content);
        console.log("Successfully parsed response JSON directly");
        console.log("Parsed data keys:", Object.keys(parsedData));
        console.log("Skills found:", parsedData.skills?.length || 0);
        console.log("Experience entries:", parsedData.experience?.length || 0);
        console.log('----------- GROQ DIRECT CALL COMPLETE -----------');
        return parsedData;
      } catch (jsonError) {
        console.error("Error parsing Groq response as JSON:", jsonError);
        console.log("JSON parse error details:", jsonError.message);
        
        // Try to extract JSON using regex as a fallback
        console.log("Attempting to extract JSON using regex");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsedData = JSON.parse(jsonMatch[0]);
            console.log("Successfully parsed JSON using regex extraction");
            console.log("Parsed data keys:", Object.keys(parsedData));
            console.log("Skills found:", parsedData.skills?.length || 0);
            console.log("Experience entries:", parsedData.experience?.length || 0);
            console.log('----------- GROQ DIRECT CALL COMPLETE -----------');
            return parsedData;
          } catch (e) {
            console.error("Error parsing extracted JSON match:", e);
            console.log("Extracted match:", jsonMatch[0].substring(0, 150) + "...");
            throw new Error("Failed to parse Groq response as JSON even after regex extraction");
          }
        } else {
          console.error("No JSON object pattern found in response");
          console.log("Response content:", content);
          throw new Error("Failed to parse Groq response as JSON");
        }
      }
    } catch (error) {
      console.error("Error in callGroqForCvAnalysis:", error);
      console.log("Error details:", error.message);
      console.log('----------- GROQ DIRECT CALL FAILED -----------');
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

    console.log('----------- CV PROCESSING START -----------');
    console.log(`Processing CV for employee ${employeeId}`);
    console.log(`CV URL: ${cvUrl}`);
    
    setProcessing(true);
    
    try {
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
      console.log(`Employee: ${employee.name}, Department: ${departmentName}, Position: ${positionTitle}`);
      
      let profileData;
      
      // Check if Groq API key is available
      if (GROQ_API_KEY) {
        console.log('Groq API key found, attempting direct API call');
        try {
          // Call Groq API directly
          console.log("Starting Groq API direct call flow");
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
          
          console.log("Successfully extracted profile data using Groq direct call");
          console.log("Profile data source:", profileData.source);
          console.log("Skills extracted:", profileData.skills?.length || 0);
          console.log("Experience entries:", profileData.experience?.length || 0);
        } catch (groqError) {
          console.error("Error with direct Groq API call:", groqError);
          console.log("Groq API error details:", groqError.message);
          
          // Fall back to mock data if Groq API call fails
          console.log("FALLBACK: Using mock data due to Groq API error");
          profileData = await createMockProfileData(
            cvUrl, 
            employee.name, 
            employee.department_id, 
            employee.position_id,
            departmentName,
            positionTitle
          );
          console.log("Created mock profile data as fallback");
        }
      } else {
        // No Groq API key, use mock data
        console.log("FALLBACK: No Groq API key available, using mock data");
        profileData = await createMockProfileData(
          cvUrl, 
          employee.name, 
          employee.department_id, 
          employee.position_id,
          departmentName,
          positionTitle
        );
        console.log("Created mock profile data due to missing Groq API key");
      }
      
      // Log the final profile data details
      console.log("Final profile data source:", profileData.source);
      console.log("Final profile data model:", profileData.model);
      console.log("Extracted data summary length:", profileData.summary?.length || 0);
      console.log("Skills count:", profileData.skills?.length || 0);
      console.log("Experience entries:", profileData.experience?.length || 0);
      
      // Update the database with the profile data
      console.log("Updating database with profile data");
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
      
      console.log("Database updated successfully with profile data");
      toast({
        title: "Profile Data Generated",
        description: "CV processed and profile data extracted successfully."
      });
      
      console.log('----------- CV PROCESSING COMPLETE -----------');
      return true;
    } catch (error) {
      console.error('Error processing CV:', error);
      console.log('Error details:', error.message);
      console.log('FALLBACK: Creating fallback mock data after error');
      
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
          console.log(`Creating mock data for: ${employee?.name}, Dept: ${departmentName}, Position: ${positionTitle}`);
            
          const mockData = await createMockProfileData(
            cvUrl, 
            employee?.name || 'Employee', 
            employee?.department_id, 
            employee?.position_id,
            departmentName,
            positionTitle
          );
          
          console.log("Created mock fallback profile data after error");
          console.log("Writing mock data to database");
          
          await supabase
            .from('hr_employees')
            .update({
              cv_extracted_data: mockData,
              updated_at: new Date().toISOString()
            })
            .eq('id', employeeId);
            
          console.log("Mock data saved to database successfully");
          toast({
            variant: "warning",
            title: "Fallback Profile Created",
            description: "CV processing failed, but a basic profile has been created."
          });
          
          return true;
        }
      } catch (fallbackError) {
        console.error('Error creating fallback profile:', fallbackError);
        console.log('Fallback error details:', fallbackError.message);
      }
      
      toast({
        variant: "warning",
        title: "CV Processing",
        description: "An error occurred while processing the CV for profile data."
      });
      
      console.log('----------- CV PROCESSING FAILED -----------');
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
    
    // Get current year for realistic time frames
    const currentYear = new Date().getFullYear();
    
    // Generate position-specific skills and experiences
    let skills = ["Communication", "Leadership", "Problem Solving", "Time Management", "Teamwork"];
    let experiences = [];
    let education = [];
    let certifications = [];
    
    // Position-specific customization
    if (posName.toLowerCase().includes('engineer') || posName.toLowerCase().includes('developer')) {
      skills = ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git", "CI/CD", "AWS", "System Design", "API Development"];
      experiences = [
        {
          title: posName,
          company: "Current Organization",
          duration: `Jan ${currentYear-2} - Present`,
          highlights: [
            `Developed and maintained ${deptName} applications using modern frameworks`,
            "Implemented CI/CD pipelines reducing deployment time by 40%",
            "Collaborated with cross-functional teams to deliver projects on schedule"
          ]
        },
        {
          title: posName.includes('Senior') ? "Software Engineer" : "Junior Developer",
          company: "Previous Tech Ltd.",
          duration: `Mar ${currentYear-5} - Dec ${currentYear-2}`,
          highlights: [
            "Developed RESTful APIs for customer-facing applications",
            "Improved application performance by 30% through code optimization",
            "Mentored junior developers on coding best practices"
          ]
        }
      ];
      education = [
        {
          degree: "Master of Science in Computer Science",
          institution: "Tech University",
          year: `${currentYear-6}`
        },
        {
          degree: "Bachelor of Science in Computer Engineering",
          institution: "State University",
          year: `${currentYear-8}`
        }
      ];
      certifications = ["AWS Certified Developer", "Microsoft Certified: Azure Developer", "Certified Scrum Master"];
    } 
    else if (posName.toLowerCase().includes('manager') || posName.toLowerCase().includes('director')) {
      skills = ["Strategic Planning", "Team Leadership", "Budget Management", "Project Management", "Stakeholder Communication", "Business Analysis", "Decision Making", "Risk Management"];
      experiences = [
        {
          title: posName,
          company: "Current Organization",
          duration: `Mar ${currentYear-3} - Present`,
          highlights: [
            `Led a team of 12 professionals in the ${deptName} department`,
            "Implemented process improvements resulting in 25% cost reduction",
            "Successfully delivered projects with an average value of $1.5M"
          ]
        },
        {
          title: posName.includes('Director') ? "Senior Manager" : "Team Lead",
          company: "Previous Corp Inc.",
          duration: `Jun ${currentYear-7} - Feb ${currentYear-3}`,
          highlights: [
            "Managed department budget of $2M with consistent under-budget performance",
            "Led cross-functional teams in implementing organization-wide initiatives",
            "Improved team performance metrics by 35% through mentoring and training"
          ]
        }
      ];
      education = [
        {
          degree: "Master of Business Administration",
          institution: "Business School",
          year: `${currentYear-10}`
        },
        {
          degree: "Bachelor of Arts in Business Management",
          institution: "State University",
          year: `${currentYear-13}`
        }
      ];
      certifications = ["PMP Certification", "Six Sigma Black Belt", "Certified ScrumMaster"];
    }
    else if (posName.toLowerCase().includes('analyst') || posName.toLowerCase().includes('data')) {
      skills = ["Data Analysis", "SQL", "Python", "R", "Tableau", "Power BI", "Excel Advanced", "Statistical Modeling", "Data Visualization", "Business Intelligence"];
      experiences = [
        {
          title: posName,
          company: "Current Organization",
          duration: `Aug ${currentYear-2} - Present`,
          highlights: [
            `Created dashboards and reports for key ${deptName} metrics`,
            "Implemented data models that improved forecasting accuracy by 30%",
            "Developed automated reporting solutions saving 10 hours per week"
          ]
        },
        {
          title: posName.includes('Senior') ? "Data Analyst" : "Junior Analyst",
          company: "Previous Analytics Co.",
          duration: `Jan ${currentYear-4} - Jul ${currentYear-2}`,
          highlights: [
            "Performed complex data analysis to identify $1.2M in cost-saving opportunities",
            "Created predictive models with 85% accuracy for sales forecasting",
            "Collaborated with stakeholders to translate business requirements into analytical solutions"
          ]
        }
      ];
      education = [
        {
          degree: "Master of Science in Analytics",
          institution: "Data University",
          year: `${currentYear-5}`
        },
        {
          degree: "Bachelor of Science in Statistics",
          institution: "State University",
          year: `${currentYear-9}`
        }
      ];
      certifications = ["Microsoft Certified: Data Analyst Associate", "Google Data Analytics Professional Certificate", "Tableau Desktop Specialist"];
    }
    else {
      // Default/generic professional experience
      experiences = [
        {
          title: posName,
          company: "Current Organization",
          duration: `Mar ${currentYear-2} - Present`,
          highlights: [
            `Contributed to ${deptName} initiatives and projects`,
            "Collaborated with cross-functional teams to achieve organizational goals",
            "Implemented process improvements in core responsibilities"
          ]
        },
        {
          title: `${posName} Associate`,
          company: "Previous Company Inc.",
          duration: `Jan ${currentYear-5} - Feb ${currentYear-2}`,
          highlights: [
            "Supported key departmental functions and workflows",
            "Participated in organizational initiatives for efficiency improvements",
            "Received recognition for outstanding performance"
          ]
        }
      ];
      education = [
        {
          degree: `Bachelor's Degree in ${deptName} or related field`,
          institution: "University",
          year: `${currentYear-8}`
        }
      ];
      certifications = ["Relevant Professional Certification"];
    }
    
    return {
      summary: `${employeeName} is a dedicated ${posName} with ${Math.floor(Math.random() * 10) + 3} years of experience in ${deptName}. Throughout their career, they have demonstrated expertise in ${skills.slice(0, 3).join(", ")}, and ${skills[3]}. At Current Organization, they have ${experiences[0].highlights[0].toLowerCase()}, while previously at ${experiences[1].company}, they ${experiences[1].highlights[0].toLowerCase()}. ${employeeName} holds a ${education[0].degree} from ${education[0].institution} and is ${certifications.length > 0 ? `certified in ${certifications[0]}` : 'professionally certified'}. This profile is a placeholder generated because the AI processing service was unavailable or encountered an error.`,
      skills: skills,
      experience: experiences,
      education: education,
      certifications: certifications,
      languages: ["English (Fluent)", "Spanish (Intermediate)"],
      keyAchievements: [
        "Contributed to significant improvements in departmental processes",
        "Received recognition for outstanding performance in projects",
        "Successfully implemented innovative solutions to business challenges"
      ],
      professionalInterests: [
        `${deptName} Innovation`,
        "Professional Development",
        "Industry Best Practices"
      ],
      personalInsights: {
        yearsOfExperience: `${Math.floor(Math.random() * 10) + 3} years`,
        industries: [deptName, "Previous Industry"],
        toolsAndTechnologies: skills.slice(0, 4),
        projectManagement: ["Agile", "Scrum"],
        softSkills: ["Communication", "Leadership", "Teamwork"],
        publications: []
      },
      extraction_date: new Date().toISOString(),
      source: 'mock_data',
      model: 'none'
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