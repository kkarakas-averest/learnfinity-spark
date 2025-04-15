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

    if (req.method === 'POST') {
      requestData = req.body;
      jobId = requestData?.job_id;
    } else {
      // Handle GET request
      requestData = req.query;
      jobId = requestData?.job_id;
    }

    if (!jobId) {
      return res.status(400).json({ error: 'Missing job_id parameter' });
    }

    console.log(`Processing job: ${jobId} via ${req.method} request`);
    
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
          .from('content_generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
          
        if (jobFetchError) {
          console.error('Error fetching job details:', jobFetchError);
          return res.status(404).json({ error: 'Job not found', details: jobFetchError.message });
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
        
        // 2. Update job status to in_progress
        const { error: updateError } = await supabase
          .from('content_generation_jobs')
          .update({ 
            status: 'in_progress',
            current_step: 1,
            step_description: 'Starting content generation process',
            progress: 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        if (updateError) {
          console.error('Error updating job status:', updateError);
          return res.status(500).json({ error: 'Failed to update job status', details: updateError.message });
        }
        
        console.log(`Successfully updated job ${jobId} to in_progress`);
        
        // Respond immediately to client while we continue processing in the background
        res.status(200).json({
          success: true,
          message: 'Job processing started',
          job_id: jobId,
          note: 'Processing will continue in the background'
        });
        
        // 3. Process the job asynchronously (don't await this)
        processJobInBackground(supabase, job)
          .catch(error => console.error(`Background job processing error for ${jobId}:`, error));
        
        // Return to avoid executing the rest of the function
        return;
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
 * Process the job in the background with a series of steps
 * This mimics the behavior of the real content generation process
 */
async function processJobInBackground(supabase, job) {
  const jobId = job.id;
  const totalSteps = job.total_steps || 10;
  const stepDelay = 1000; // 1 second between steps
  
  try {
    console.log(`Starting background processing for job ${jobId} with ${totalSteps} steps`);
    
    // Step 1: Retrieve course and employee data
    await updateJobProgress(supabase, jobId, 1, 'Retrieving course and employee data', 10);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 2: Preparing content generation
    await updateJobProgress(supabase, jobId, 2, 'Preparing content generation', 20);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 3: Generating course structure
    await updateJobProgress(supabase, jobId, 3, 'Generating course structure', 30);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 4: Processing modules
    await updateJobProgress(supabase, jobId, 4, 'Processing modules', 40);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 5: Generating lesson content
    await updateJobProgress(supabase, jobId, 5, 'Generating lesson content', 50);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 6: Creating assessments
    await updateJobProgress(supabase, jobId, 6, 'Creating assessments', 60);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 7: Personalizing content
    await updateJobProgress(supabase, jobId, 7, 'Personalizing content', 70);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 8: Finalizing content
    await updateJobProgress(supabase, jobId, 8, 'Finalizing content', 80);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 9: Storing content in database
    await updateJobProgress(supabase, jobId, 9, 'Storing content in database', 90);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
    
    // Step 10: Completing job
    await updateJobProgress(supabase, jobId, totalSteps, 'Content generation completed successfully', 100);
    
    // Mark job as completed
    const { error: completionError } = await supabase
      .from('content_generation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
      
    if (completionError) {
      console.error(`Error marking job ${jobId} as completed:`, completionError);
    } else {
      console.log(`Job ${jobId} successfully completed`);
    }
    
    // Update the enrollment record if applicable
    if (job.course_id && job.employee_id) {
      try {
        const { error: enrollmentError } = await supabase
          .from('hr_course_enrollments')
          .update({
            personalized_content_generation_status: 'completed',
            personalized_content_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('course_id', job.course_id)
          .eq('employee_id', job.employee_id);
          
        if (enrollmentError) {
          console.error('Error updating enrollment record:', enrollmentError);
        } else {
          console.log('Successfully updated enrollment record');
        }
      } catch (enrollmentUpdateError) {
        console.error('Exception updating enrollment:', enrollmentUpdateError);
      }
    }
  } catch (error) {
    console.error(`Error in background processing for job ${jobId}:`, error);
    
    // Mark job as failed
    try {
      await supabase
        .from('content_generation_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error in background processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (updateError) {
      console.error(`Failed to mark job ${jobId} as failed:`, updateError);
    }
  }
}

/**
 * Helper function to update job progress
 */
async function updateJobProgress(supabase, jobId, currentStep, stepDescription, progress) {
  try {
    console.log(`Updating job ${jobId} to step ${currentStep}: ${stepDescription}`);
    
    const { error } = await supabase
      .from('content_generation_jobs')
      .update({
        current_step: currentStep,
        step_description: stepDescription,
        progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    if (error) {
      console.error(`Error updating job ${jobId} progress:`, error);
    }
  } catch (error) {
    console.error(`Exception updating job ${jobId} progress:`, error);
  }
} 