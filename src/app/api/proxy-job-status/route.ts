import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to proxy job status requests
 * GET /api/proxy-job-status?job_id={job_id}
 */
export async function GET(req: NextRequest) {
  console.log("==== PROXY STATUS HANDLER: GET Request Received ====");

  try {
    // Get the job ID from query parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ 
        error: 'Missing job ID parameter' 
      }, { status: 400 });
    }

    console.log(`Checking status for job: ${jobId} via direct database access`);

    // Directly query the database for the job status
    const { data: job, error: jobError } = await supabase
      .from('content_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return NextResponse.json({
        error: 'Failed to fetch job details',
        details: jobError.message
      }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({
        error: 'Job not found'
      }, { status: 404 });
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
    return NextResponse.json({
      error: 'Failed to check job status',
      details: error.message
    }, { status: 500 });
  }
} 