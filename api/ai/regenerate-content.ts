import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk'; // Import Groq SDK

// Set CORS headers helper function
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return res;
};

// Export runtime configuration for Vercel Serverless Functions
export const config = {
  regions: ['iad1'], // Washington DC region
};

// HARDCODED FALLBACK VALUES - Only used if environment variables fail
const HARDCODED_SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
// IMPORTANT: For security, you should set this in Vercel environment variables 
// and only use this hardcoded key for development/debugging
// DO NOT COMMIT YOUR ACTUAL SERVICE KEY TO GIT
// Instead, add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables for Production, Preview, and Development
// ⚠️ TESTING ONLY: Using provided hardcoded key for testing. REMOVE BEFORE COMMIT/DEPLOY. ⚠️
const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
// ⚠️ TESTING ONLY: Using provided hardcoded Groq key for testing. REMOVE BEFORE COMMIT/DEPLOY. ⚠️
const HARDCODED_GROQ_API_KEY = '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';

// Simple logging helper with timestamps
const logWithTimestamp = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const reqIdText = requestId ? `[ReqID:${requestId}] ` : '';
  const logPrefix = `[${timestamp}] [REGENERATE-CONTENT] ${reqIdText}`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

// Add this type declarations above the handler function
type Department = {
  name: string;
  // Add other department fields if needed
};

type Position = {
  title: string;
  // Add other position fields if needed
};

type EmployeeDataRaw = {
  id: string;
  name: string;
  cv_extracted_data: any;
  department_id: string;
  position_id: string;
  hr_departments?: Department | Department[] | null;
  hr_positions?: Position | Position[] | null;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Generate request ID for tracing
  const requestId = uuidv4();
  
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // *** STEP 1: Read and Validate Env Vars INSIDE the handler ***
  // Try all possible environment variable names without using string interpolation
  let supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.VITE_SUPABASE_SERVICE_KEY;

  let groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY; // Read Groq Key

  // --- BEGIN: Detailed Environment Logging ---
  const mask = (val?: string) => {
    if (!val) return '[empty]';
    if (val.length < 8) return '[too short]';
    return val.slice(0, 4) + '...' + val.slice(-4);
  };
  const logEnv = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    VITE_SUPABASE_SERVICE_KEY: mask(process.env.VITE_SUPABASE_SERVICE_KEY),
    GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Defined' : 'Undefined',
    VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY ? 'Defined' : 'Undefined',
    HARDCODED_SUPABASE_URL: HARDCODED_SUPABASE_URL,
    HARDCODED_SERVICE_KEY: mask(HARDCODED_SERVICE_KEY),
    HARDCODED_GROQ_API_KEY: HARDCODED_GROQ_API_KEY,
    usedSupabaseUrl: supabaseUrl,
    usedServiceKey: mask(supabaseServiceKey),
    usedGroqApiKey: mask(groqApiKey),
  };
  logWithTimestamp('==== ENV DEBUG START ====', logEnv, requestId);
  if (!process.env.SUPABASE_URL) logWithTimestamp('SUPABASE_URL is missing', undefined, requestId);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) logWithTimestamp('SUPABASE_SERVICE_ROLE_KEY is missing', undefined, requestId);
  if (supabaseUrl && (supabaseUrl.includes('$') || supabaseUrl.includes('{'))) logWithTimestamp('supabaseUrl contains unresolved placeholder:', supabaseUrl, requestId);
  if (supabaseServiceKey && (supabaseServiceKey.includes('$') || supabaseServiceKey.includes('{'))) logWithTimestamp('supabaseServiceKey contains unresolved placeholder:', mask(supabaseServiceKey), requestId);
  if (groqApiKey && (groqApiKey.includes('$') || groqApiKey.includes('{'))) logWithTimestamp('groqApiKey contains unresolved placeholder:', mask(groqApiKey), requestId);
  // --- END: Detailed Environment Logging ---

  // CRITICAL: Check if Supabase URL contains placeholders and use hardcoded value if needed
  if (!supabaseUrl || supabaseUrl.includes('$') || supabaseUrl.includes('{')) {
    logWithTimestamp('WARNING: Using hardcoded Supabase URL because environment variable contains placeholders or is undefined', undefined, requestId);
    supabaseUrl = HARDCODED_SUPABASE_URL;
  }

  // CRITICAL: Check if service key is missing or contains placeholders
  if (!supabaseServiceKey || supabaseServiceKey.includes('$') || supabaseServiceKey.includes('{')) {
    logWithTimestamp('WARNING: Using hardcoded Supabase service key because environment variable contains placeholders or is undefined', undefined, requestId);
    supabaseServiceKey = HARDCODED_SERVICE_KEY;
  }

  // CRITICAL: Check if Groq API key is missing or contains placeholders
  if (!groqApiKey || groqApiKey.includes('$') || groqApiKey.includes('{')) {
    logWithTimestamp('WARNING: Using hardcoded Groq API key because environment variable contains placeholders or is undefined', undefined, requestId);
    groqApiKey = HARDCODED_GROQ_API_KEY;
  }

  // Check if the essential variables were found and EXIT EARLY if service key is missing or invalid
  if (!supabaseServiceKey || 
      (supabaseServiceKey === '') || 
      // Skip check if it's a valid-looking JWT (for testing mode)
      (!supabaseServiceKey.startsWith('eyJ'))) {
    logWithTimestamp('CRITICAL ERROR: Missing or invalid Supabase Service Key. Check Vercel Environment Variables.', {
      supabaseUrlValue: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'MISSING',
      hasServiceKeyValue: Boolean(supabaseServiceKey),
      isEmpty: supabaseServiceKey === '',
      startsWithEyJ: supabaseServiceKey?.startsWith('eyJ') || false,
    }, requestId);
    
    // EXIT HERE if config is missing
    return res.status(500).json({ 
      error: 'Server configuration error - missing Supabase service key',
      details: 'The server is not properly configured to handle content regeneration.',
      requestId
    });
  }

  // Parse the request body
  const { courseId, employeeId } = req.body;
  
  // Validate required parameters
  if (!courseId) {
    logWithTimestamp('Missing courseId in request body', req.body, requestId);
    return res.status(400).json({ error: 'courseId is required', requestId });
  }
  
  if (!employeeId) {
    logWithTimestamp('Missing employeeId in request body', req.body, requestId);
    return res.status(400).json({ error: 'employeeId is required', requestId });
  }
  
  logWithTimestamp(`Starting regeneration process for course: ${courseId} and employee: ${employeeId}`, undefined, requestId);

  let supabase: SupabaseClient | null = null;
  let jobId: string | null = null;

  try {
    // Initialize Supabase with our working credentials
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Create job record with ID for tracking this regeneration request
    jobId = uuidv4();
    logWithTimestamp(`Creating job record with ID: ${jobId}`, undefined, requestId);
    
    // 1. Get the course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      logWithTimestamp(`Error fetching course:`, courseError, requestId);
      return res.status(404).json({ 
        error: 'Course not found', 
        details: courseError?.message,
        requestId
      });
    }
    
    logWithTimestamp(`Course verified: ${courseData.title}`, undefined, requestId);
    
    // 2. Get the employee data
    const { data: employeeDataRaw, error: employeeError } = await supabase
      .from('hr_employees')
      // Fetch required fields and related department/position titles
      .select('id, name, cv_extracted_data, department_id, position_id, hr_departments(name), hr_positions(title)')
      .eq('id', employeeId)
      .single();
      
    if (employeeError || !employeeDataRaw) {
      logWithTimestamp(`Error fetching employee:`, employeeError, requestId);
      return res.status(404).json({ 
        error: 'Employee not found', 
        details: employeeError?.message || 'Unknown error fetching employee data',
        requestId 
      });
    }
    
    // Map the data to flatten department/position names
    const employeeData = {
      ...employeeDataRaw as EmployeeDataRaw,
      // Access the first element if it's an array, otherwise use the object directly
      department_name: Array.isArray((employeeDataRaw as EmployeeDataRaw).hr_departments) 
                          ? ((employeeDataRaw as EmployeeDataRaw).hr_departments as Department[])[0]?.name 
                          : ((employeeDataRaw as EmployeeDataRaw).hr_departments as Department)?.name 
                          || null,
      position_title: Array.isArray((employeeDataRaw as EmployeeDataRaw).hr_positions) 
                          ? ((employeeDataRaw as EmployeeDataRaw).hr_positions as Position[])[0]?.title 
                          : ((employeeDataRaw as EmployeeDataRaw).hr_positions as Position)?.title 
                          || null,
      // Optionally clear the original nested structures after mapping
      hr_departments: undefined,
      hr_positions: undefined,
    };
    delete employeeData.hr_departments; // Clean up mapped object
    delete employeeData.hr_positions;   // Clean up mapped object

    // Check if cv_extracted_data exists on the mapped object
    if (!employeeData.cv_extracted_data) {
        logWithTimestamp(`Missing cv_extracted_data for employee: ${employeeId}`, employeeData, requestId);
        // Decide how to handle missing CV data - throw error or proceed with default content?
        // For now, throwing an error as personalization depends on it.
        return res.status(400).json({ 
            error: 'Missing CV data for employee', 
            details: 'Cannot generate personalized content without employee CV information.',
            requestId 
        });
    }
    
    logWithTimestamp(`Employee verified: ${employeeData.name}, Position: ${employeeData.position_title}, Dept: ${employeeData.department_name}`, undefined, requestId);
    
    // 4. Check for existing enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('course_id', courseId)
      .single();
      
    if (enrollmentError) {
      logWithTimestamp(`Error checking enrollment:`, enrollmentError, requestId);
      // Continue anyway, we'll create one if needed
    }
    
    // 5. Create a job record
    const { error: jobError } = await supabase
      .from('content_generation_jobs')
      .insert({
        id: jobId,
        course_id: courseId,
        employee_id: employeeId,
        status: 'in_progress',
        total_steps: 10,
        current_step: 1,
        progress: 10,
        step_description: 'Initializing content generation process',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          employee_name: employeeData.name,
          course_title: courseData.title,
          request_id: requestId
        }
      });
      
    if (jobError) {
      logWithTimestamp(`Error creating job record:`, jobError, requestId);
      return res.status(500).json({ 
        error: 'Failed to create job record', 
        details: jobError.message,
        requestId
      });
    }
    
    // 6. Create or update enrollment if needed
    if (!enrollment) {
      logWithTimestamp(`Creating new enrollment for employee ${employeeId} in course ${courseId}`, undefined, requestId);
      
      const { error: createEnrollmentError } = await supabase
        .from('hr_course_enrollments')
        .insert({
          employee_id: employeeId,
          course_id: courseId,
          status: 'active',
          enrollment_date: new Date().toISOString(),
          personalized_content_generation_status: 'in_progress',
          personalized_content_started_at: new Date().toISOString(),
        });
        
      if (createEnrollmentError) {
        logWithTimestamp(`Error creating enrollment:`, createEnrollmentError, requestId);
        // Continue anyway, this is not critical
      }
    } else {
      // Update existing enrollment
      logWithTimestamp(`Updating existing enrollment for employee ${employeeId} in course ${courseId}`, undefined, requestId);
      
      const { error: updateEnrollmentError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_generation_status: 'in_progress',
          personalized_content_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('course_id', courseId);
        
      if (updateEnrollmentError) {
        logWithTimestamp(`Error updating enrollment:`, updateEnrollmentError, requestId);
        // Continue anyway, this is not critical
      }
    }
    
    // 7. Update job status
    const { error: updateJobError } = await supabase
      .from('content_generation_jobs')
      .update({
        current_step: 2,
        progress: 20,
        step_description: 'Content generation in progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (updateJobError) {
      logWithTimestamp(`Error updating job status:`, updateJobError, requestId);
      // Continue anyway
    }
    
    // --- BEGIN GROQ API CALL & CONTENT STORAGE ---
    logWithTimestamp(`Preparing to call Groq for course ${courseId} and employee ${employeeId}`, undefined, requestId);
    
    // Ensure we have the necessary data
    if (!employeeData?.cv_extracted_data) {
      // This check might be redundant now due to the earlier check, but kept for safety
      logWithTimestamp(`CRITICAL: cv_extracted_data somehow became null after mapping`, employeeData, requestId);
      throw new Error('Missing cv_extracted_data for the employee.');
    }
    if (!courseData?.title || !courseData?.description) {
        throw new Error('Missing title or description for the course.');
    }

    // Log CV data to verify it's being used (limit the log size for very large CVs)
    const cvDataString = JSON.stringify(employeeData.cv_extracted_data);
    logWithTimestamp(`CV data being used for personalization (first 500 chars):`, 
      cvDataString.length > 500 ? cvDataString.substring(0, 500) + '...' : cvDataString, 
      requestId);

    // Initialize Groq Client (using the key resolved earlier)
    const groq = new Groq({ apiKey: groqApiKey });

    // Create a comprehensive system prompt for more detailed content generation
    const systemPrompt = `
You are an expert instructional designer. 
Generate deeply personalized, workplace-relevant course content for professional learners.

CONTENT REQUIREMENTS:
- Analyze the employee's CV and role for context.
- Each module must include:
  - A real-world case study relevant to the employee's field.
  - At least one actionable takeaway per section.
  - A quiz (question and answer) at the end of each section.
  - Rich HTML structure: <h2>, <h3>, <ul>, <ol>, <blockquote>, <table> as appropriate.
- All output must be valid JSON as per the structure below.
`;

    // Construct a detailed user prompt with more specific requirements
    const userPrompt = `
Generate a personalized course for "${courseData.title}" for the following employee:

EMPLOYEE:
- Name: ${employeeData.name}
- Department: ${employeeData.department_name || 'Not specified'}
- Position: ${employeeData.position_title || 'Not specified'}
- CV Data: ${JSON.stringify(employeeData.cv_extracted_data)}

OUTPUT FORMAT:
{
  "title": "Personalized course title",
  "description": "Detailed, personalized course description",
  "learning_objectives": ["Objective 1", "Objective 2", "..."],
  "modules": [
    {
      "module_id": "module-1",
      "title": "Module 1 Title",
      "sections": [
        {
          "section_id": "section-1-1",
          "title": "Section 1.1 Title",
          "content": "<h2>...</h2><p>...</p>",
          "case_study": "<blockquote>...</blockquote>",
          "actionable_takeaway": "A specific, actionable step for the learner",
          "quiz": {
            "question": "Quiz question?",
            "answer": "Correct answer"
          }
        }
        // More sections...
      ]
    }
    // More modules...
  ]
}
- All fields must be present. Use clear, professional language.
- Do not include any explanations or text outside the JSON.
`;

    // Log the full prompts for debugging (but truncate if very long)
    const systemPromptForLog = systemPrompt.length > 1000 ? 
      systemPrompt.substring(0, 500) + '...\n[TRUNCATED]\n...' + systemPrompt.substring(systemPrompt.length - 500) : 
      systemPrompt;
    logWithTimestamp(`System prompt:`, systemPromptForLog, requestId);
    
    const userPromptForLog = userPrompt.length > 1000 ? 
      userPrompt.substring(0, 500) + '...\n[TRUNCATED]\n...' + userPrompt.substring(userPrompt.length - 500) : 
      userPrompt;
    logWithTimestamp(`User prompt:`, userPromptForLog, requestId);
    
    logWithTimestamp(`Sending prompts to Groq...`, { systemPromptLength: systemPrompt.length, userPromptLength: userPrompt.length }, requestId);

    // Update job status before calling Groq
    await supabase.from('content_generation_jobs').update({ 
        current_step: 3, 
        progress: 30, 
        step_description: 'Calling Groq API for content generation', 
        updated_at: new Date().toISOString() 
    }).eq('id', jobId);

    // Call Groq API with system and user prompts
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        model: 'qwen-qwq-32b', // Switched to Qwen model for experimentation
        temperature: 0.4, // Lowered for more focused output
        max_tokens: 8192, // Increased token limit for longer content
        response_format: { type: "json_object" }, // Request JSON output
    });

    const groqResponseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!groqResponseContent) {
        throw new Error('Groq API returned an empty response.');
    }

    logWithTimestamp(`Received response from Groq. Attempting to parse...`, undefined, requestId);

    // Update job status after Groq call
    await supabase.from('content_generation_jobs').update({ 
        current_step: 4, 
        progress: 50, 
        step_description: 'Parsing Groq response', 
        updated_at: new Date().toISOString() 
    }).eq('id', jobId);

    // Parse the JSON response from Groq (expecting new structure)
    let parsedContent: {
        title: string;
        description: string;
        learning_objectives: string[];
        modules: Array<{
          module_id: string;
          title: string;
          sections: Array<{
            section_id: string;
            title: string;
            content: string;
            case_study: string;
            actionable_takeaway: string;
            quiz: { question: string; answer: string };
          }>;
        }>;
    };
    try {
        parsedContent = JSON.parse(groqResponseContent);
        // Basic validation of parsed structure
        if (!parsedContent.title || !parsedContent.modules || !Array.isArray(parsedContent.modules)) {
            throw new Error('Parsed Groq response is missing required fields (title, modules).');
        }
    } catch (parseError: any) {
        logWithTimestamp(`Error parsing Groq JSON response:`, parseError, requestId);
        logWithTimestamp(`Raw Groq response content:`, groqResponseContent, requestId);
        throw new Error(`Failed to parse content from Groq API: ${parseError.message}`);
    }

    logWithTimestamp(`Groq response parsed successfully. Storing content...`, undefined, requestId);

    // Update job status before database insertion
    await supabase.from('content_generation_jobs').update({ 
        current_step: 5, 
        progress: 70, 
        step_description: 'Storing generated content in database', 
        updated_at: new Date().toISOString() 
    }).eq('id', jobId);
    
    // Generate a unique ID for potential new content
    const contentId = uuidv4();

    // 1. First, check if content already exists
    const { data: existingContent, error: checkError } = await supabase
      .from('ai_course_content')
      .select('id')
      .eq('course_id', courseId)
      .eq('version', '1.0')
      .eq('created_for_user_id', employeeId)
      .single();

    let actualContentId: string;
    
    if (existingContent) {
      // Content exists, update it
      actualContentId = existingContent.id;
      logWithTimestamp(`Existing content found with ID: ${actualContentId}. Updating...`, undefined, requestId);
      
      // Update the existing content
      const { error: updateError } = await supabase
        .from('ai_course_content')
        .update({
          title: parsedContent.title,
          description: parsedContent.description,
          learning_objectives: parsedContent.learning_objectives || [],
          is_active: true,
          personalization_context: employeeData?.cv_extracted_data || {},
          metadata: { 
              generation_method: 'groq', 
              model_used: 'qwen-qwq-32b',
              job_id: jobId,
              request_id: requestId,
              updated: new Date().toISOString()
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', actualContentId);
      
      if (updateError) {
        logWithTimestamp(`Error updating ai_course_content:`, updateError, requestId);
        throw new Error(`Failed to update content: ${updateError.message}`);
      }
      
      // 1.1. Delete existing sections for this content
      logWithTimestamp(`Deleting existing sections for content ID: ${actualContentId}`, undefined, requestId);
      const { error: deleteError } = await supabase
        .from('ai_course_content_sections')
        .delete()
        .eq('content_id', actualContentId);
      
      if (deleteError) {
        logWithTimestamp(`Error deleting existing sections:`, deleteError, requestId);
        throw new Error(`Failed to delete existing sections: ${deleteError.message}`);
      }
    } else {
      // Content doesn't exist, create new
      logWithTimestamp(`No existing content found. Creating new with ID: ${contentId}`, undefined, requestId);
      actualContentId = contentId;
      
      const { error: insertError } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentId,
          course_id: courseId,
          title: parsedContent.title,
          description: parsedContent.description,
          learning_objectives: parsedContent.learning_objectives || [],
          created_for_user_id: employeeId,
          employee_id: employeeId,
          is_active: true,
          version: '1.0',
          personalization_context: employeeData?.cv_extracted_data || {},
          metadata: { 
              generation_method: 'groq', 
              model_used: 'qwen-qwq-32b',
              job_id: jobId,
              request_id: requestId 
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        logWithTimestamp(`Error inserting into ai_course_content:`, insertError, requestId);
        throw new Error(`Failed to create new content: ${insertError.message}`);
      }
    }
    
    logWithTimestamp(`Content ${existingContent ? 'updated' : 'created'} with ID: ${actualContentId}`, undefined, requestId);

    // Prepare sections, generating UUIDs for modules and sections
    const moduleUuidMap = new Map<string, string>();
    const sectionsToInsert: any[] = [];
    parsedContent.modules.forEach((module, moduleIdx) => {
      let moduleUuid = moduleUuidMap.get(module.module_id);
      if (!moduleUuid) {
        moduleUuid = uuidv4();
        moduleUuidMap.set(module.module_id, moduleUuid);
      }
      module.sections.forEach((section, sectionIdx) => {
        sectionsToInsert.push({
          id: uuidv4(),
          content_id: actualContentId,
          module_id: moduleUuid,
          section_id: uuidv4(), // Always use a generated UUID for section_id
          logical_section_id: section.section_id || null, // Store the logical string ID for display
          title: section.title,
          content: section.content,
          case_study: section.case_study,
          actionable_takeaway: section.actionable_takeaway,
          quiz: section.quiz,
          order_index: moduleIdx * 100 + sectionIdx,
        });
      });
    });

    // 2. Insert into ai_course_content_sections
    if (sectionsToInsert.length > 0) {
        const { error: sectionsInsertError } = await supabase
          .from('ai_course_content_sections')
          .insert(sectionsToInsert);

        if (sectionsInsertError) {
          logWithTimestamp(`Error inserting into ai_course_content_sections:`, sectionsInsertError, requestId);
          throw new Error(`Failed to store content sections: ${sectionsInsertError.message}`);
        }
        logWithTimestamp(`${sectionsToInsert.length} content sections stored.`, undefined, requestId);
    } else {
        logWithTimestamp(`No sections found in Groq response to store.`, undefined, requestId);
    }

    // 3. Update Enrollment Status
    logWithTimestamp(`Updating enrollment to completed status...`, undefined, requestId);
    const { error: enrollmentUpdateError } = await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_id: actualContentId, // Use the retrieved ID
        personalized_content_generation_status: 'completed',
        personalized_content_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .eq('course_id', courseId);

    if (enrollmentUpdateError) {
      logWithTimestamp(`Error updating enrollment status:`, enrollmentUpdateError, requestId);
    }

    // 4. Update Job Status to Completed
    logWithTimestamp(`Updating job ${jobId} to completed status...`, undefined, requestId);
    const { error: jobUpdateError } = await supabase
      .from('content_generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        current_step: 6,
        step_description: 'Content generation and storage completed successfully',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
     if (jobUpdateError) {
      logWithTimestamp(`Error updating job status to completed:`, jobUpdateError, requestId);
    }

    logWithTimestamp(`Content generation process completed successfully for job ${jobId}`, undefined, requestId);
    // --- END GROQ API CALL & CONTENT STORAGE ---

    // Return success response with content ID
    return res.status(200).json({
      success: true,
      message: 'Personalized content generated successfully',
      job_id: jobId,
      content_id: actualContentId,
      requestId,
      status: 'completed',
      course: {
        id: courseId,
        title: courseData.title
      },
      employee: {
        id: employeeId,
        name: employeeData.name
      }
    });
  
  } catch (error: any) {
    logWithTimestamp(`Unhandled error in content regeneration:`, error, requestId);
    return res.status(500).json({ 
      error: 'Failed to process content regeneration request',
      message: error.message,
      requestId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 