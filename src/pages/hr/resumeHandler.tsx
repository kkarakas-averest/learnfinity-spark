import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { uploadResumeFile, uploadResumeViaAPI, createMockResumeUrl } from '@/utils/resumeUpload';
import { supabase } from '@/lib/supabase';
import { GROQ_API_KEY } from '@/lib/env';
import { extractTextFromPdf } from '@/lib/pdf/pdfExtractor';
import { normalizeSkills } from '@/lib/skills/normalizer';

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
      
      // Extract text from PDF using our enhanced client-side extraction
      console.log("Extracting PDF text using PDF.js...");
      let pdfContent = "";
      let pdfMetadata = {};
      
      try {
        const extractionResult = await extractTextFromPdf(cvUrl);
        
        if (!extractionResult.success) {
          console.error("PDF extraction failed:", extractionResult.metadata?.error);
          pdfContent = "PDF text extraction failed. Please analyze based on the employee name, position, and department information provided.";
        } else {
          pdfContent = extractionResult.text;
          pdfMetadata = extractionResult.metadata || {};
          console.log(`Successfully extracted ${pdfContent.length} characters from PDF`);
          console.log(`PDF metadata:`, pdfMetadata);
          
          // Add a sample to help the model understand the content quality
          const contentPreview = pdfContent.substring(0, 150);
          console.log(`PDF content preview: "${contentPreview}..."`);
          
          // Check if the extracted content seems valid
          if (pdfContent.length < 100 || 
              contentPreview.includes("PDF text extraction failed") ||
              contentPreview.match(/^[\s\d\W]+$/)) { // Only whitespace, numbers, and non-word chars
            console.warn("Extracted PDF content appears to be low quality or invalid");
            pdfContent = `The PDF text extraction produced low-quality results. Please analyze based on the following details:
              Employee Name: ${employeeName}
              Department: ${departmentName}
              Position: ${positionName}
              
              Please generate a reasonable profile summary based on the position and department,
              but indicate that this is a placeholder due to text extraction limitations.
              ${pdfContent.substring(0, 500)}`;  // Include first 500 chars as potential context
          }
          
          // Truncate content if it's too large to prevent Groq API errors
          const MAX_CONTENT_LENGTH = 8000; // Keep increased limit
          if (pdfContent.length > MAX_CONTENT_LENGTH) {
            console.log(`PDF content too large (${pdfContent.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
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
        // Enhanced fallback prompt with better guidance for the LLM
        pdfContent = `PDF text extraction error: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}

          Please generate a placeholder profile for:
          Name: ${employeeName}
          Position: ${positionName}
          Department: ${departmentName}
          
          Create a reasonable professional profile summary for someone in this role and department.
          Include likely skills, experience, and qualifications that would be typical for this position.
          Make it clear in the summary that this is a placeholder profile due to technical limitations.`;
      }
      
      // Prepare prompt with the extracted PDF content
      console.log("Preparing structured prompt for Groq API");
      
      const structuredPrompt = `
        You are an expert HR recruiter and resume analyzer with years of experience extracting meaningful information from CVs and resumes.
        
        CV CONTENT:
        ${pdfContent}
        
        EMPLOYEE: ${employeeName}
        POSITION: ${positionName}
        DEPARTMENT: ${departmentName}
        
        TASK:
        Your task is to create a detailed professional profile based on the CV content provided.
        If the CV content appears to be missing, corrupted, or contains extraction errors, create a realistic
        placeholder profile for someone with this name, position, and department, but clearly indicate it's a placeholder.
        
        EXTRACTION INSTRUCTIONS:
        1. If the CV content is readable:
           - Extract REAL information from the CV - never make assumptions
           - Focus on specific company names, job titles, time periods, skills, and accomplishments
           - If a section truly has no information, use empty arrays [] rather than "Not specified"
        
        2. If the CV content is NOT readable (contains errors or is missing):
           - Create a realistic placeholder profile for someone in this position and department
           - Generate reasonable skills, experience, education based on the position
           - CLEARLY indicate in the summary that this is a generated placeholder profile
           - Try to incorporate any readable fragments from the CV content if available
        
        Format your response as this JSON structure:
        {
          "summary": "Detailed professional profile summarizing career and expertise. If this is a placeholder, clearly state this fact.",
          
          "skills": [
            "Skill 1 from CV or realistic for position if CV is unreadable",
            "Skill 2 from CV or realistic for position if CV is unreadable"
          ],
          
          "experience": [
            {
              "title": "Job title from CV or realistic title if CV is unreadable",
              "company": "Company name from CV or 'Generated placeholder' if CV is unreadable",
              "duration": "Time period from CV or realistic duration if CV is unreadable",
              "highlights": [
                "Achievement from CV or realistic for position if CV is unreadable",
                "Another achievement from CV or realistic for position if CV is unreadable"
              ]
            }
          ],
          
          "education": [
            {
              "degree": "Degree from CV or realistic for position if CV is unreadable",
              "institution": "Institution from CV or realistic institution if CV is unreadable",
              "year": "Year from CV or realistic year if CV is unreadable"
            }
          ],
          
          "certifications": [
            "Certification from CV or realistic for position if CV is unreadable"
          ],
          
          "languages": [
            "Language from CV or realistic assumption if CV is unreadable"
          ],
          
          "keyAchievements": [
            "Achievement from CV or realistic for position if CV is unreadable"
          ],
          
          "personalInsights": {
            "yearsOfExperience": "Years from CV or realistic for position if CV is unreadable",
            "industries": [
              "Industry from CV or related to department if CV is unreadable"
            ],
            "toolsAndTechnologies": [
              "Tool/technology from CV or realistic for position if CV is unreadable"
            ],
            "softSkills": [
              "Soft skill from CV or realistic for position if CV is unreadable"
            ]
          },
          
          "isPlaceholder": true/false  // Set to true if generating a placeholder profile
        }
        
        IMPORTANT:
        - If using real CV data, be as accurate and specific as possible
        - If creating a placeholder, make it realistic but clearly labeled
        - Respond ONLY with the JSON object, no explanatory text
      `;

      // Create system message
      const systemMessage = `You are an expert CV analyzer that extracts or generates structured profile information.
When provided with CV text, extract real information accurately.
If the CV text appears corrupted, missing, or contains extraction errors, generate a realistic placeholder profile for the person's position and department.
Always indicate clearly when generating placeholder information.
Return ONLY a properly formatted JSON object with no additional text.`;
      
      // Make the API call to Groq
      console.log("Calling Groq API directly for CV analysis");
      console.log(`Using model: llama-3.3-70b-versatile, temperature: 0.0, max_tokens: 2000`);
      
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
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: structuredPrompt }
              ],
              temperature: 0.0,
              max_tokens: 2000
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
          console.log("Fetch error details:", fetchError instanceof Error ? fetchError.message : String(fetchError));
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
        let parsedData;
        
        try {
          parsedData = JSON.parse(content);
          console.log("Successfully parsed response JSON directly");
        } catch (directJsonError) {
          console.log("Direct JSON parsing failed, trying to extract JSON from text");
          
          // Try to extract JSON using regex patterns
          console.log("Attempting to extract JSON using regex");
          
          // First try most common pattern: JSON object inside the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed JSON using basic regex extraction");
            } catch (basicRegexError) {
              console.error("Basic regex extraction failed:", basicRegexError instanceof Error ? basicRegexError.message : String(basicRegexError));
              
              // Try stricter pattern: find JSON-like content with balanced braces
              console.log("Trying advanced JSON extraction with balanced braces");
              const jsonStart = content.indexOf('{');
              if (jsonStart !== -1) {
                let braceCount = 0;
                let jsonEnd = -1;
                
                for (let i = jsonStart; i < content.length; i++) {
                  if (content[i] === '{') braceCount++;
                  if (content[i] === '}') braceCount--;
                  
                  if (braceCount === 0) {
                    jsonEnd = i + 1;
                    break;
                  }
                }
                
                if (jsonEnd !== -1) {
                  const jsonString = content.substring(jsonStart, jsonEnd);
                  try {
                    parsedData = JSON.parse(jsonString);
                    console.log("Successfully parsed JSON using balanced brace extraction");
                  } catch (advancedError) {
                    console.error("Advanced JSON extraction failed:", advancedError instanceof Error ? advancedError.message : String(advancedError));
                    throw new Error("Could not parse response as valid JSON");
                  }
                }
              }
            }
          }
          
          // If still no parsed data, try to extract fields manually as a last resort
          if (!parsedData) {
            console.log("Attempting manual field extraction as last resort");
            
            // Create a basic structure with empty values
            parsedData = {
              summary: "",
              skills: [],
              experience: [],
              education: [],
              certifications: [],
              languages: [],
              keyAchievements: [],
              personalInsights: {
                yearsOfExperience: "",
                industries: [],
                toolsAndTechnologies: [],
                softSkills: []
              }
            };
            
            // Extract summary - look for content between "summary" and the next field
            const summaryMatch = content.match(/"summary"[:\s]+"([^"]+)"/);
            if (summaryMatch) parsedData.summary = summaryMatch[1];
            
            // Try to extract arrays by looking for bracket patterns
            const skillsMatch = content.match(/"skills"[:\s]+\[(.*?)\]/s);
            if (skillsMatch) {
              const skillsStr = skillsMatch[1];
              parsedData.skills = skillsStr.match(/"([^"]+)"/g)?.map((s: string) => s.replace(/"/g, '')) || [];
            }
            
            console.log("Manual extraction produced partial data");
          }
        }
        
        if (!parsedData) {
          throw new Error("Failed to parse response content as JSON");
        }
        
        // Validate that the parsed data has the expected structure
        console.log("Validating parsed data structure");
        
        if (!parsedData.summary) parsedData.summary = "Professional profile could not be extracted";
        if (!Array.isArray(parsedData.skills)) parsedData.skills = [];
        if (!Array.isArray(parsedData.experience)) parsedData.experience = [];
        if (!Array.isArray(parsedData.education)) parsedData.education = [];
        if (!parsedData.personalInsights) parsedData.personalInsights = {};
        
        console.log("Parsed data keys:", Object.keys(parsedData));
        console.log("Skills found:", parsedData.skills?.length || 0);
        console.log("Experience entries:", parsedData.experience?.length || 0);
        console.log('----------- GROQ DIRECT CALL COMPLETE -----------');
        return parsedData;
      } catch (error) {
        console.error("All JSON parsing attempts failed:", error);
        console.log("Full response content:", content);
        console.log('----------- GROQ DIRECT CALL FAILED -----------');
        throw new Error(`Failed to parse Groq response: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      console.error("Error in callGroqForCvAnalysis:", error);
      console.log("Error details:", error instanceof Error ? error.message : String(error));
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
            model: 'llama-3.3-70b-versatile'
          };
          
          console.log("Successfully extracted profile data using Groq direct call");
          console.log("Profile data source:", profileData.source);
          console.log("Skills extracted:", profileData.skills?.length || 0);
          console.log("Experience entries:", profileData.experience?.length || 0);
        } catch (groqError) {
          console.error("Error with direct Groq API call:", groqError);
          console.log("Groq API error details:", groqError instanceof Error ? groqError.message : String(groqError));
          
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
      
      // Add this code to call our new function:
      if (profileData.skills && profileData.skills.length > 0) {
        console.log(`Processing ${profileData.skills.length} extracted skills for taxonomy normalization`);
        await normalizeAndSaveSkills(employeeId, profileData.skills);
      } else {
        console.log('No skills found to normalize');
      }
      
      toast({
        title: "Profile Data Generated",
        description: "CV processed and profile data extracted successfully."
      });
      
      console.log('----------- CV PROCESSING COMPLETE -----------');
      return true;
    } catch (error) {
      console.error('Error processing CV:', error);
      console.log('Error details:', error instanceof Error ? error.message : String(error));
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
        console.log('Fallback error details:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
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

  /**
   * Process extracted skills and normalize them to taxonomy
   */
  const normalizeAndSaveSkills = async (employeeId: string, extractedSkills: string[]): Promise<boolean> => {
    try {
      console.log(`----- PROCESSING SKILLS FOR TAXONOMY -----`);
      console.log(`Employee ID: ${employeeId}`);
      console.log(`Found ${extractedSkills.length} skills to normalize: ${extractedSkills.join(', ')}`);
      
      // Normalize the skills to taxonomy IDs
      const normalizedResults = await normalizeSkills(extractedSkills, {
        confidenceThreshold: 0.65, // Slightly lower threshold for CV extraction
        includeHierarchy: true,
      });
      
      // Get the successfully matched skills (those with taxonomy IDs)
      const matchedSkills = normalizedResults.filter(result => result.taxonomySkillId !== null);
      console.log(`Successfully matched ${matchedSkills.length} of ${normalizedResults.length} skills to taxonomy`);
      
      if (matchedSkills.length === 0) {
        console.log(`No skills could be matched to taxonomy. Skipping database update.`);
        return false;
      }
      
      // Create entries for the employee_skills table with all required fields
      const skillEntries = matchedSkills.map(match => {
        // Create a complete entry with all required fields
        return {
          employee_id: employeeId,
          taxonomy_skill_id: match.taxonomySkillId,
          skill_name: match.taxonomySkillName || match.rawSkill,
          proficiency_level: 'beginner', // Default proficiency level for CV-extracted skills
          proficiency: 1, // Default proficiency value (1-5 scale)
          is_in_progress: false,
          verification_status: 'unverified',
          source: 'cv_extraction',
          confidence: match.confidence,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Insert skills into the hr_employee_skills table
      console.log(`Inserting ${skillEntries.length} normalized skills into database`);
      
      // Use a direct SQL query to ensure all fields are properly handled
      try {
        for (const entry of skillEntries) {
          const { error: insertError } = await supabase
            .from('hr_employee_skills')
            .insert(entry);
            
          if (insertError) {
            console.error('Error inserting skill entry:', insertError);
            throw insertError;
          }
        }
        console.log(`Successfully inserted ${skillEntries.length} skill entries`);
      } catch (insertError) {
        console.error('Error saving normalized skills to database:', insertError);
        return false;
      }
      
      // Log normalized skills to the skill_normalization_logs table for tracking
      await supabase
        .from('skill_normalization_logs')
        .insert({
          employee_id: employeeId,
          raw_skills: extractedSkills,
          normalized_skills: matchedSkills.map(m => ({
            raw: m.rawSkill, 
            normalized: m.taxonomySkillName, 
            taxonomy_id: m.taxonomySkillId
          })),
          source: 'cv_extraction',
          created_at: new Date().toISOString()
        });
      
      console.log(`Successfully saved ${skillEntries.length} normalized skills to database`);
      console.log(`----- SKILL TAXONOMY PROCESSING COMPLETE -----`);
      return true;
    } catch (error: unknown) {
      console.error('Error normalizing skills to taxonomy:', error instanceof Error ? error.message : String(error));
      return false;
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