import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Set CORS headers helper function
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return res;
};

// Export runtime configuration for Vercel Serverless Functions
export const config = {
  regions: ['iad1'], // Washington DC region
};

// HARDCODED FALLBACK VALUES - Only used if environment variables fail
const HARDCODED_SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Read the employee ID from the query parameters
  const { employeeId } = req.query;
  if (!employeeId || Array.isArray(employeeId)) {
    return res.status(400).json({ error: 'Missing or invalid employeeId' });
  }

  // Read and validate environment variables
  let supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.VITE_SUPABASE_SERVICE_KEY;

  // Use hardcoded values if needed
  if (!supabaseUrl || supabaseUrl.includes('$') || supabaseUrl.includes('{')) {
    console.log('WARNING: Using hardcoded Supabase URL');
    supabaseUrl = HARDCODED_SUPABASE_URL;
  }

  if (!supabaseServiceKey || supabaseServiceKey.includes('$') || supabaseServiceKey.includes('{')) {
    console.log('WARNING: Using hardcoded Supabase service key');
    supabaseServiceKey = HARDCODED_SERVICE_KEY;
  }

  // Initialize Supabase with service role for API queries
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    // Query enrollments with course data
    const { data, error } = await supabase
      .from('hr_course_enrollments')
      .select('course:hr_courses(id, title, skills)')
      .eq('employee_id', employeeId);

    if (error) {
      // Log the error for debugging
      console.error('Supabase error in employee-courses:', error);
      
      // If error is about missing related row, treat as empty
      if (
        error.message.includes('No rows found') ||
        error.message.includes('foreign key constraint') ||
        error.message.includes('null value in column')
      ) {
        return res.status(200).json({ courses: [] });
      }
      
      // Otherwise, return the error
      return res.status(500).json({ error: error.message });
    }
    
    // Extract courses and filter out any null values
    const courses = (data || []).map((row: any) => row.course).filter(Boolean);
    return res.status(200).json({ courses });
  } catch (err) {
    console.error('Unexpected error in employee-courses:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
} 