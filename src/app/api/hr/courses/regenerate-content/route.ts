import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEmployeeDataForPersonalization } from '@/lib/api/hr/employee-data';
import { AgentFactory } from '@/agents/AgentFactory';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Logging helper function to standardize log format
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

/**
 * API endpoint to regenerate personalized course content
 * POST /api/hr/courses/regenerate-content
 */
export async function POST(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8); // Generate a short request ID for tracing
  logWithTimestamp(`📩 Request received from ${req.url}`, undefined, requestId);
  logWithTimestamp(`📝 Request method: ${req.method}`, undefined, requestId);
  logWithTimestamp(`🔑 Request headers:`, Object.fromEntries(req.headers), requestId);
  
  // Emergency placeholder method - generates minimal course content without API calls
  logWithTimestamp(`⚠️ [EMERGENCY-PLACEHOLDER] Using rapid content generation without external API calls`, undefined, requestId);
  
  // Ensure only allowed methods
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    logWithTimestamp(`❌ Method not allowed: ${req.method}`, undefined, requestId);
    return NextResponse.json(
      { error: `Method ${req.method} not allowed` },
      { 
        status: 405,
        headers: {
          'Allow': 'POST, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        }
      }
    );
  }
  
  try {
    // CORS headers for preflight requests
    if (req.method === 'OPTIONS') {
      logWithTimestamp(`↩️ Responding to OPTIONS request with CORS headers`, undefined, requestId);
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Get cookies from the request for auth
    const cookieHeader = req.headers.get('cookie') || '';
    
    // Get auth header if it exists
    const authHeader = req.headers.get('authorization') || '';
    
    // Log debugging info
    logWithTimestamp(`🔐 Authentication info`, {
      cookieHeaderLength: cookieHeader.length,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 15) + '...' : 'none'
    }, requestId);
    
    // Initialize user ID and session variables
    let userId: string | undefined;
    let session: any;
    
    // Try cookie-based auth first
    logWithTimestamp(`🍪 Attempting cookie-based authentication`, undefined, requestId);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && sessionData.session?.user) {
        session = sessionData.session;
        userId = session.user.id;
        logWithTimestamp(`✅ Authenticated via cookie session for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
      } else if (sessionError) {
        logWithTimestamp(`❌ Session error:`, sessionError, requestId);
      } else {
        logWithTimestamp(`⚠️ No session data found in cookies`, undefined, requestId);
      }
    } catch (sessionError) {
      logWithTimestamp(`❌ Exception during cookie auth:`, sessionError, requestId);
    }
    
    // If no session from cookie, try JWT token from auth header
    if (!userId && authHeader) {
      logWithTimestamp(`🔑 Cookie auth failed, attempting Bearer token auth`, undefined, requestId);
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
      } else {
        logWithTimestamp(`⚠️ Auth header present but not in Bearer format: ${authHeader.substring(0, 10)}...`, undefined, requestId);
      }
    }
    
    // Last resort: try to extract auth from request URL
    if (!userId) {
      logWithTimestamp(`🔍 Previous auth methods failed, checking URL params`, undefined, requestId);
      try {
        // Some Supabase clients append the token in the URL
        const url = new URL(req.url);
        const accessToken = url.searchParams.get('access_token');
        
        if (accessToken) {
          logWithTimestamp(`🔐 Found access_token in URL (length: ${accessToken.length})`, undefined, requestId);
          const { data, error } = await supabase.auth.getUser(accessToken);
          
          if (!error && data.user) {
            userId = data.user.id;
            logWithTimestamp(`✅ Authenticated with URL token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
          } else {
            logWithTimestamp(`❌ URL token auth failed:`, error, requestId);
          }
        } else {
          logWithTimestamp(`⚠️ No access_token found in URL params`, undefined, requestId);
        }
      } catch (urlError) {
        logWithTimestamp(`❌ Exception during URL token auth:`, urlError, requestId);
      }
    }
    
    // If still no authentication, return unauthorized
    if (!userId) {
      logWithTimestamp(`❌ All authentication methods failed`, undefined, requestId);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No valid authentication found. Please log in again.'
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
    
    logWithTimestamp(`✅ Authentication successful for user ${userId.substring(0, 8)}...`, undefined, requestId);
    
    // Get request body
    let body;
    try {
      logWithTimestamp(`📦 Parsing request body...`, undefined, requestId);
      body = await req.json();
      logWithTimestamp(`📄 Request body:`, body, requestId);
    } catch (parseError) {
      logWithTimestamp(`❌ Failed to parse request body:`, parseError, requestId);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { 
      courseId, 
      forceRegenerate = true,
      personalizationOptions = {} 
    } = body;
    
    logWithTimestamp(`📋 Processed request parameters:`, { 
      courseId, 
      forceRegenerate,
      hasPersonalizationOptions: !!personalizationOptions,
      personalizationOptionsKeys: Object.keys(personalizationOptions)
    }, requestId);
    
    if (!courseId) {
      logWithTimestamp(`❌ Missing courseId in request`, undefined, requestId);
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    logWithTimestamp(`🚀 Starting content regeneration process for course: ${courseId}`, undefined, requestId);
    
    // Create or update learner profile with these options
    if (personalizationOptions) {
      logWithTimestamp(`📝 Updating learner profile for user: ${userId.substring(0, 8)}...`, undefined, requestId);
      // Update or create learner profile
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          user_id: userId,
          ...personalizationOptions
        });
      
      if (error) {
        logWithTimestamp(`❌ Error updating learner profile:`, error, requestId);
      } else {
        logWithTimestamp(`✅ Learner profile updated successfully`, undefined, requestId);
      }
    }
    
    let targetEmployeeId = userId;
    
    // If user is linked to an employee, get that ID
    logWithTimestamp(`🔍 Looking up employee mapping for user: ${userId.substring(0, 8)}...`, undefined, requestId);
    const { data: mappingData, error: mappingError } = await supabase
      .from('employee_user_mapping')
      .select('employee_id')
      .eq('user_id', userId)
      .single();
    
    if (mappingError) {
      logWithTimestamp(`⚠️ Error looking up employee mapping:`, mappingError, requestId);
    }
        
    if (mappingData?.employee_id) {
      targetEmployeeId = mappingData.employee_id;
      logWithTimestamp(`✅ Found employee mapping: ${targetEmployeeId.substring(0, 8)}...`, undefined, requestId);
    } else {
      logWithTimestamp(`⚠️ No employee mapping found, using user ID as employee ID`, undefined, requestId);
    }
    
    // Get the HR course data
    logWithTimestamp(`🔍 Verifying course exists: ${courseId}`, undefined, requestId);
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      logWithTimestamp(`❌ Error fetching course:`, courseError, requestId);
      return NextResponse.json(
        { error: 'Course not found', details: courseError?.message }, 
        { status: 404 }
      );
    }
    
    logWithTimestamp(`✅ Course verified: ${courseData.title}`, undefined, requestId);
    
    // Check for existing pending or in-progress jobs for this course and employee
    logWithTimestamp(`🔍 Checking for existing jobs for course: ${courseId} and employee: ${targetEmployeeId}`, undefined, requestId);
    
    // Check if we should use the admin client or regular client
    const adminSupabase = supabaseAdmin || supabase;
    logWithTimestamp(`🔐 Client info:`, {
      usingAdminClient: !!supabaseAdmin,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      usingFallback: !supabaseAdmin
    }, requestId);
    
    const { data: existingJobs, error: jobQueryError } = await adminSupabase
      .from('content_generation_jobs')
      .select('*')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (jobQueryError) {
      logWithTimestamp(`⚠️ Error checking for existing jobs:`, jobQueryError, requestId);
      // Continue anyway, we'll create a new job
    } else if (existingJobs && existingJobs.length > 0) {
      const existingJob = existingJobs[0];
      logWithTimestamp(`✅ Found existing ${existingJob.status} job: ${existingJob.id}`, undefined, requestId);
      
      // Update the job to ensure it's being processed
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingJob.id);
      
      // Return the existing job ID instead of creating a new one
      logWithTimestamp(`🔄 Returning existing job ID: ${existingJob.id}`, undefined, requestId);
      return NextResponse.json(
        {
          success: true,
          message: `Reusing existing ${existingJob.status} job`,
          job_id: existingJob.id,
          status: existingJob.status,
          current_step: existingJob.current_step,
          progress: existingJob.progress
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }
    
    // Create job record with ID for tracking this regeneration request
    const jobId = uuidv4();
    logWithTimestamp(`📝 Creating job record with ID: ${jobId}`, undefined, requestId);
    
    // Insert job record
    const { error: jobError } = await adminSupabase
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
      return NextResponse.json(
        { error: 'Failed to create job record', details: jobError.message },
        { status: 500 }
      );
    }
    
    logWithTimestamp(`✅ Job record created successfully, ID: ${jobId}`, undefined, requestId);
    
    // Check if the employee is already enrolled in the course
    logWithTimestamp(`🔍 Checking for existing enrollment`, undefined, requestId);
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .maybeSingle();
    
    if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
      logWithTimestamp(`❌ Error checking for enrollment:`, enrollmentCheckError, requestId);
    }
    
    if (existingEnrollment) {
      // Update the existing enrollment record
      logWithTimestamp(`📝 Updating existing course enrollment record`, undefined, requestId);
      const { error: updateError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_generation_status: 'in_progress',
          personalized_content_generation_job_id: jobId,
          updated_at: new Date().toISOString(),
          personalized_content_started_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id);
      
      if (updateError) {
        logWithTimestamp(`❌ Error updating enrollment:`, updateError, requestId);
        // Continue anyway as this is not fatal to the process
      }
    } else {
      // Create a new enrollment record
      logWithTimestamp(`📝 Creating new enrollment record`, undefined, requestId);
      const { error: insertError } = await supabase
        .from('hr_course_enrollments')
        .insert({
          employee_id: targetEmployeeId,
          course_id: courseId,
          status: 'assigned',
          progress: 0,
          enrollment_date: new Date().toISOString(),
          personalized_content_generation_status: 'in_progress',
          personalized_content_generation_job_id: jobId,
          personalized_content_started_at: new Date().toISOString()
        });
      
      if (insertError) {
        logWithTimestamp(`❌ Error updating enrollment:`, insertError, requestId);
        // Continue anyway as this is not fatal to the process
      }
    }
    
    // Force regeneration by clearing existing content (if requested)
    if (forceRegenerate) {
      // First, check for personalized content in hr_personalized_course_content
      const { data: existingPersonalizedContent } = await supabase
        .from('hr_personalized_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', targetEmployeeId);
      
      if (existingPersonalizedContent && existingPersonalizedContent.length > 0) {
        logWithTimestamp(`🔍 Found personalized content to regenerate:`, existingPersonalizedContent, requestId);
        
        // Delete existing personalized content
        for (const content of existingPersonalizedContent) {
          await supabase
            .from('hr_personalized_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
      
      // Also check for classic AI-generated content
      const { data: existingContent } = await supabase
        .from('ai_generated_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_by', userId);
      
      if (existingContent && existingContent.length > 0) {
        // Delete related data first
        for (const content of existingContent) {
          await supabase
            .from('course_content_sections')
            .delete()
            .eq('content_id', content.id);
            
          await supabase
            .from('course_module_quizzes')
            .delete()
            .eq('content_id', content.id);
        }
        
        // Then delete the main content
        for (const content of existingContent) {
          await supabase
            .from('ai_generated_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
      
      // Check for content in ai_course_content
      const { data: aiContent } = await supabase
        .from('ai_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId);
      
      if (aiContent && aiContent.length > 0) {
        // Delete related sections
        for (const content of aiContent) {
          await supabase
            .from('ai_course_content_sections')
            .delete()
            .eq('content_id', content.id);
        }
        
        // Then delete the main content
        for (const content of aiContent) {
          await supabase
            .from('ai_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
    }
    
    // Get employee data for personalization
    const employeeData = await getEmployeeDataForPersonalization(userId);
    
    // Now, trigger the content generation process
    const apiUrl = new URL(req.url);
    const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
    
    logWithTimestamp(`[SYNC-PROCESS] Starting synchronous content generation process`, undefined, requestId);
    
    try {
      // Update job status to indicate synchronous processing
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: 2,
          step_description: 'Starting synchronous content generation',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      // ------------------- EMERGENCY PLACEHOLDER CONTENT ---------------------
      // Create minimal placeholder content without any API calls
      logWithTimestamp(`[SYNC-PROCESS] Creating EMERGENCY placeholder content (no API calls)`, undefined, requestId);
      
      // Generate simple placeholder content for each module
      const generatedModules = [];
      
      // Report progress
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: 3,
          step_description: 'Creating placeholder content',
          progress: 30,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      // Create simple placeholder content for each module
      const contentOutline = {
        title: courseData.title,
        description: courseData.description || 'No description available',
        learningObjectives: [
          `Understand the core concepts of ${courseData.title}`,
          `Apply ${courseData.title} principles in your work`,
          `Develop practical skills related to ${courseData.title}`
        ],
        keywords: courseData.category ? [courseData.category] : [],
        modules: [
          {
            id: 'module-1',
            title: `Introduction to ${courseData.title}`,
            description: 'An overview of the key concepts and principles',
            orderIndex: 1,
            objectives: ['Understand the fundamentals', 'Identify key terms and concepts'],
            sections: [
              { title: 'Overview and Fundamentals', type: 'text', duration: 20 },
              { title: 'Key Concepts and Terminology', type: 'text', duration: 15 }
            ],
            resources: []
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
            ],
            resources: []
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
            ],
            resources: []
          }
        ]
      };
      
      contentOutline.modules.forEach((moduleOutline, moduleIndex) => {
        const sections = moduleOutline.sections.map((sectionOutline: any, sectionIndex: number) => ({
          id: `${moduleOutline.id}-section-${sectionIndex + 1}`,
          title: sectionOutline.title,
          content: `# ${sectionOutline.title}

## Overview

This is placeholder content for ${courseData.title} - ${moduleOutline.title} - ${sectionOutline.title}.

The content will be fully generated in a subsequent update. This is a temporary placeholder.

## Key Points

* ${courseData.title} is an important skill in the professional context
* ${moduleOutline.title} covers essential concepts within this topic
* Understanding these principles will help you in your role

## Applications

As a ${employeeData.position || 'professional'} in ${employeeData.department || 'your organization'}, 
you can apply these concepts by:

* Recognizing opportunities for effective communication
* Implementing key strategies in your daily interactions
* Improving your effectiveness through structured approaches

## Next Steps

After reviewing this section, proceed to the next section to build on these concepts.`,
          contentType: sectionOutline.type || 'text',
          orderIndex: sectionIndex + 1,
          duration: sectionOutline.duration || 20
        }));
        
        generatedModules.push({
          id: moduleOutline.id,
          title: moduleOutline.title,
          description: moduleOutline.description,
          orderIndex: moduleOutline.orderIndex,
          sections,
          resources: moduleOutline.resources || []
        });
      });
      
      logWithTimestamp(`[SYNC-PROCESS] Successfully created placeholder content for all modules`, undefined, requestId);
      
      // Create the complete personalized course content
      logWithTimestamp(`[SYNC-PROCESS] Creating full personalized course content`, undefined, requestId);
      
      // Prepare to store content
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: 7,
          step_description: 'Preparing to store content',
          progress: 70,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      // Create finalized content object
      const personalizedContent = {
        id: jobId,
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
            name: employeeData.name,
            position: employeeData.position,
            department: employeeData.department
          },
          personalization_options: personalizationOptions,
          is_placeholder: true,
          content_version: 'emergency-placeholder-1.0'
        }
      };
      
      // Store the personalized content in the database
      logWithTimestamp(`[SYNC-PROCESS] Storing content in database`, undefined, requestId);
      
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: 8,
          step_description: 'Storing generated content',
          progress: 80,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
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
        logWithTimestamp(`❌ Error storing personalized content:`, storageError, requestId);
        throw new Error(`Failed to store content: ${storageError.message}`);
      }
      
      logWithTimestamp(`[SYNC-PROCESS] Content stored successfully`, undefined, requestId);
      
      // Update the enrollment record
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          current_step: 9,
          step_description: 'Updating enrollment record',
          progress: 90,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      if (existingEnrollment) {
        logWithTimestamp(`[SYNC-PROCESS] Updating enrollment record`, undefined, requestId);
        await supabase
          .from('hr_course_enrollments')
          .update({
            personalized_content_id: personalizedContent.id,
            personalized_content_generation_status: 'completed',
            updated_at: new Date().toISOString(),
            personalized_content_completed_at: new Date().toISOString()
          })
          .eq('id', existingEnrollment.id);
      }
      
      // Mark job as completed
      await adminSupabase
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
      
      logWithTimestamp(`[SYNC-PROCESS] Content generation process completed successfully`, undefined, requestId);
      
      // Return success response with the course data
      return NextResponse.json(
        {
          success: true,
          message: 'Course content regenerated successfully',
          course: courseData,
          content: {
            id: personalizedContent.id,
            title: personalizedContent.title,
            moduleCount: personalizedContent.modules.length
          },
          job_id: jobId,
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    } catch (error: any) {
      logWithTimestamp(`❌ Error in content generation process:`, error, requestId);
      
      // Update job status to failed
      await adminSupabase
        .from('content_generation_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Failed to generate content', 
          details: error.message 
        }, 
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }
  } catch (error: any) {
    logWithTimestamp(`❌ Error in course regeneration:`, error, requestId);
    return NextResponse.json(
      { error: 'Failed to regenerate course content', details: error.message }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
} 