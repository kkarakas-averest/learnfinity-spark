import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Diagnostic API endpoint for verifying environment configuration
 * IMPORTANT: This is for debugging purposes only and should be removed in production
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check for a secret key parameter for basic protection
  const { key } = req.query;
  if (key !== 'debug-env-check') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  try {
    // Create sanitized environment info (without exposing sensitive values)
    const envInfo = {
      // System info
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      
      // Check for existence of critical variables without exposing values
      supabaseUrlExists: !!process.env.VITE_SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL,
      supabaseAnonKeyExists: !!process.env.VITE_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY,
      supabaseServiceKeyExists: !!process.env.VITE_SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_SERVICE_KEY,
      groqApiKeyExists: !!process.env.GROQ_API_KEY || !!process.env.VITE_GROQ_API_KEY,
      
      // Available environment variable keys (without values)
      availableKeys: Object.keys(process.env).filter(key => 
        !key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD')
      ),
      
      // Timestamp for caching prevention
      timestamp: new Date().toISOString()
    };
    
    // Also return HTTP headers for debugging
    const headers = {
      userAgent: req.headers['user-agent'],
      host: req.headers.host,
      referer: req.headers.referer
    };
    
    return res.status(200).json({
      status: 'ok',
      env: envInfo,
      headers
    });
  } catch (error) {
    console.error('[API] Error in debug-env endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve environment information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 