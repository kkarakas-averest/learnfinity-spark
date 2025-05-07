import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to serve runtime environment variables to the client
 * Returns only whitelisted environment variables for security
 * Includes hardcoded fallbacks for critical services
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('[API] Runtime env request received');
    
    // Define which environment variables are safe to expose to the client
    const allowedEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_GROQ_API_KEY',
      'VITE_GROQ_API_KEY',
      'VITE_ENABLE_LLM',
      'NEXT_PUBLIC_ENABLE_LLM'
    ];
    
    // Create an object with only the allowed environment variables
    const clientEnv: Record<string, string> = {};
    
    // Add allowed environment variables to the response
    allowedEnvVars.forEach(key => {
      if (process.env[key]) {
        clientEnv[key] = process.env[key] as string;
      }
    });
    
    // Hardcoded fallbacks - IMPORTANT: ensure these are used only as fallbacks
    // and that production uses proper environment variables
    
    // If Supabase URL is missing, use fallback
    if (!clientEnv['VITE_SUPABASE_URL'] && !clientEnv['NEXT_PUBLIC_SUPABASE_URL']) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        clientEnv['VITE_SUPABASE_URL'] = supabaseUrl;
        clientEnv['NEXT_PUBLIC_SUPABASE_URL'] = supabaseUrl;
        console.log('[API] Using fallback SUPABASE_URL for VITE_SUPABASE_URL');
      }
    }
    
    // If Supabase Anon Key is missing, use fallback
    if (!clientEnv['VITE_SUPABASE_ANON_KEY'] && !clientEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseAnonKey) {
        clientEnv['VITE_SUPABASE_ANON_KEY'] = supabaseAnonKey;
        clientEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = supabaseAnonKey;
        console.log('[API] Using fallback SUPABASE_ANON_KEY for VITE_SUPABASE_ANON_KEY');
      }
    }
    
    // If Groq API Key is missing, use fallback
    if (!clientEnv['VITE_GROQ_API_KEY'] && !clientEnv['NEXT_PUBLIC_GROQ_API_KEY']) {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey) {
        clientEnv['VITE_GROQ_API_KEY'] = groqApiKey;
        clientEnv['NEXT_PUBLIC_GROQ_API_KEY'] = groqApiKey;
        console.log('[API] Using fallback GROQ_API_KEY for VITE_GROQ_API_KEY');
      }
    }
    
    // Log that we're serving environment variables (without logging the values)
    console.log(`[API] Serving runtime environment variables: ${Object.keys(clientEnv).join(', ')}`);
    
    // Return the filtered environment variables with fallbacks
    return res.status(200).json(clientEnv);
  } catch (error) {
    console.error('[API] Error serving runtime environment variables:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve environment variables',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 