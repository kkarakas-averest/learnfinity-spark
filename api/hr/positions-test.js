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
  
  // Return a successful response
  return res.status(200).json({
    success: true,
    message: 'Positions API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel_url: process.env.VERCEL_URL || 'not set',
    supabase_config: {
      url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
} 