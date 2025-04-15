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
    
    // Properly construct the forward URL for both development and production
    let forwardUrl;
    
    if (process.env.VERCEL_URL) {
      // For production: ensure we use https protocol
      forwardUrl = `https://${process.env.VERCEL_URL}/api/hr/courses/personalize-content/process`;
      // Remove any potential double slashes (except in protocol)
      forwardUrl = forwardUrl.replace(/:\/\/+/g, '://').replace(/([^:])\/+/g, '$1/');
    } else {
      // For local development
      forwardUrl = 'http://localhost:3000/api/hr/courses/personalize-content/process';
    }
    
    console.log(`Proxying request to: ${forwardUrl}`);
    
    // For GET requests, append job_id as query parameter
    const targetUrl = req.method === 'GET' 
      ? `${forwardUrl}?job_id=${encodeURIComponent(jobId)}`
      : forwardUrl;
      
    // Build request options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      }
    };
    
    // Add body only for POST requests
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify({ job_id: jobId });
    }
    
    // Make the request
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
    
    // Try to parse JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Invalid JSON in response:', responseText);
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