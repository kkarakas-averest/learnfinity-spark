// Debug API endpoint for Vercel
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Return status info
  res.status(200).json({
    status: 'ok',
    message: 'Vercel API server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    supabase_url_set: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
    supabase_key_set: !!process.env.SUPABASE_ANON_KEY || !!process.env.VITE_SUPABASE_ANON_KEY,
    env_vars: {
      // Don't include actual values of sensitive env vars
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? '✅ Running on Vercel' : '❌ Not on Vercel',
      VERCEL_ENV: process.env.VERCEL_ENV || 'Not set',
      VERCEL_URL: process.env.VERCEL_URL ? '✅ Set' : '❌ Not set',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'
    }
  });
} 