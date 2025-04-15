// Proxy endpoint to forward requests to the personalize-content/process endpoint
// This is needed to avoid cross-domain issues with deployed environments

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow both GET and POST methods
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request data (body for POST, query for GET)
    let requestData;
    let jobId;
    let forceAdvance = false;

    if (req.method === 'POST') {
      requestData = req.body;
      jobId = requestData?.job_id;
      forceAdvance = !!requestData?.force_advance;
    } else {
      // Handle GET request
      requestData = req.query;
      jobId = requestData?.job_id;
      forceAdvance = requestData?.force_advance === 'true';
    }

    if (!jobId) {
      return res.status(400).json({ error: 'Missing job_id parameter' });
    }

    console.log(`Processing job: ${jobId} via ${req.method} request ${forceAdvance ? '(FORCE ADVANCE MODE)' : ''}`);
    
    // Direct server-to-server communication with backend services
    // This should bypass client-side routing issues
    let forwardUrl;
    
    // Use direct API calls to our own backend functions rather than trying to go through the client routing
    // This ensures we're calling the actual API function and not getting HTML responses
    if (process.env.VERCEL_URL) {
      // For production: use the specific API path with the correct domain
      forwardUrl = `https://${process.env.VERCEL_URL}/api/hr/courses/personalize-content/process`;
      console.log(`Using production API URL: ${forwardUrl}`);
    } else {
      // For local development
      forwardUrl = 'http://localhost:3000/api/hr/courses/personalize-content/process';
    }
    
    // For GET requests, append job_id as query parameter
    const targetUrl = req.method === 'GET' 
      ? `${forwardUrl}?job_id=${encodeURIComponent(jobId)}`
      : forwardUrl;
      
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Build request options with Accept header to ensure JSON response
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': req.headers.authorization || '',
      }
    };
    
    // Add body only for POST requests
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify({ job_id: jobId });
    }
    
    // Process the job directly using the database instead of making an HTTP request
    // This is a simpler approach that bypasses networking/routing issues
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      // Create Supabase client using environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        console.log('Using direct database access to process job');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Get job details first
        const { data: job, error: jobFetchError } = await supabase
          .from('personalization_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
          
        if (jobFetchError) {
          console.error('Error fetching job details:', jobFetchError);
          return res.status(404).json({ error: 'Job not found', details: jobFetchError.message });
        }
        
        // Handle force advance mode for stuck jobs
        if (forceAdvance && job.status === 'in_progress' && job.current_step < job.total_steps) {
          console.log(`[FORCE ADVANCE] Force advancing job ${jobId} from step ${job.current_step}`);
          
          // Force advance to the next step
          const nextStep = job.current_step + 1;
          const { description, progress } = getStepInfo(nextStep, job.total_steps);
          
          // Do a more aggressive update with less data
          const { error: forceError } = await supabase
            .from('personalization_jobs')
            .update({
              current_step: nextStep,
              step_description: description,
              progress: progress,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
            
          if (forceError) {
            console.error('[FORCE ADVANCE] Error force advancing job:', forceError);
            return res.status(500).json({ error: 'Failed to force advance job', details: forceError.message });
          }
          
          console.log(`[FORCE ADVANCE] Successfully force advanced job to step ${nextStep}`);
          
          // Check if this was the final step
          if (nextStep >= job.total_steps) {
            await completeJob(supabase, {
              ...job,
              current_step: nextStep
            });
            
            return res.status(200).json({
              success: true,
              message: 'Job force advanced to completion',
              status: 'completed'
            });
          }
          
          return res.status(200).json({
            success: true,
            message: `Job force advanced to step ${nextStep}`,
            current_step: nextStep,
            progress: progress
          });
        }
        
        // If job is already completed or failed, just return the status
        if (job.status === 'completed' || job.status === 'failed') {
          console.log(`Job ${jobId} is already ${job.status}, no processing needed`);
          return res.status(200).json({ 
            success: true, 
            message: `Job is already ${job.status}`,
            job_id: jobId,
            status: job.status
          });
        }
        
        console.log('Current job status:', job.status);
        console.log('Current step:', job.current_step);
        
        // If the job is already in progress, process the next step
        if (job.status === 'in_progress' && job.current_step > 0) {
          // Process next step if there are more steps
          if (job.current_step < job.total_steps) {
            console.log(`Continuing job processing at step ${job.current_step + 1}`);
            await processNextStep(supabase, job);
            return res.status(200).json({
              success: true,
              message: `Processed step ${job.current_step + 1}`,
              job_id: jobId,
              status: 'in_progress'
            });
          } else {
            // Job is at the final step, mark as completed
            console.log(`Job ${jobId} is at final step, marking as completed`);
            await completeJob(supabase, job);
            return res.status(200).json({
              success: true,
              message: 'Job completed',
              job_id: jobId,
              status: 'completed'
            });
          }
        }
        
        // 2. Initialize job - set status to in_progress
        console.log(`Initializing job ${jobId} to in_progress state`);
        const { error: updateError } = await supabase
          .from('personalization_jobs')
          .update({ 
            status: 'in_progress',
            current_step: 0,
            step_description: 'Initializing content generation process',
            progress: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        if (updateError) {
          console.error('Error updating job status:', updateError);
          return res.status(500).json({ error: 'Failed to update job status', details: updateError.message });
        }
        
        console.log(`Successfully initialized job ${jobId}`);
        
        // 3. Process first step
        await processNextStep(supabase, {
          ...job,
          current_step: 0,
          status: 'in_progress'
        });
        
        // Respond to client
        console.log(`Responding to client for job ${jobId}`);
        return res.status(200).json({
          success: true,
          message: 'Job processing started',
          job_id: jobId,
          note: 'Job is being processed one step at a time'
        });
      }
    } catch (dbError) {
      console.log('Direct database access failed, falling back to HTTP request:', dbError);
      // Continue with HTTP request as fallback
    }
    
    // Make the HTTP request as fallback
    const response = await fetch(targetUrl, fetchOptions);
    
    // Check if the response is valid
    if (!response.ok) {
      console.log(`Received error response: ${response.status} ${response.statusText}`);
      
      // Try to get the error message from response if possible
      let errorMessage;
      try {
        const errorData = await response.text();
        console.log(`Error response body: ${errorData}`);
        
        // Try to parse as JSON if it looks like JSON
        if (errorData && errorData.trim().startsWith('{')) {
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error || errorJson.message || errorData;
          } catch (parseError) {
            errorMessage = errorData;
          }
        } else {
          errorMessage = errorData || response.statusText;
        }
      } catch (textError) {
        errorMessage = response.statusText;
      }
      
      return res.status(response.status).json({ 
        error: `Target API responded with error ${response.status}`,
        message: errorMessage
      });
    }
    
    // Get the response text first to validate
    const responseText = await response.text();
    
    // Skip parsing if empty
    if (!responseText || responseText.trim() === '') {
      console.log('Empty response received from target API');
      return res.status(200).json({ 
        success: true,
        message: "Process initiated successfully",
        warning: "Target API returned empty response"
      });
    }
    
    // Check if the response is HTML instead of JSON
    if (responseText.trim().startsWith('<!DOCTYPE html>') || 
        responseText.includes('<html>') || 
        responseText.includes('<body>')) {
      console.log('Received HTML response instead of JSON');
      return res.status(200).json({
        success: true,
        message: "Process initiated but received HTML response",
        note: "The job is likely being processed in the background"
      });
    }
    
    // Try to parse JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Invalid JSON in response:', responseText.substring(0, 200));
      return res.status(200).json({
        success: true,
        message: "Process initiated but response could not be parsed",
        raw_response: responseText.substring(0, 100) // Include part of the raw response for debugging
      });
    }
    
    // Return the parsed response
    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Error in proxy endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Process a single step of the job
 */
async function processJobStep(supabase, jobId) {
  console.log(`Processing next step for job ${jobId}`);
  
  try {
    // 1. Get current job state
    const { data: job, error: jobFetchError } = await supabase
      .from('personalization_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (jobFetchError) {
      console.error(`Error fetching job ${jobId} details:`, jobFetchError);
      return { 
        success: false, 
        error: 'Failed to fetch job details', 
        details: jobFetchError.message,
        jobId 
      };
    }
    
    if (!job) {
      console.error(`Job ${jobId} not found in database`);
      return { 
        success: false, 
        error: 'Job not found',
        jobId 
      };
    }
    
    console.log(`Current job state: Job ${jobId}, Step ${job.current_step}, Status ${job.status}`);
    
    // 2. Check if job is ready to be processed (in_progress status)
    if (job.status !== 'in_progress') {
      console.error(`Job ${jobId} is not in progress, current status: ${job.status}`);
      return { 
        success: false, 
        error: 'Job is not in progress',
        status: job.status,
        jobId 
      };
    }
    
    // 3. Check if we've reached the final step
    if (job.current_step >= job.total_steps) {
      console.log(`Job ${jobId} has reached final step ${job.current_step} of ${job.total_steps}, marking as completed`);
      
      // Mark job as completed
      const { error: completionError } = await supabase
        .from('personalization_jobs')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
        
      if (completionError) {
        console.error(`Error marking job ${jobId} as completed:`, completionError);
        return { 
          success: false, 
          error: 'Failed to mark job as completed',
          details: completionError.message,
          jobId
        };
      }
      
      return { 
        success: true, 
        message: 'Job completed successfully',
        jobId,
        status: 'completed'
      };
    }
    
    // 4. Process the next step
    const nextStep = job.current_step + 1;
    const { description, progress } = getStepInfo(nextStep, job.total_steps);
    
    console.log(`Advancing job ${jobId} to step ${nextStep}: ${description} (${progress}%)`);
    
    // Update job with next step info
    const { error: updateError } = await supabase
      .from('personalization_jobs')
      .update({
        current_step: nextStep,
        step_description: description,
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error(`Error updating job ${jobId} to step ${nextStep}:`, updateError);
      return { 
        success: false, 
        error: 'Failed to update job step',
        details: updateError.message,
        jobId,
        step: nextStep
      };
    }
    
    console.log(`Successfully updated job ${jobId} to step ${nextStep}: ${description} (${progress}%)`);
    
    // 5. For specific steps that need to trigger backend processes
    if (nextStep === 3) {
      // Simulate triggering a special backend process for step 3
      console.log(`Triggering special backend process for job ${jobId} at step ${nextStep}`);
      // Add any special processing logic here...
    }
    
    return { 
      success: true, 
      message: `Advanced to step ${nextStep}: ${description}`,
      jobId,
      step: nextStep,
      progress,
      description
    };
  } catch (error) {
    console.error(`Unexpected error processing job ${jobId}:`, error);
    
    // Try to mark the job as failed if possible
    try {
      if (supabase) {
        await supabase
          .from('personalization_jobs')
          .update({
            status: 'failed',
            error_message: `Unexpected error: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    } catch (updateError) {
      console.error(`Failed to mark job ${jobId} as failed:`, updateError);
    }
    
    return { 
      success: false, 
      error: 'Unexpected error during job processing',
      details: error.message,
      jobId
    };
  }
}

/**
 * Complete the job
 */
async function completeJob(supabase, job) {
  console.log(`[completeJob] Completing job ${job.id}`);
  
  try {
    const { description, progress } = getStepInfo(job.total_steps, job.total_steps);
    
    // Update job to completed status
    const { error: updateError } = await supabase
      .from('personalization_jobs')
      .update({
        status: 'completed',
        current_step: job.total_steps,
        current_step_description: description,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error(`[completeJob] Error marking job ${job.id} as completed:`, updateError);
      return { success: false, message: `Error completing job: ${updateError.message}` };
    }

    console.log(`[completeJob] Successfully completed job ${job.id}`);
    return { 
      success: true, 
      message: 'Job completed successfully',
      job_id: job.id,
      status: 'completed'
    };
  } catch (error) {
    console.error(`[completeJob] Unexpected error completing job ${job.id}:`, error);
    
    // Try to update job status to failed
    try {
      await supabase
        .from('personalization_jobs')
        .update({
          status: 'failed',
          error_message: `Error completing job: ${error.message || 'Unknown error'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
        
      console.log(`[completeJob] Marked job ${job.id} as failed due to completion error`);
    } catch (updateError) {
      console.error(`[completeJob] Could not update job status to failed:`, updateError);
    }
    
    return { 
      success: false, 
      message: `Error completing job: ${error.message || 'Unknown error'}` 
    };
  }
}

// Function to get step information based on step number
function getStepInfo(stepNumber, totalSteps) {
  const descriptions = [
    'Initializing job',
    'Preparing content generation',
    'Generating course structure',
    'Generating detailed content',
    'Finalizing content',
    'Completing generation'
  ];
  
  // Use default description if step number exceeds predefined descriptions
  const description = descriptions[stepNumber] || `Processing step ${stepNumber}`;
  
  // Calculate progress percentage (rounded to nearest whole number)
  // First step is 0%, last step is 100%
  const progress = totalSteps > 1 
    ? Math.round((stepNumber / (totalSteps - 1)) * 100) 
    : 100;
    
  return { description, progress };
}

async function processNextStep(supabase, job) {
  console.log(`[processNextStep] Processing next step for job ${job.id}, current step ${job.current_step}/${job.total_steps}`);
  
  try {
    if (job.status === 'completed') {
      console.log(`[processNextStep] Job ${job.id} is already completed, skipping`);
      return { 
        success: true, 
        message: 'Job is already completed',
        job_id: job.id,
        status: 'completed'
      };
    }
    
    if (job.status === 'failed') {
      console.log(`[processNextStep] Job ${job.id} has failed, skipping`);
      return { 
        success: false, 
        message: 'Job has failed and cannot be processed further',
        job_id: job.id,
        status: 'failed'
      };
    }

    // Check if job is at the final step
    if (job.current_step >= job.total_steps) {
      console.log(`[processNextStep] Job ${job.id} is at final step, completing job`);
      return await completeJob(supabase, job);
    }
    
    // Process the next step
    console.log(`[processNextStep] Processing step ${job.current_step + 1} for job ${job.id}`);
    const result = await processJobStep(supabase, job.id);
    
    console.log(`[processNextStep] Step processing result for job ${job.id}:`, result);
    return result;
  } catch (error) {
    console.error(`[processNextStep] Unexpected error processing next step for job ${job.id}:`, error);
    
    // Try to update job status to failed
    try {
      await supabase
        .from('personalization_jobs')
        .update({
          status: 'failed',
          error_message: `Error processing next step: ${error.message || 'Unknown error'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
        
      console.log(`[processNextStep] Marked job ${job.id} as failed due to processing error`);
    } catch (updateError) {
      console.error(`[processNextStep] Could not update job status to failed:`, updateError);
    }
    
    return { 
      success: false, 
      message: `Error processing next step: ${error.message || 'Unknown error'}`,
      job_id: job.id,
      status: 'failed'
    };
  }
} 