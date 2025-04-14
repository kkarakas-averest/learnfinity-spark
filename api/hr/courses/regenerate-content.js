import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request using Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      console.error('Authentication error in legacy API:', authError);
      return res.status(401).json({ error: 'Unauthorized', details: authError?.message });
    }
    
    // Forward the request to the new App Router API
    console.log('Legacy API: Forwarding request to App Router API');
    
    // Extract all cookies to forward
    const cookies = req.headers.cookie || '';
    
    // Construct the proper URL for the App Router API
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const appRouterUrl = `${baseUrl}/api/hr/courses/regenerate-content`;
    
    console.log(`Forwarding to: ${appRouterUrl}`);
    console.log(`User ID: ${session.user.id}`);
    
    // Forward the request with the same body
    const response = await fetch(appRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the auth cookie to maintain session
        'Cookie': cookies,
        // Add authorization header as alternative auth method
        'Authorization': `Bearer ${session.access_token}` 
      },
      credentials: 'include',
      body: JSON.stringify(req.body)
    });
    
    // Get the response from the App Router API
    const data = await response.json();
    
    // Return the same status code and response
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error in legacy regenerate-content API:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate course content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 