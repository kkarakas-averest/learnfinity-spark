import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create two clients - one for user operations and one for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);
// Use service role key if available for admin operations (bypasses RLS)
const adminSupabase = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : supabase; // Fall back to standard client if service role key not available

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract authentication token with fallbacks for different methods
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.query.access_token || req.body.access_token;
    
    if (!accessToken) {
      console.log('[regenerate-content] No access token found in request');
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: 'No access token provided. Please log in again.' 
      });
    }
    
    // Authenticate using the token directly
    console.log('[regenerate-content] Authenticating with token...');
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData?.user) {
      console.error('[regenerate-content] Auth error:', userError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: userError?.message || 'Invalid authentication token' 
      });
    }
    
    const userId = userData.user.id;
    console.log('[regenerate-content] Authentication successful for user:', userId);
    
    // Extract request data
    const { courseId, forceRegenerate = true, personalizationOptions = {} } = req.body;
    console.log('[regenerate-content] Request data:', { 
      courseId, 
      forceRegenerate,
      hasPersonalizationOptions: !!personalizationOptions,
    });
    
    if (!courseId) {
      console.log('[regenerate-content] Missing courseId in request');
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Process the request directly here instead of forwarding
    // This avoids any potential authentication issues with internal redirects
    console.log('[regenerate-content] Starting content regeneration process for course:', courseId);
    
    // 1. Update learner profile if needed
    try {
      if (personalizationOptions) {
        console.log('[regenerate-content] Updating learner profile for user:', userId);
        const { error: profileError } = await supabase
          .from('learner_profiles')
          .upsert({
            user_id: userId,
            preferences: personalizationOptions.preferences || {},
            ...personalizationOptions
          });
        
        if (profileError) {
          console.error('[regenerate-content] Error updating learner profile:', profileError);
        }
      }
    } catch (profileError) {
      console.error('[regenerate-content] Exception updating learner profile:', profileError);
      // Continue despite error
    }
    
    // 2. Get employee ID from mapping
    let targetEmployeeId = userId;
    try {
      console.log('[regenerate-content] Looking up employee mapping for user:', userId);
      const { data: mappingData } = await supabase
        .from('employee_user_mapping')
        .select('employee_id')
        .eq('user_id', userId)
        .single();
        
      if (mappingData?.employee_id) {
        targetEmployeeId = mappingData.employee_id;
        console.log('[regenerate-content] Found employee mapping:', targetEmployeeId);
      } else {
        console.log('[regenerate-content] No employee mapping found, using user ID as employee ID');
      }
    } catch (mappingError) {
      console.error('[regenerate-content] Exception looking up employee mapping:', mappingError);
      // Continue with user ID as employee ID
    }
    
    // 3. Verify course exists
    try {
      console.log('[regenerate-content] Verifying course exists:', courseId);
      const { data: courseData, error: courseError } = await supabase
        .from('hr_courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (courseError) {
        console.error('[regenerate-content] Error fetching course:', courseError);
        return res.status(404).json({
          error: 'Course not found',
          details: courseError?.message
        });
      }
      
      if (!courseData) {
        console.log('[regenerate-content] Course not found:', courseId);
        return res.status(404).json({
          error: 'Course not found',
          details: 'No course data returned'
        });
      }
      
      console.log('[regenerate-content] Course verified:', courseData.title);
      
      // 4. Create or update a content generation job
      const jobId = uuidv4();
      const moduleCount = 3; // Default module count
      
      console.log('[regenerate-content] Creating job record with ID:', jobId);
      // Log what client we're using
      console.log('[regenerate-content] Using adminSupabase client:', !!adminSupabase, 'Has service role key:', !!serviceRoleKey);
      
      // Create a job record
      const { error: jobError } = await adminSupabase
        .from('content_generation_jobs')
        .insert({
          id: jobId,
          course_id: courseId,
          employee_id: targetEmployeeId,
          status: 'pending',
          progress: 0,
          total_steps: moduleCount * 2 + 3, // data prep + module generation + storage
          current_step: 0,
          step_description: 'Initializing content generation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          initiated_by: userId,
          metadata: {
            course_title: courseData.title,
            employee_name: '',
            force_regenerate: forceRegenerate,
            personalization_options: personalizationOptions
          }
        });
      
      if (jobError) {
        console.error('[regenerate-content] Error creating job record:', jobError);
        
        // Enhanced error logging
        console.error('[regenerate-content] Job creation error details:', {
          code: jobError.code,
          message: jobError.message,
          details: jobError.details,
          hint: jobError.hint
        });
        
        // Check for RLS policies explicitly
        if (jobError.code === '42501' || jobError.message?.includes('violates row-level security policy')) {
          console.error('[regenerate-content] RLS error detected - validate that service role key is correctly set and has proper permissions');
          console.log('[regenerate-content] Environment inspection:', {
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY 
              ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...' 
              : 'none',
            isAdminClientFallback: adminSupabase === supabase
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to create generation job', 
          details: jobError.message 
        });
      }
      
      console.log('[regenerate-content] Job record created successfully, ID:', jobId);
      
      // Update course enrollment to reference the job
      try {
        console.log('[regenerate-content] Updating course enrollment record');
        const { error: enrollmentError } = await supabase
          .from('hr_course_enrollments')
          .update({
            personalized_content_generation_status: 'in_progress',
            personalized_content_generation_job_id: jobId,
            updated_at: new Date().toISOString(),
            personalized_content_started_at: new Date().toISOString()
          })
          .eq('course_id', courseId)
          .eq('employee_id', targetEmployeeId);
          
        if (enrollmentError) {
          console.error('[regenerate-content] Error updating enrollment:', enrollmentError);
          // Continue despite error - this is not fatal
        } else {
          console.log('[regenerate-content] Enrollment record updated successfully');
        }
      } catch (enrollmentError) {
        console.error('[regenerate-content] Exception updating enrollment:', enrollmentError);
        // Continue despite error - this is not fatal
      }
      
      // Instead of processing synchronously, enqueue a background job
      // This could be done with a message queue, but for simplicity we'll use a database table
      // and a cron job/worker process
      
      // 5. Initiate background processing (in production this would be a queue)
      // For this demo, we'll start the process asynchronously
      console.log('[regenerate-content] Setting up background job processing');
      setTimeout(async () => {
        try {
          console.log(`[regenerate-content] Starting background job ${jobId} processing`);
          await processContentGenerationJob(jobId, req.headers.authorization);
        } catch (error) {
          console.error(`[regenerate-content] Background job ${jobId} failed:`, error);
          
          // Update job status on failure
          await adminSupabase
            .from('content_generation_jobs')
            .update({
              status: 'failed',
              error_message: error.message || 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        }
      }, 100); // Start after response is sent
      
      console.log('[regenerate-content] Background job scheduled, returning success response');
      
      // 6. Return success with job information
      return res.status(200).json({
        success: true,
        message: 'Course content regeneration started in background',
        job_id: jobId,
        course: courseData
      });
    } catch (error) {
      console.error('[regenerate-content] Unhandled error:', error);
      return res.status(500).json({ 
        error: 'Server error', 
        details: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error) {
    console.error('[regenerate-content] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message || 'An unexpected error occurred'
    });
  }
}

async function processContentGenerationJob(jobId, authHeader) {
  console.log(`[background-job:${jobId}] Starting content generation process`);
  
  // 1. Get job details
  const { data: jobData, error: jobError } = await adminSupabase
    .from('content_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  if (jobError || !jobData) {
    console.error(`[background-job:${jobId}] Error retrieving job:`, jobError);
    return;
  }
  
  const { course_id: courseId, employee_id: targetEmployeeId } = jobData;
  
  // Update job status to in_progress
  await adminSupabase
    .from('content_generation_jobs')
    .update({
      status: 'in_progress',
      current_step: 1,
      step_description: 'Retrieving course and employee data',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
  
  try {
    // 2. Get course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) throw new Error(`Failed to retrieve course: ${courseError.message}`);
    
    // 3. Clean up existing content if regeneration is requested
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        current_step: 2,
        step_description: 'Cleaning up existing content',
        progress: Math.round((2 / jobData.total_steps) * 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Clear from hr_personalized_course_content
    const { data: existingPersonalizedContent } = await supabase
      .from('hr_personalized_course_content')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId);
    
    if (existingPersonalizedContent?.length > 0) {
      console.log(`[background-job:${jobId}] Removing ${existingPersonalizedContent.length} entries from hr_personalized_course_content`);
      for (const content of existingPersonalizedContent) {
        await supabase
          .from('hr_personalized_course_content')
          .delete()
          .eq('id', content.id);
      }
    }
    
    // 4. Fetch employee data for personalization
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        current_step: 3,
        step_description: 'Retrieving employee profile data',
        progress: Math.round((3 / jobData.total_steps) * 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log(`[background-job:${jobId}] Fetching employee data for ID: ${targetEmployeeId}`);
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('id', targetEmployeeId)
      .single();
    
    if (employeeError) {
      console.error(`[background-job:${jobId}] Error fetching employee data:`, employeeError);
    } else {
      // Update job with employee name
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          metadata: {
            ...jobData.metadata,
            employee_name: employeeData.name
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }
    
    // Get CV extracted data for deeper personalization
    let cvExtractedData = null;
    if (employeeData?.cv_extracted_data) {
      cvExtractedData = employeeData.cv_extracted_data;
      console.log(`[background-job:${jobId}] CV extracted data found for employee (${typeof cvExtractedData === 'object' ? 'structured' : 'text'} format)`);
    } else {
      console.log(`[background-job:${jobId}] No CV extracted data found for employee`);
    }
    
    // 5. Initialize LLM client
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        current_step: 4,
        step_description: 'Initializing AI model',
        progress: Math.round((4 / jobData.total_steps) * 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Try to get API key from various environment variables
    let apiKey = process.env.GROQ_API_KEY;
    
    // If not found, try alternative environment variables
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('${')) {
      console.log(`[background-job:${jobId}] Primary GROQ_API_KEY appears invalid, trying alternatives`);
      
      // Try alternative environment variables
      const alternatives = [
        'VITE_GROQ_API_KEY',
        'NEXT_PUBLIC_GROQ_API_KEY',
        'GROQ_KEY'
      ];
      
      for (const alt of alternatives) {
        if (process.env[alt] && process.env[alt].trim() !== '' && !process.env[alt].includes('${')) {
          apiKey = process.env[alt];
          console.log(`[background-job:${jobId}] Using alternative API key from ${alt}`);
          break;
        }
      }
    }
    
    // Hardcoded fallback for development/testing only
    const hardcodedKey = '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';
    
    // If we still don't have a valid key, try the hardcoded one for testing
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('${')) {
      console.log(`[background-job:${jobId}] No valid environment variable found, using fallback test key`);
      apiKey = hardcodedKey;
    }
    
    // Final validation
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('${')) {
      throw new Error('GROQ_API_KEY environment variable is empty or invalid');
    }
    
    // Enhanced debugging for the API key
    console.log(`[background-job:${jobId}] API key inspection:`, {
      keyExists: !!apiKey,
      keyLength: apiKey.length,
      keyType: typeof apiKey,
      keyStartsWith: apiKey.substring(0, 3),
      keyEndsWith: apiKey.substring(apiKey.length - 3),
      startsWithTemplate: apiKey.startsWith('${'),
      endsWithTemplate: apiKey.endsWith('}'),
      containsDollarSign: apiKey.includes('$'),
      containsBraces: apiKey.includes('{') || apiKey.includes('}'),
    });
    
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey });
    
    console.log(`[background-job:${jobId}] Initialized Groq client directly`);
    
    // 6. Process outlines for modules
    const moduleOutlines = [
      {
        id: 'module-1',
        title: `Introduction to ${courseData.title}`,
        description: 'An overview of the key concepts and principles',
        orderIndex: 1,
        objectives: ['Understand the fundamentals', 'Identify key terms and concepts'],
        sections: [
          { title: 'Overview and Fundamentals', type: 'text', duration: 20 },
          { title: 'Key Concepts and Terminology', type: 'text', duration: 15 }
        ]
      },
      {
        id: 'module-2',
        title: `Core ${courseData.title} Principles`,
        description: 'Detailed exploration of the main principles',
        orderIndex: 2,
        objectives: ['Understand core principles', 'Apply principles to real scenarios'],
        sections: [
          { title: 'Principle Exploration', type: 'text', duration: 25 },
          { title: 'Real-world Applications', type: 'text', duration: 20 }
        ]
      },
      {
        id: 'module-3',
        title: `Practical ${courseData.title} Applications`,
        description: 'Hands-on application and implementation',
        orderIndex: 3,
        objectives: ['Apply knowledge in practical settings', 'Develop implementation skills'],
        sections: [
          { title: 'Practical Implementation', type: 'text', duration: 30 },
          { title: 'Case Studies', type: 'text', duration: 20 },
          { title: 'Hands-on Exercise', type: 'interactive', duration: 30 }
        ]
      }
    ];
    
    // Generate content for each module
    const generatedModules = [];
    let baseStep = 5; // Starting step number for module generation
    
    for (const moduleOutline of moduleOutlines) {
      // Update job status with current module
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: baseStep,
          step_description: `Generating module: ${moduleOutline.title}`,
          progress: Math.round((baseStep / jobData.total_steps) * 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      baseStep++;
      
      console.log(`[background-job:${jobId}] Generating content for module: ${moduleOutline.title}`);
      
      // Create a personalization prefix for the prompt using CV data
      let promptTemplate = '';
      
      if (cvExtractedData) {
        // Extract profile summary from CV data
        const profileSummary = typeof cvExtractedData === 'object' ? 
          cvExtractedData.summary : 
          cvExtractedData;
          
          // Create comprehensive prompt with CV data
          promptTemplate = `
            I'm generating course content for ${employeeData.name || 'an employee'}, who works as a ${employeeData.position || 'professional'} 
            in the ${employeeData.department || 'organization'}.
            
            Here is their professional profile based on their CV:
            ${profileSummary}
            
            Please tailor the following module content to be especially relevant to their background, 
            skills, and professional context. Make references to how this content applies specifically 
            to their role and experience level where appropriate.
            
            COURSE TOPIC: ${courseData.title}
            MODULE TOPIC: ${moduleOutline.title}
            
            Generate content that is:
            1. Relevant to their professional background
            2. Aligned with their skill level
            3. Contextual to their industry and department
            4. Personalized with specific examples related to their role
            
            For each section below, provide comprehensive, informative content (500-800 words per section):
            ${moduleOutline.sections.map(section => `- ${section.title}`).join('\n')}
            
            Include practical examples, case studies, and actionable advice throughout.
            For each section, structure the content with clear headings, subheadings, and bullet points where appropriate.
            
            Since you have a large context window, please provide rich, detailed content with multiple examples, 
            explanations, practical applications, and visual descriptions where helpful. Don't be concerned about
            length as long as the content remains high quality and valuable to the learner.
            
            MODULE CONTENT:
          `;
      } else {
        // Create standard prompt without CV data
        promptTemplate = `
          You are an expert educational content creator tasked with creating personalized learning content.
          
          COURSE TITLE: ${courseData.title}
          MODULE TITLE: ${moduleOutline.title}
          DESCRIPTION: ${moduleOutline.description}
          
          LEARNING OBJECTIVES:
          ${moduleOutline.objectives.map(obj => `- ${obj}`).join('\n')}
          
          Please generate comprehensive, detailed content for the following sections (aim for 500-800 words per section):
          ${moduleOutline.sections.map(section => `- ${section.title}`).join('\n')}
          
          The content should be written for someone in the role of ${employeeData?.position || personalizationOptions.userRole || 'professional'}.
          Make the content practical and applicable to real-world scenarios.
          
          Include specific examples, case studies, and actionable advice throughout.
          For each section, structure the content with clear headings, subheadings, and bullet points where appropriate.
          
          Since you have a large context window, don't be concerned about length constraints. Focus on creating 
          high-quality, comprehensive content with multiple practical examples, detailed explanations, and 
          visual descriptions where helpful. The goal is to provide maximum value to the learner.
        `;
      }
      
      console.log(`[background-job:${jobId}] Sending request to Groq API for module: ${moduleOutline.title}`);
      const startTime = Date.now();
      
      try {
        // Make the API call directly for this module
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator specialized in creating personalized learning materials."
            },
            {
              role: "user",
              content: promptTemplate
            }
          ],
          temperature: 0.7,
          max_tokens: 8192,
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`[background-job:${jobId}] Groq API responded in ${responseTime}ms for module: ${moduleOutline.title}`);
        
        // Extract and process the content
        const generatedContent = completion.choices[0]?.message.content;
        
        // Process sections based on the generated content
        const sections = [];
        if (generatedContent) {
          // Split the content into sections based on headings
          const contentParts = generatedContent.split(/^##\s+/m);
          
          for (let i = 0; i < moduleOutline.sections.length; i++) {
            const sectionOutline = moduleOutline.sections[i];
            let sectionContent = '';
            
            // Try to match section title to content part
            const matchingPart = contentParts.find(part => 
              part.toLowerCase().includes(sectionOutline.title.toLowerCase())
            );
            
            if (matchingPart) {
              sectionContent = `## ${matchingPart}`;
            } else if (contentParts.length > i + 1) {
              // Fall back to position-based matching
              sectionContent = `## ${contentParts[i + 1]}`;
            } else {
              // Last resort - create basic content
              sectionContent = `## ${sectionOutline.title}\n\nContent for ${moduleOutline.title} - ${sectionOutline.title}`;
            }
            
            // Add the section
            sections.push({
              id: `${moduleOutline.id}-section-${i + 1}`,
              title: sectionOutline.title,
              content: sectionContent.replace(/\\n/g, '\n').replace(/\\"/g, '"'),
              contentType: sectionOutline.type || 'text',
              orderIndex: i + 1,
              duration: sectionOutline.duration || 20
            });
          }
        } else {
          console.warn(`[background-job:${jobId}] No content generated for module: ${moduleOutline.title}`);
          
          // Create fallback sections
          for (let i = 0; i < moduleOutline.sections.length; i++) {
            const sectionOutline = moduleOutline.sections[i];
            sections.push({
              id: `${moduleOutline.id}-section-${i + 1}`,
              title: sectionOutline.title,
              content: `## ${sectionOutline.title}\n\nBasic content for ${moduleOutline.title} - ${sectionOutline.title}`,
              contentType: sectionOutline.type || 'text',
              orderIndex: i + 1,
              duration: sectionOutline.duration || 20
            });
          }
        }
        
        // Add the completed module
        generatedModules.push({
          id: moduleOutline.id,
          title: moduleOutline.title,
          description: moduleOutline.description,
          orderIndex: moduleOutline.orderIndex,
          sections,
          resources: []
        });
        
      } catch (moduleError) {
        console.error(`[background-job:${jobId}] Error generating content for module ${moduleOutline.title}:`, moduleError);
        
        // Check for authentication errors specifically
        if (moduleError.message?.includes('Invalid API Key') || 
            moduleError.code === 'invalid_api_key' || 
            moduleError.status === 401) {
          
          console.log(`[background-job:${jobId}] Authentication error with Groq API. Falling back to mock content.`);
          
          // We'll throw after all modules to stop using Groq for subsequent calls
          if (moduleOutline.orderIndex === moduleOutlines.length) {
            throw new Error('Groq API authentication failed. Please check your API key.');
          }
        }
        
        // Create fallback module with basic content
        const fallbackSections = moduleOutline.sections.map((sectionOutline, index) => ({
          id: `${moduleOutline.id}-section-${index + 1}`,
          title: sectionOutline.title,
          content: `## ${sectionOutline.title}\n\nBasic content for ${moduleOutline.title} - ${sectionOutline.title}`,
          contentType: sectionOutline.type || 'text',
          orderIndex: index + 1,
          duration: sectionOutline.duration || 20
        }));
        
        generatedModules.push({
          id: moduleOutline.id,
          title: moduleOutline.title,
          description: moduleOutline.description,
          orderIndex: moduleOutline.orderIndex,
          sections: fallbackSections,
          resources: []
        });
      }
    }
    
    // 7. Create the complete personalized course content
    const finalStep = baseStep;
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        current_step: finalStep,
        step_description: 'Finalizing and storing content',
        progress: Math.round((finalStep / jobData.total_steps) * 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    const personalizedContent = {
      id: uuidv4(),
      course_id: courseId,
      employee_id: targetEmployeeId,
      title: courseData.title,
      description: courseData.description || 'No description available',
      level: courseData.difficulty_level || 'Intermediate',
      modules: generatedModules,
      metadata: {
        generated_at: new Date().toISOString(),
        job_id: jobId,
        generated_for: {
          employee_id: targetEmployeeId,
          name: employeeData?.name,
          position: employeeData?.position,
          department: employeeData?.department
        },
        personalization_options: jobData.metadata.personalization_options,
        used_cv_data: !!cvExtractedData
      }
    };
    
    // Store the personalized content in the database
    console.log(`[background-job:${jobId}] Storing personalized content with ID: ${personalizedContent.id}`);
    const { data: storedContent, error: storageError } = await supabase
      .from('hr_personalized_course_content')
      .insert({
        id: personalizedContent.id,
        course_id: courseId,
        employee_id: targetEmployeeId,
        content: personalizedContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (storageError) {
      console.error(`[background-job:${jobId}] Error storing personalized content:`, storageError);
      throw new Error(`Failed to store content: ${storageError.message}`);
    } else {
      console.log(`[background-job:${jobId}] Successfully stored personalized content`);
    }
    
    // 8. Update course enrollment
    await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_generation_status: 'completed',
        personalized_content_id: personalizedContent.id,
        updated_at: new Date().toISOString(),
        personalized_content_completed_at: new Date().toISOString()
      })
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId);
    
    // 9. Mark job as completed
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        status: 'completed',
        current_step: jobData.total_steps,
        step_description: 'Content generation completed successfully',
        progress: 100,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log(`[background-job:${jobId}] Content generation completed successfully`);
    
  } catch (error) {
    console.error(`[background-job:${jobId}] Error in content generation process:`, error);
    
    // Update job status on failure
    await adminSupabase
      .from('content_generation_jobs')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Update course enrollment
    await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_generation_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', jobData.course_id)
      .eq('employee_id', jobData.employee_id);
  }
} 