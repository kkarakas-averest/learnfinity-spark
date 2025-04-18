const { NextResponse } = require('next/server');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

// Logging helper function to standardize log format
const logWithTimestamp = (message, data, requestId) => {
  const timestamp = new Date().toISOString();
  const reqIdText = requestId ? `[ReqID:${requestId}] ` : '';
  const logPrefix = `[${timestamp}] [REGENERATE-CONTENT] ${reqIdText}`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

/**
 * API endpoint to regenerate personalized course content
 * This is the Vercel serverless function version
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const requestId = uuidv4().slice(0, 8); // Generate a short request ID for tracing
  logWithTimestamp(`📩 Request received`, undefined, requestId);
  
  try {
    // Initialize user ID and session variables
    let userId;
    
    // Try authentication from various sources
    const authHeader = req.headers.authorization || '';
    
    // Check for Bearer token in Authorization header
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      logWithTimestamp(`🔐 Extracted Bearer token (length: ${token.length})`, undefined, requestId);
      
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          userId = data.user.id;
          logWithTimestamp(`✅ Authenticated with Bearer token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
        } else {
          logWithTimestamp(`❌ Bearer token auth failed:`, error, requestId);
        }
      } catch (tokenError) {
        logWithTimestamp(`❌ Exception during Bearer token auth:`, tokenError, requestId);
      }
    }
    
    // If not found in header, try access_token from query
    if (!userId) {
      const accessToken = req.query.access_token;
      
      if (accessToken) {
        logWithTimestamp(`🔐 Found access_token in URL (length: ${accessToken.length})`, undefined, requestId);
        const { data, error } = await supabase.auth.getUser(accessToken);
        
        if (!error && data.user) {
          userId = data.user.id;
          logWithTimestamp(`✅ Authenticated with URL token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
        } else {
          logWithTimestamp(`❌ URL token auth failed:`, error, requestId);
        }
      }
    }
    
    // If not found in query, try in body
    if (!userId && req.body) {
      const bodyToken = req.body.access_token;
      
      if (bodyToken) {
        logWithTimestamp(`🔐 Found access_token in request body`, undefined, requestId);
        const { data, error } = await supabase.auth.getUser(bodyToken);
        
        if (!error && data.user) {
          userId = data.user.id;
          logWithTimestamp(`✅ Authenticated with body token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
        } else {
          logWithTimestamp(`❌ Body token auth failed:`, error, requestId);
        }
      }
    }
    
    // If still no authentication, return unauthorized
    if (!userId) {
      logWithTimestamp(`❌ All authentication methods failed`, undefined, requestId);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: 'No valid authentication found. Please log in again.'
      });
    }

    // Parse request body
    const { courseId, forceRegenerate = true, personalizationOptions = {} } = req.body;
    
    if (!courseId) {
      logWithTimestamp(`❌ Missing courseId in request`, undefined, requestId);
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    logWithTimestamp(`🚀 Starting content regeneration process for course: ${courseId}`, undefined, requestId);
    
    // Create job record with ID for tracking this regeneration request
    const jobId = uuidv4();
    logWithTimestamp(`📝 Creating job record with ID: ${jobId}`, undefined, requestId);
    
    let targetEmployeeId = userId;
    
    // If user is linked to an employee, get that ID
    // Check first in employee_user_mapping table
    const client = supabaseAdmin || supabase;
    const { data: mappingData, error: mappingError } = await client
      .from('employee_user_mapping')
      .select('employee_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!mappingError && mappingData?.employee_id) {
      targetEmployeeId = mappingData.employee_id;
      logWithTimestamp(`✅ Found employee mapping: ${targetEmployeeId.substring(0, 8)}...`, undefined, requestId);
    } else {
      // Try employees table next if mapping not found
      const { data: employeeData, error: employeeError } = await client
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!employeeError && employeeData?.id) {
        targetEmployeeId = employeeData.id;
        logWithTimestamp(`✅ Found employee via direct lookup: ${targetEmployeeId.substring(0, 8)}...`, undefined, requestId);
      } else {
        logWithTimestamp(`ℹ️ No employee mapping found, using user ID as employee ID: ${userId}`, undefined, requestId);
      }
    }
    
    // Check for existing pending or in-progress jobs for this course and employee
    const { data: existingJobs, error: jobQueryError } = await client
      .from('content_generation_jobs')
      .select('*')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!jobQueryError && existingJobs && existingJobs.length > 0) {
      const existingJob = existingJobs[0];
      logWithTimestamp(`✅ Found existing ${existingJob.status} job: ${existingJob.id}`, undefined, requestId);
      
      // Update the job to ensure it's being processed
      await client
        .from('content_generation_jobs')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingJob.id);
      
      // Return the existing job ID instead of creating a new one
      logWithTimestamp(`🔄 Returning existing job ID: ${existingJob.id}`, undefined, requestId);
      return res.status(200).json({
        success: true,
        message: `Reusing existing ${existingJob.status} job`,
        job_id: existingJob.id,
        status: existingJob.status,
        current_step: existingJob.current_step,
        progress: existingJob.progress
      });
    }
    
    // Insert new job record
    const { error: jobError } = await client
      .from('content_generation_jobs')
      .insert({
        id: jobId,
        course_id: courseId,
        employee_id: targetEmployeeId,
        status: 'in_progress',
        total_steps: 10, // Default total steps
        current_step: 1,  // Start at step 1
        progress: 0,      // 0% progress
        step_description: 'Initializing content generation process',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          personalization_options: personalizationOptions
        }
      });
      
    if (jobError) {
      logWithTimestamp(`❌ Error creating job record:`, jobError, requestId);
      return res.status(500).json({ 
        error: 'Failed to create job record', 
        details: jobError.message 
      });
    }
    
    logWithTimestamp(`✅ Job record created successfully, ID: ${jobId}`, undefined, requestId);
    
    // Create placeholder content synchronously
    // Get the HR course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      logWithTimestamp(`❌ Error fetching course:`, courseError, requestId);
      return res.status(404).json({ 
        error: 'Course not found', 
        details: courseError?.message 
      });
    }

    // Generate simple placeholder content for each module
    const contentOutline = {
      title: courseData.title,
      description: courseData.description || 'No description available',
      learningObjectives: [
        `Understand the core concepts of ${courseData.title}`,
        `Apply ${courseData.title} principles in your work`,
        `Develop practical skills related to ${courseData.title}`
      ],
      modules: [
        {
          id: 'module-1',
          title: `Introduction to ${courseData.title}`,
          description: 'An overview of the key concepts and principles',
          orderIndex: 1,
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
          sections: [
            { title: 'Practical Implementation', type: 'text', duration: 30 },
            { title: 'Case Studies', type: 'text', duration: 20 }
          ]
        }
      ]
    };
    
    // Create the complete personalized course content
    const personalizedContent = {
      id: jobId,
      course_id: courseId,
      employee_id: targetEmployeeId,
      title: courseData.title,
      description: courseData.description || 'No description available',
      level: courseData.difficulty_level || 'Intermediate',
      modules: contentOutline.modules.map((moduleOutline, index) => ({
        id: moduleOutline.id,
        title: moduleOutline.title,
        description: moduleOutline.description,
        orderIndex: moduleOutline.orderIndex,
        sections: moduleOutline.sections.map((sectionOutline, sIndex) => ({
          id: `${moduleOutline.id}-section-${sIndex + 1}`,
          title: sectionOutline.title,
          content: `# ${sectionOutline.title}\n\nThis is placeholder content for ${courseData.title} - ${moduleOutline.title}.`,
          contentType: sectionOutline.type || 'text',
          orderIndex: sIndex + 1,
          duration: sectionOutline.duration || 20
        }))
      })),
      metadata: {
        generated_at: new Date().toISOString(),
        job_id: jobId,
        is_placeholder: true,
        content_version: 'serverless-function-1.0'
      }
    };
    
    // Store the personalized content in the database
    const { error: storageError } = await supabase
      .from('hr_personalized_course_content')
      .insert({
        id: personalizedContent.id,
        course_id: courseId,
        employee_id: targetEmployeeId,
        content: personalizedContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      });
      
    if (storageError) {
      logWithTimestamp(`❌ Error storing personalized content:`, storageError, requestId);
      throw new Error(`Failed to store content: ${storageError.message}`);
    }
    
    // Mark job as completed
    await client
      .from('content_generation_jobs')
      .update({
        status: 'completed',
        current_step: 10,
        step_description: 'Content generation completed successfully',
        progress: 100,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Return success response with the course data
    return res.status(200).json({
      success: true,
      message: 'Course content regenerated successfully',
      course: courseData,
      content: {
        id: personalizedContent.id,
        title: personalizedContent.title,
        moduleCount: personalizedContent.modules.length
      },
      job_id: jobId,
    });
  } catch (error) {
    logWithTimestamp(`❌ Error in course regeneration:`, error, requestId);
    return res.status(500).json({ 
      error: 'Failed to regenerate course content', 
      details: error.message || 'Unknown error'
    });
  }
}; 