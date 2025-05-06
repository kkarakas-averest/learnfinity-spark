// Simple test API for positions requirements
// This provides a healthcheck endpoint to verify routing is working

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check environment variables more thoroughly
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    VITE_SUPABASE_URL_exists: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_URL_exists: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_SERVICE_KEY_exists: !!process.env.VITE_SUPABASE_SERVICE_KEY
  };
  
  // Get partial key information for security debugging
  const partialKeyInfo = process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? {
        length: process.env.SUPABASE_SERVICE_ROLE_KEY.length,
        starts_with: process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...',
        is_jwt: process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')
      }
    : { not_available: true };
  
  // Return a successful response with diagnostic info
  return res.status(200).json({
    success: true,
    message: 'Positions API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    environment: envVars,
    supabase_config: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'not set',
      service_key_info: partialKeyInfo,
      actual_url_used: 'https://ujlqzkkkfatehxeqtbdl.supabase.co'
    },
    headers: {
      host: req.headers.host,
      user_agent: req.headers['user-agent'],
      'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'] || 'not set'
    }
  });
} 