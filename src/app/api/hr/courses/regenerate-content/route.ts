import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEmployeeDataForPersonalization } from '@/lib/api/hr/employee-data';
import { AgentFactory } from '@/agents/AgentFactory';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to regenerate personalized course content
 * POST /api/hr/courses/regenerate-content
 */
export async function POST(req: NextRequest) {
  try {
    // CORS headers for preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    console.log('Received regenerate-content request on App Router API');
    console.log('Cookie header length:', cookieHeader.length);
    console.log('Has auth header:', !!authHeader);
    
    // Initialize user ID and session variables
    let userId: string | undefined;
    let session: any;
    
    // Try cookie-based auth first
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && sessionData.session?.user) {
        session = sessionData.session;
        userId = session.user.id;
        console.log('Authenticated via cookie session for user:', userId);
      } else if (sessionError) {
        console.error('Session error:', sessionError);
      }
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
    }
    
    // If no session from cookie, try JWT token from auth header
    if (!userId && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        console.log('Attempting authentication with Bearer token');
        
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data.user) {
            userId = data.user.id;
            console.log('Authenticated with Bearer token for user:', userId);
          } else {
            console.error('Bearer token auth failed:', error);
          }
        } catch (tokenError) {
          console.error('Error authenticating with token:', tokenError);
        }
      }
    }
    
    // Last resort: try to extract auth from request URL
    if (!userId) {
      try {
        // Some Supabase clients append the token in the URL
        const url = new URL(req.url);
        const accessToken = url.searchParams.get('access_token');
        
        if (accessToken) {
          console.log('Attempting authentication with URL token');
          const { data, error } = await supabase.auth.getUser(accessToken);
          
          if (!error && data.user) {
            userId = data.user.id;
            console.log('Authenticated with URL token for user:', userId);
          }
        }
      } catch (urlError) {
        console.error('Error with URL token auth:', urlError);
      }
    }
    
    // If still no authentication, return unauthorized
    if (!userId) {
      console.error('Authentication failed on regenerate-content route');
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
    
    console.log('Successfully authenticated user:', userId);
    
    // Get request body
    const body = await req.json();
    const { 
      courseId, 
      forceRegenerate = true,
      personalizationOptions = {} 
    } = body;
    
    console.log('Request data:', { 
      courseId, 
      forceRegenerate,
      hasPersonalizationOptions: !!personalizationOptions,
    });
    
    if (!courseId) {
      console.log('Missing courseId in request');
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    console.log('Starting content regeneration process for course:', courseId);
    
    // Create or update learner profile with these options
    if (personalizationOptions) {
      console.log('Updating learner profile for user:', userId);
      // Update or create learner profile
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          user_id: userId,
          ...personalizationOptions
        });
      
      if (error) {
        console.error('Error updating learner profile:', error);
      }
    }
    
    let targetEmployeeId = userId;
    
    // If user is linked to an employee, get that ID
    console.log('Looking up employee mapping for user:', userId);
    const { data: mappingData } = await supabase
      .from('employee_user_mapping')
      .select('employee_id')
      .eq('user_id', userId)
      .single();
        
    if (mappingData?.employee_id) {
      targetEmployeeId = mappingData.employee_id;
      console.log('Found employee mapping:', targetEmployeeId);
    } else {
      console.log('No employee mapping found, using user ID as employee ID');
    }
    
    // Get the HR course data
    console.log('Verifying course exists:', courseId);
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { error: 'Course not found', details: courseError?.message }, 
        { status: 404 }
      );
    }
    
    console.log('Course verified:', courseData.title);
    
    // Create job record with ID for tracking this regeneration request
    const jobId = uuidv4();
    console.log('Creating job record with ID:', jobId);
    
    // Check if we should use the admin client or regular client
    const adminSupabase = supabaseAdmin || supabase;
    console.log('Using adminSupabase client:', !!adminSupabase, 'Has service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
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
      console.error('Error creating job record:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job record', details: jobError.message },
        { status: 500 }
      );
    }
    
    console.log('Job record created successfully, ID:', jobId);
    
    // Check if the employee is already enrolled in the course
    console.log('Checking for existing enrollment for employee and course');
    const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .maybeSingle();
    
    if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
      console.error('Error checking for enrollment:', enrollmentCheckError);
    }
    
    if (existingEnrollment) {
      // Update the existing enrollment record
      console.log('Updating course enrollment record');
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
        console.error('Error updating enrollment:', updateError);
        // Continue anyway as this is not fatal to the process
      }
    } else {
      // Create a new enrollment record
      console.log('Creating new enrollment record');
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
        console.error('Error updating enrollment:', insertError);
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
        console.log('Found personalized content to regenerate:', existingPersonalizedContent);
        
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
    
    // Set up background job processing
    console.log('Setting up background job processing');
    
    // Create a unique ID for this background job run
    const backgroundJobId = uuidv4();
    
    // Start the background job asynchronously
    setTimeout(async () => {
      try {
        console.log(`[background-job:${backgroundJobId}] Starting content generation process`);
        
        // Make an API call to the content generation endpoint
        const response = await fetch(`${baseUrl}/api/hr/courses/generate-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || '',
            ...(req.headers.get('authorization') ? 
              { 'Authorization': req.headers.get('authorization') || '' } : {})
          },
          body: JSON.stringify({
            courseId,
            employeeId: targetEmployeeId,
            personalizationOptions,
            jobId
          })
        });
        
        if (!response.ok) {
          console.error(`[background-job:${backgroundJobId}] API call failed with status: ${response.status}`);
          // Update job status to failed
          await adminSupabase
            .from('content_generation_jobs')
            .update({
              status: 'failed',
              error_message: `API call failed with status: ${response.status}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        } else {
          console.log(`[background-job:${backgroundJobId}] API call completed successfully`);
        }
      } catch (error: any) {
        console.error(`[background-job:${backgroundJobId}] Error:`, error);
        // Update job status to failed
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
    
    console.log('Background job scheduled, returning success response');
    
    // Return success response with the course data
    return NextResponse.json(
      {
        success: true,
        message: 'Course content regeneration started successfully',
        course: courseData
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in course regeneration:', error);
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