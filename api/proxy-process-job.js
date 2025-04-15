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

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get request body
    const body = req.body;
    
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
    
    const response = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: JSON.stringify(body),
    });
    
    // Get the response data
    const responseData = await response.json();
    
    // Return the response
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