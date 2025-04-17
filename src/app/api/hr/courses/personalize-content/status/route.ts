import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { z } from 'zod';

// Request schema for job ID validation
const jobIdSchema = z.object({
  job_id: z.string().uuid()
});

/**
 * API endpoint to check the status of a personalized content generation job
 * GET /api/hr/courses/personalize-content/status?job_id={job_id}
 */
export async function GET(req: NextRequest) {
  console.log("==== STATUS HANDLER: GET Request Received ===="); // Simple log
  
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');

    // Validate job ID
    const validation = jobIdSchema.safeParse({ job_id: jobId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid job ID format', details: validation.error.format() },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('content_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return NextResponse.json(
        { error: 'Failed to fetch job details', details: jobError.message },
        { status: 500 }
      );
    }
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Return job status information
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        current_step: job.current_step,
        total_steps: job.total_steps,
        progress: job.progress,
        step_description: job.step_description,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at
      }
    });
  } catch (error: any) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status', details: error.message },
      { status: 500 }
    );
  }
} 