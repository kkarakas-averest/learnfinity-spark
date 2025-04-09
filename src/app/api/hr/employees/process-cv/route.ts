import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentFactory } from '@/agents/AgentFactory';
import { fixStorageUrl, checkStorageUrl } from '@/utils/storageHelpers';
import { LLMService } from '@/lib/llm/llm-service';
import { extractTextFromPdfUrl, extractKeyInformation } from '@/lib/server/pdfProcessor';

/**
 * API endpoint for processing CVs and extracting profile data
 */
export async function POST(req: NextRequest) {
  console.log('----------- CV PROCESSING API START -----------');
  
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { employeeId, cvUrl } = body;
    
    // Validate input
    if (!employeeId || !cvUrl) {
      console.error('Missing required parameters:', { employeeId: !!employeeId, cvUrl: !!cvUrl });
      return NextResponse.json({ error: 'Employee ID and CV URL are required' }, { status: 400 });
    }
    
    console.log(`Processing CV for employee ${employeeId}`);
    console.log(`CV URL: ${cvUrl}`);
    
    // Fix any URL issues (like double-encoded URLs)
    const fixedCvUrl = fixStorageUrl(cvUrl, 'employee-files');
    console.log(`Fixed CV URL: ${fixedCvUrl}`);
    
    // Validate the storage URL
    const isValidStorageUrl = await checkStorageUrl(fixedCvUrl);
    console.log(`Storage URL validation: ${isValidStorageUrl ? 'valid' : 'invalid'}`);
    
    if (!isValidStorageUrl) {
      console.error(`Invalid storage URL: ${fixedCvUrl}`);
      return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 });
    }
    
    // First, extract the text from the PDF
    console.log(`Extracting text from PDF: ${fixedCvUrl}`);
    const extractionStart = Date.now();
    const pdfResult = await extractTextFromPdfUrl(fixedCvUrl);
    const extractionTime = Date.now() - extractionStart;
    console.log(`PDF text extraction completed in ${extractionTime}ms`);
    
    if (!pdfResult.text || pdfResult.text.trim() === '') {
      console.error(`Failed to extract text from PDF: ${pdfResult.metadata.error || 'No text content'}`);
      console.log('PDF extraction result:', pdfResult);
      return NextResponse.json(
        { error: 'Failed to extract text from PDF', details: pdfResult.metadata.error }, 
        { status: 500 }
      );
    }
    
    console.log(`Successfully extracted ${pdfResult.text.length} characters from PDF (${pdfResult.numPages} pages)`);
    
    // Process the extracted text to remove excessive whitespace and normalize
    console.log('Processing and normalizing extracted text');
    const processedText = extractKeyInformation(pdfResult.text);
    console.log(`Processed text: ${processedText.length} characters`);
    console.log(`Text sample (first 300 chars): "${processedText.substring(0, 300)}..."`);
    
    // Get employee data
    console.log(`Fetching employee data for ${employeeId}`);
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
      console.error('Error fetching employee data:', employeeError);
      return NextResponse.json(
        { error: 'Employee not found', details: employeeError?.message }, 
        { status: 404 }
      );
    }
    
    console.log(`Employee data retrieved: ${employee.name}`);
    
    // Get department and position names
    const departmentName = employee.hr_departments?.name || 'Unknown';
    const positionTitle = employee.hr_positions?.title || 'Unknown';
    console.log(`Department: ${departmentName}, Position: ${positionTitle}`);
    
    // Initialize Groq LLM service
    const llmService = LLMService.getInstance();
    console.log(`LLM service configured: ${llmService.isConfigured() ? 'yes' : 'no'}`);
    
    if (!llmService.isConfigured()) {
      console.warn("LLM service not properly configured. Falling back to agent factory.");
      
      // Initialize the AI agent for processing using the agent factory as fallback
      const agentFactory = AgentFactory.getInstance();
      const contentAgent = agentFactory.createAgent('educator') as any;
      console.log('Created fallback content agent from agent factory');
      
      // Create a prompt for CV analysis and profile summary generation
      console.log('Preparing prompt for agent');
      const prompt = `
        I need you to analyze this employee's CV/resume and create a professional profile summary.
        
        CV TEXT:
        ${processedText}
        
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
        // Call the agent to generate the summary
        console.log('Calling agent to analyze CV and generate summary');
        const agentStart = Date.now();
        const result = await contentAgent.runPrompt(prompt);
        const agentTime = Date.now() - agentStart;
        console.log(`Agent completed CV analysis in ${agentTime}ms`);
        console.log(`Generated summary length: ${result.trim().length} characters`);
        
        // Create a structured profile with the generated summary
        console.log('Creating structured profile data from agent result');
        const profileData = {
          summary: result.trim(),
          skills: [],
          experience: [],
          education: [],
          certifications: [],
          languages: [],
          keyAchievements: [],
          professionalInterests: [],
          personalInsights: {
            yearsOfExperience: "Not specified",
            industries: [],
            toolsAndTechnologies: [],
            projectManagement: [],
            softSkills: [],
            publications: []
          },
          extraction_date: new Date().toISOString(),
          source: 'agent_factory',
          model: 'unknown'
        };
        
        // Update the employee record with the profile data
        console.log('Updating employee record with agent-generated profile data');
        const { error: updateError } = await supabase
          .from('hr_employees')
          .update({
            cv_extracted_data: profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', employeeId);
          
        if (updateError) {
          console.error('Error updating employee with profile data:', updateError);
          return NextResponse.json(
            { error: 'Failed to save profile data', details: updateError.message }, 
            { status: 500 }
          );
        }
        
        console.log('Successfully updated employee record with agent-generated profile');
        console.log('----------- CV PROCESSING API COMPLETE -----------');
        
        // Return success response
        return NextResponse.json({ 
          success: true, 
          data: profileData,
          message: 'Profile data generated successfully using agent factory'
        });
      } catch (aiError: any) {
        console.error('Error generating profile summary with agent:', aiError);
        console.log('Agent error details:', aiError.message);
        
        // Store a record of the failed attempt
        console.log('Recording failed extraction attempt');
        await supabase
          .from('hr_employee_cv_extractions')
          .insert({
            employee_id: employeeId,
            original_file_url: fixedCvUrl,
            extraction_status: 'failed',
            extracted_data: { error: aiError.message }
          });
        
        console.log('----------- CV PROCESSING API FAILED -----------');
        return NextResponse.json(
          { error: 'Failed to generate profile summary', details: aiError.message }, 
          { status: 500 }
        );
      }
    }
    
    // If LLM service is properly configured, use Groq directly
    console.log("Using Groq LLM for CV processing");
    console.log(`LLM model: ${llmService.getModel()}`);
    
    // Create a more structured prompt for better extraction
    console.log('Preparing structured prompt for LLM with extracted PDF content');
    const structuredPrompt = `
      You are an expert HR professional analyzing a resume/CV to create a DETAILED and PERSONALIZED profile summary.
      
      CV CONTENT:
      ${processedText}
      
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
    `;
    
    try {
      // Use Groq to extract and generate the profile 
      console.log('Calling LLM service to analyze CV');
      const llmStart = Date.now();
      const extractedJsonString = await llmService.complete(structuredPrompt, {
        system: "You are an expert resume analyzer that extracts structured information from CVs. You always respond with properly formatted JSON only.",
        temperature: 0.2,
        maxTokens: 2000
      });
      const llmTime = Date.now() - llmStart;
      console.log(`LLM completed CV analysis in ${llmTime}ms`);
      console.log(`LLM response length: ${extractedJsonString.length} characters`);
      console.log(`LLM response preview: ${extractedJsonString.substring(0, 150)}...`);
      
      let extractedData;
      try {
        console.log('Attempting to parse LLM response as JSON');
        extractedData = JSON.parse(extractedJsonString);
        console.log('Successfully parsed LLM response as JSON');
      } catch (jsonError) {
        console.error("Error parsing LLM output as JSON:", jsonError);
        console.log("Raw LLM output:", extractedJsonString);
        
        // Try to extract JSON using regex as fallback
        console.log('Attempting to extract JSON using regex');
        const jsonMatch = extractedJsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[0]);
            console.log('Successfully parsed JSON using regex extraction');
          } catch (e) {
            console.error("Regex extraction also failed:", e);
            throw new Error("Failed to parse LLM output as JSON");
          }
        } else {
          console.error('No JSON object pattern found in response');
          throw new Error("Failed to extract JSON from LLM output");
        }
      }
      
      // Add metadata
      console.log('Adding metadata to extracted profile data');
      extractedData = {
        ...extractedData,
        extraction_date: new Date().toISOString(),
        source: 'groq_llm',
        model: llmService.getModel()
      };
      
      console.log('Extracted data summary:', {
        summaryLength: extractedData.summary?.length || 0,
        skillsCount: extractedData.skills?.length || 0,
        experienceCount: extractedData.experience?.length || 0,
        educationCount: extractedData.education?.length || 0
      });
      
      // Store the extracted data in the database
      console.log('Updating employee record with LLM-generated profile data');
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
      
      // Store a record of the successful extraction
      console.log('Recording successful extraction attempt');
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: fixedCvUrl,
          extraction_status: 'success',
          extracted_data: extractedData
        });
      
      console.log('Successfully updated employee record with LLM-generated profile');
      console.log('----------- CV PROCESSING API COMPLETE -----------');
      
      // Return success response with the extracted data
      return NextResponse.json({ 
        success: true, 
        data: extractedData,
        message: 'Profile data generated successfully'
      });
    } catch (error: any) {
      console.error('Error in CV processing:', error);
      console.log('Error details:', error.message);
      
      // Store a record of the failed attempt
      console.log('Recording failed extraction attempt');
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: fixedCvUrl,
          extraction_status: 'failed',
          extracted_data: { error: error.message }
        });
      
      console.log('----------- CV PROCESSING API FAILED -----------');
      return NextResponse.json(
        { error: 'Failed to process CV', details: error.message }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in CV processing API:', error);
    console.log('Error details:', error.message, error.stack);
    console.log('----------- CV PROCESSING API FAILED -----------');
    
    return NextResponse.json(
      { error: 'Unexpected error', details: error.message }, 
      { status: 500 }
    );
  }
} 