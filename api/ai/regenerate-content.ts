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
    const systemPrompt = `You are an expert educational content creator specialized in personalized professional development.
Your task is to create comprehensive, highly tailored course content that fits the specific needs, background, and career goals of the employee.

GUIDELINES FOR CONTENT GENERATION:
1. PERSONALIZATION PRINCIPLES
   - Deeply analyze the employee's CV data to identify relevant skills, experience, and knowledge gaps
   - Adapt content difficulty and examples to match the employee's experience level and domain expertise
   - Connect new concepts to the employee's current role, department context, and industry background
   - Reference relevant technologies, methodologies, and terminology from their field when appropriate

2. CONTENT STRUCTURE REQUIREMENTS
   - Create a compelling, personalized course title that reflects the adaptation to the employee's needs
   - Write a concise but comprehensive course description (150-300 words)
   - Develop 5-8 specific learning objectives tailored to the employee's development needs
   - Organize content into logical modules with clear progression
   - Each module should contain 3-5 sections with distinct concepts
   - Ensure each section has sufficient depth (minimum 800 words of actual instructional content)

3. PEDAGOGICAL APPROACH
   - Begin each section with a clear introduction connecting to the employee's context
   - Include real-world examples related to the employee's industry and role
   - Incorporate both theoretical knowledge and practical applications
   - Provide actionable takeaways that the employee can immediately apply
   - Include reflective questions that connect content to the employee's specific work context
   - Add challenge exercises appropriate to the employee's skill level

4. CONTENT QUALITY STANDARDS
   - Use clear, professional language appropriate for workplace learning
   - Structure content with proper headings, subheadings, and formatting
   - Include bullet points, tables, and other visual elements to enhance readability
   - Balance brevity with comprehensiveness - be thorough but concise
   - Ensure HTML formatting is correct and enhances readability

5. OUTPUT FORMAT
   - Return formatted JSON exactly matching the required structure
   - Ensure all HTML content is properly formatted and escaped as needed
   - Validate that all module_id values are consistent across sections
   - Verify that all required fields are included and properly formatted

The final content should be transformative, directly applicable to the employee's work context, and designed to advance their specific career trajectory.`;

    // Construct a detailed user prompt with more specific requirements
    const userPrompt = `
Generate personalized course content for the course "${courseData.title}" based on the following employee data.

COURSE INFORMATION:
- Title: ${courseData.title}
- Description: ${courseData.description}

EMPLOYEE INFORMATION:
- Name: ${employeeData.name}
- Department: ${employeeData.department_name || 'Not specified'}
- Position: ${employeeData.position_title || 'Not specified'}
- CV Data: ${JSON.stringify(employeeData.cv_extracted_data)}

PERSONALIZATION REQUIREMENTS:
1. Analyze the employee's background, skills, and experience from their CV
2. Adapt the original course content to be specifically relevant to their role and career path
3. Use examples and scenarios that would be encountered in their specific position
4. Adjust the complexity level based on their experience and existing knowledge
5. Focus on practical applications they can implement in their current role

CONTENT STRUCTURE:
Create a minimum of 3 modules with 3-5 sections each. Each section should include:
- A personalized introduction connecting the topic to the employee's context
- Thorough explanations with examples relevant to their field
- Practical applications specific to their role
- Reflective questions that relate to their specific work environment
- Summary of key takeaways with personalized action items

OUTPUT FORMAT:
Return the content in the following JSON structure:
{
  "title": "Personalized title that references both the course topic and employee context",
  "description": "Detailed description that explains how this content has been tailored for the employee's specific needs and goals (150-300 words)",
  "learning_objectives": [
    "Objective 1 specific to employee's role",
    "Objective 2 specific to employee's development needs",
    "At least 5 total objectives"
  ],
  "sections": [
    {
      "module_id": "module-1",
      "title": "Module 1, Section 1 Title",
      "content": "Detailed HTML content for section 1.1... (minimum 800 words)"
    },
    {
      "module_id": "module-1",
      "title": "Module 1, Section 2 Title",
      "content": "Detailed HTML content for section 1.2... (minimum 800 words)"
    },
    {
      "module_id": "module-2",
      "title": "Module 2, Section 1 Title",
      "content": "Detailed HTML content for section 2.1... (minimum 800 words)"
    }
    // Additional sections...
  ]
}

Ensure the HTML content includes proper formatting with headings, paragraphs, lists, and other elements to enhance readability.`;

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
        model: 'llama-3.3-70b-versatile', // Using the latest versatile model
        temperature: 0.7,
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

    // Parse the JSON response from Groq
    let parsedContent: {
        title: string;
        description: string;
        learning_objectives: string[];
        sections: { module_id: string; title: string; content: string }[];
    };
    try {
        parsedContent = JSON.parse(groqResponseContent);
        // Basic validation of parsed structure
        if (!parsedContent.title || !parsedContent.sections || !Array.isArray(parsedContent.sections)) {
            throw new Error('Parsed Groq response is missing required fields (title, sections).');
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
              model_used: 'llama-3.3-70b-versatile',
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
              model_used: 'llama-3.3-70b-versatile',
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

    // Prepare sections, generating UUIDs for modules
    const moduleUuidMap = new Map<string, string>();
    const sectionsToInsert = parsedContent.sections.map((section, index) => {
        const originalModuleId = section.module_id || `module-${index + 1}`;
        if (!moduleUuidMap.has(originalModuleId)) {
            moduleUuidMap.set(originalModuleId, uuidv4());
        }
        const moduleUuid = moduleUuidMap.get(originalModuleId)!;
        
        return {
            id: uuidv4(),
            content_id: actualContentId, // Use the retrieved ID
            module_id: moduleUuid,
            section_id: uuidv4(),
            title: section.title,
            content: section.content,
            order_index: index,
        };
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