import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Request schema validation
const requestSchema = z.object({
  courseId: z.string(),
  employeeId: z.string(),
  enrollmentId: z.string(),
  personalizationOptions: z.object({
    adaptToLearningStyle: z.boolean().optional(),
    includeEmployeeExperience: z.boolean().optional(),
    useSimplifiedLanguage: z.boolean().optional(),
    includeExtraChallenges: z.boolean().optional()
  }).optional()
});

/**
 * API endpoint to start content personalization for a course enrollment
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { courseId, employeeId, enrollmentId, personalizationOptions } = validationResult.data;
    
    console.log(`Starting personalized content generation for course ${courseId}, employee ${employeeId}, enrollment ${enrollmentId}`);
    
    // Get supabase client
    const supabase = getSupabase();
    
    // Verify the enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('id, employee_id, course_id')
      .eq('id', enrollmentId)
      .eq('employee_id', employeeId)
      .eq('course_id', courseId)
      .single();
      
    if (enrollmentError || !enrollment) {
      console.error('Error fetching enrollment data:', enrollmentError);
      return NextResponse.json(
        { error: 'Enrollment not found or invalid enrollment details' },
        { status: 404 }
      );
    }
    
    // Create a job record for this personalization request
    const job_id = uuidv4();
    
    // Insert job record
    const { error: jobError } = await supabase
      .from('content_generation_jobs')
      .insert({
        id: job_id,
        enrollment_id: enrollmentId,
        course_id: courseId,
        employee_id: employeeId,
        status: 'in_progress',
        options: personalizationOptions,
        total_steps: 10, // Default total steps
        current_step: 1,  // Start at step 1
        progress: 0,      // 0% progress
        step_description: 'Initializing personalization process',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (jobError) {
      console.error('Error creating job record:', jobError);
      return NextResponse.json(
        { error: 'Failed to create personalization job', details: jobError.message },
        { status: 500 }
      );
    }
    
    // Update enrollment with job ID and status
    const { error: updateError } = await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_generation_job_id: job_id,
        personalized_content_generation_status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
      
    if (updateError) {
      console.error('Error updating enrollment record:', updateError);
      // Continue anyway to return job ID
    }
    
    // Trigger the processing job asynchronously (without awaiting the response)
    // Use setTimeout to ensure this doesn't block the response
    setTimeout(async () => {
      try {
        // Call the process endpoint
        const processResponse = await fetch(new URL('/api/hr/courses/personalize-content/process', req.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ job_id }),
        });
        
        const processResult = await processResponse.json();
        console.log('Process job response:', processResult);
      } catch (processError) {
        console.error('Error triggering process job:', processError);
        // Processing errors are handled in the process endpoint
      }
    }, 100);
    
    return NextResponse.json({
      success: true,
      message: 'Personalization job created successfully',
      job_id,
      status: 'in_progress'
    });
  } catch (error: any) {
    console.error('Error in personalization process:', error);
    return NextResponse.json(
      { error: 'Failed to start content personalization', details: error.message },
      { status: 500 }
    );
  }
} 