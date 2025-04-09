import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentFactory } from '@/agents/AgentFactory';
import { fixStorageUrl, checkStorageUrl } from '@/utils/storageHelpers';
import { LLMService } from '@/lib/llm/llm-service';

/**
 * API endpoint to process an employee's CV and generate a profile summary
 * POST /api/hr/employees/process-cv
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { employeeId, cvUrl } = body;
    
    console.log("Process CV API called with:", { employeeId, cvUrl });
    
    if (!employeeId || !cvUrl) {
      return NextResponse.json(
        { error: 'Employee ID and CV URL are required' }, 
        { status: 400 }
      );
    }
    
    // Try to fix the URL if needed
    const fixedCvUrl = fixStorageUrl(cvUrl, 'employee-files');
    console.log("Fixed CV URL:", fixedCvUrl);
    
    // Check if the CV URL is accessible
    const isUrlAccessible = await checkStorageUrl(fixedCvUrl);
    if (!isUrlAccessible) {
      console.error("CV URL is not accessible:", fixedCvUrl);
      return NextResponse.json(
        { 
          error: 'The provided CV URL is not accessible',
          originalUrl: cvUrl,
          fixedUrl: fixedCvUrl
        }, 
        { status: 400 }
      );
    }
    
    // Check if employee exists
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
      return NextResponse.json(
        { error: 'Employee not found', details: employeeError?.message }, 
        { status: 404 }
      );
    }
    
    // Get department and position names
    const departmentName = employee.hr_departments?.name || 'Unknown';
    const positionTitle = employee.hr_positions?.title || 'Unknown';
    
    // Initialize Groq LLM service
    const llmService = LLMService.getInstance();
    
    if (!llmService.isConfigured()) {
      console.warn("LLM service not properly configured. Falling back to agent factory.");
      
      // Initialize the AI agent for processing using the agent factory as fallback
      const agentFactory = AgentFactory.getInstance();
      const contentAgent = agentFactory.createAgent('educator') as any;
      
      // Create a prompt for CV analysis and profile summary generation
      const prompt = `
        I need you to analyze this employee's CV/resume and create a professional profile summary.
        
        CV URL: ${fixedCvUrl}
        Employee Name: ${employee.name}
        Position: ${positionTitle}
        Department: ${departmentName}
        
        Please extract the key information from the CV and create a 250-word professional profile summary.
        The summary should include:
        1. Professional background
        2. Key skills and expertise
        3. Experience highlights
        4. Educational background
        5. Career achievements
        
        Format the summary as a single paragraph that highlights the employee's strengths and expertise.
        The tone should be professional and concise.
      `;
      
      try {
        // Generate the profile summary
        const generatedSummary = await contentAgent.complete(prompt, {
          max_tokens: 500,
          temperature: 0.7
        });
        
        // If we couldn't generate a summary, create a basic one
        const summary = generatedSummary || 
          `${employee.name} is a professional in the ${departmentName}. Their CV has been uploaded and is available for review.`;
        
        // Store the summary in the database
        const { error: updateError } = await supabase
          .from('hr_employees')
          .update({
            cv_extracted_data: { 
              summary,
              extraction_date: new Date().toISOString(),
              source: 'ai_generated'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', employeeId);
          
        if (updateError) {
          console.error('Error updating employee with CV data:', updateError);
          return NextResponse.json(
            { error: 'Failed to save profile summary', details: updateError.message }, 
            { status: 500 }
          );
        }
        
        // Create a record of the CV extraction
        await supabase
          .from('hr_employee_cv_extractions')
          .insert({
            employee_id: employeeId,
            original_file_url: fixedCvUrl,
            extracted_data: { summary },
            extraction_status: 'completed'
          });
        
        return NextResponse.json({
          success: true,
          message: 'CV processed and profile summary generated',
          summary
        });
      } catch (aiError: any) {
        console.error('Error generating profile summary:', aiError);
        
        // Store a record of the failed attempt
        await supabase
          .from('hr_employee_cv_extractions')
          .insert({
            employee_id: employeeId,
            original_file_url: fixedCvUrl,
            extraction_status: 'failed',
            extracted_data: { error: aiError.message }
          });
        
        return NextResponse.json(
          { error: 'Failed to generate profile summary', details: aiError.message }, 
          { status: 500 }
        );
      }
    }
    
    // If LLM service is properly configured, use Groq directly
    console.log("Using Groq LLM for CV processing");
    
    // Create a more structured prompt for better extraction
    const structuredPrompt = `
      You are an expert HR professional analyzing a resume/CV to create a DETAILED and PERSONALIZED profile summary.
      
      RESUME URL: ${fixedCvUrl}
      EMPLOYEE NAME: ${employee.name}
      POSITION: ${positionTitle}
      DEPARTMENT: ${departmentName}
      
      Task: Analyze this CV and extract SPECIFIC personal and professional information. Your analysis should be personalized based on the actual content of the resume, not generic. Format your response as a JSON object with the following structure:
      
      {
        "summary": "A 250-word professional profile summary that MUST be personalized to the individual's actual career history, mentioning their specific job titles, companies worked for, years of experience, and notable achievements",
        "skills": ["skill1", "skill2", "skill3", ...],
        "experience": [
          {
            "title": "Exact Job Title from CV",
            "company": "Actual Company Name",
            "duration": "Exact Duration (e.g., 'Jan 2018 - Mar 2022')",
            "highlights": ["Specific accomplishment with metrics if available", "Another specific achievement"]
          }
        ],
        "education": [
          {
            "degree": "Exact Degree Name and Field",
            "institution": "Actual Institution Name",
            "year": "Exact Graduation Year"
          }
        ],
        "certifications": ["Actual certification name", "Another certification"],
        "languages": ["Actual language and proficiency level"],
        "keyAchievements": ["Specific achievement with context", "Another achievement"],
        "professionalInterests": ["Interest based on CV content", "Another interest"],
        "personalInsights": {
          "yearsOfExperience": "Total years based on CV",
          "industries": ["Industry1", "Industry2"],
          "toolsAndTechnologies": ["Tool1", "Tech2", "Software3"],
          "projectManagement": ["Methodology1", "Framework2"],
          "softSkills": ["Communication", "Leadership"],
          "publications": ["Any publications mentioned"]
        }
      }
      
      IMPORTANT REQUIREMENTS:
      1. DO NOT generate generic information. Only extract what's actually in the CV.
      2. If certain information isn't available, include empty arrays or "Not specified in CV" values.
      3. The summary MUST be personalized with specific details from their career - mention actual companies, roles, years of experience.
      4. Always clearly specify if something is an inference rather than explicitly stated.
      5. For experience, try to extract ALL positions mentioned in the CV, not just the most recent ones.
      6. For skills, include both technical and soft skills exactly as mentioned in the CV.
      7. Ensure education details are complete with institution names, exact degree titles, and years.
      8. Include only genuine certifications actually mentioned in the document.
      
      Even if you cannot access the actual PDF, make the most detailed inference possible from the filename, position, and department information.
    `;
    
    try {
      // Use Groq to extract and generate the profile 
      const extractedJsonString = await llmService.complete(structuredPrompt, {
        system: "You are an expert resume analyzer that extracts structured information from CVs. You always respond with properly formatted JSON only.",
        temperature: 0.2,
        maxTokens: 2000
      });
      
      let extractedData;
      try {
        extractedData = JSON.parse(extractedJsonString);
      } catch (jsonError) {
        console.error("Error parsing LLM output as JSON:", jsonError);
        console.log("Raw LLM output:", extractedJsonString);
        
        // Try to extract JSON using regex as fallback
        const jsonMatch = extractedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error("Regex extraction also failed:", e);
            throw new Error("Failed to parse LLM output as JSON");
          }
        } else {
          throw new Error("Failed to extract JSON from LLM output");
        }
      }
      
      // Add metadata
      extractedData = {
        ...extractedData,
        extraction_date: new Date().toISOString(),
        source: 'groq_llm',
        model: llmService.getModel()
      };
      
      // Store the extracted data in the database
      const { error: updateError } = await supabase
        .from('hr_employees')
        .update({
          cv_extracted_data: extractedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);
        
      if (updateError) {
        console.error('Error updating employee with CV data:', updateError);
        return NextResponse.json(
          { error: 'Failed to save profile data', details: updateError.message }, 
          { status: 500 }
        );
      }
      
      // Create a record of the CV extraction
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: fixedCvUrl,
          extracted_data: extractedData,
          extraction_status: 'completed'
        })
        .select();
      
      return NextResponse.json({
        success: true,
        message: 'CV processed and profile data extracted',
        data: extractedData
      });
    } catch (llmError: any) {
      console.error('Error processing CV with Groq:', llmError);
      
      // Store a record of the failed attempt
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: fixedCvUrl,
          extraction_status: 'failed',
          extracted_data: { error: llmError.message }
        });
      
      return NextResponse.json(
        { error: 'Failed to process CV with Groq', details: llmError.message }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing CV:', error);
    return NextResponse.json(
      { error: 'Failed to process CV', details: error.message }, 
      { status: 500 }
    );
  }
} 