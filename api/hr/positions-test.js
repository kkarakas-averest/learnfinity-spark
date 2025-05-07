// @vercel/node
// Simple test API for positions requirements
// This provides a healthcheck endpoint to verify routing is working

// Export config for Vercel no longer needs runtime specification
export const config = {
  // runtime: 'nodejs' - removed as per warning
};

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return a successful response with diagnostic info
  return res.status(200).json({
    success: true,
    message: 'Positions API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    supabase_config: {
      url: 'https://ujlqzkkkfatehxeqtbdl.supabase.co',
      key_info: 'Using hardcoded service role key'
    },
    vercel_info: {
      deployment_id: req.headers['x-vercel-deployment-id'] || 'not set',
      deployment_url: req.headers['x-vercel-deployment-url'] || 'not set'
    },
    host: req.headers.host || 'unknown'
  });
} 