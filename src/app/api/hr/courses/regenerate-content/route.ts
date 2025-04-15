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
  // Emergency placeholder method - generates minimal course content without API calls
  console.log('[EMERGENCY-PLACEHOLDER] Using rapid content generation without external API calls');
  
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
    
    console.log('[SYNC-PROCESS] Starting synchronous content generation process');
    
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
      console.log('[SYNC-PROCESS] Creating EMERGENCY placeholder content (no API calls)');
      
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
      
      console.log('[SYNC-PROCESS] Successfully created placeholder content for all modules');
      
      // Create the complete personalized course content
      console.log('[SYNC-PROCESS] Creating full personalized course content');
      
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
      console.log('[SYNC-PROCESS] Storing content in database');
      
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
        console.error('[SYNC-PROCESS] Error storing personalized content:', storageError);
        throw new Error(`Failed to store content: ${storageError.message}`);
      }
      
      console.log('[SYNC-PROCESS] Content stored successfully');
      
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
        console.log('[SYNC-PROCESS] Updating enrollment record');
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
      
      console.log('[SYNC-PROCESS] Content generation process completed successfully');
      
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
      console.error('[SYNC-PROCESS] Error in content generation process:', error);
      
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