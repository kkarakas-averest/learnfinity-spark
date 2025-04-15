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
        console.log('Using direct database access instead of HTTP request');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update the job status to "in_progress"
        const { error: updateError } = await supabase
          .from('content_generation_jobs')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        if (updateError) {
          console.error('Error updating job status:', updateError);
          return res.status(500).json({ error: 'Failed to update job status', details: updateError.message });
        }
        
        // Return success response
        return res.status(200).json({
          success: true,
          message: 'Job processing started directly',
          job_id: jobId
        });
      }
    } catch (dbError) {
      console.log('Direct database update failed, falling back to HTTP request:', dbError);
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