import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Simple UUID validator
function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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
// IMPORTANT: For security, you should set this in Vercel environment variables 
// and only use this hardcoded key for development/debugging
// DO NOT COMMIT YOUR ACTUAL SERVICE KEY TO GIT
// Instead, add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables for Production, Preview, and Development
// ⚠️ TESTING ONLY: Fixed hardcoded key that worked previously in enrollment API ⚠️
const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzc2NzQ0MiwiZXhwIjoyMDIzMzQzNDQyfQ.VwKqRxdI1uSDkA5zcLY3zEWAyDl9OuSazkHaJbNkDRA';

// Add this type above the handler
type EmployeeSkillRow = {
  skill?: {
    id?: string;
    name?: string;
    category?: string;
  };
  proficiency?: string;
  // ...other fields from hr_employee_skills if needed
};

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

  // *** STEP 1: Read and Validate Env Vars INSIDE the handler ***
  // Try all possible environment variable names without using string interpolation
  let supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.VITE_SUPABASE_SERVICE_KEY;

  // --- BEGIN: Detailed Environment Logging ---
  const mask = (val?: string) => {
    if (!val) return '[empty]';
    if (val.length < 8) return '[too short]';
    return val.slice(0, 4) + '...' + val.slice(-4);
  };
  const logEnv = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    VITE_SUPABASE_SERVICE_KEY: mask(process.env.VITE_SUPABASE_SERVICE_KEY),
    HARDCODED_SUPABASE_URL: HARDCODED_SUPABASE_URL,
    HARDCODED_SERVICE_KEY: mask(HARDCODED_SERVICE_KEY),
    usedSupabaseUrl: supabaseUrl,
    usedServiceKey: mask(supabaseServiceKey),
  };
  console.log('==== ENV DEBUG START ====', logEnv);
  if (!process.env.SUPABASE_URL) console.warn('SUPABASE_URL is missing');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.warn('SUPABASE_SERVICE_ROLE_KEY is missing');
  if (supabaseUrl && (supabaseUrl.includes('$') || supabaseUrl.includes('{'))) console.warn('supabaseUrl contains unresolved placeholder:', supabaseUrl);
  if (supabaseServiceKey && (supabaseServiceKey.includes('$') || supabaseServiceKey.includes('{'))) console.warn('supabaseServiceKey contains unresolved placeholder:', mask(supabaseServiceKey));
  // --- END: Detailed Environment Logging ---

  // CRITICAL: Check if Supabase URL contains placeholders and use hardcoded value if needed
  if (!supabaseUrl || supabaseUrl.includes('$') || supabaseUrl.includes('{')) {
    console.warn('WARNING: Using hardcoded Supabase URL because environment variable contains placeholders or is undefined');
    supabaseUrl = HARDCODED_SUPABASE_URL;
  }

  // CRITICAL: Check if service key is missing or contains placeholders
  if (!supabaseServiceKey || supabaseServiceKey.includes('$') || supabaseServiceKey.includes('{')) {
    console.warn('WARNING: Using hardcoded Supabase service key because environment variable contains placeholders or is undefined');
    supabaseServiceKey = HARDCODED_SERVICE_KEY;
  }

  // Check if the essential variables were found and EXIT EARLY if service key is missing or invalid
  if (!supabaseServiceKey || 
      (supabaseServiceKey === '') || 
      (supabaseServiceKey.includes('REPLACE_THIS_WITH_YOUR_ACTUAL_SERVICE_KEY')) || 
      // Skip check if it's a valid-looking JWT (for testing mode)
      (!supabaseServiceKey.startsWith('eyJ'))) {
    console.error('CRITICAL ERROR: Missing or invalid Supabase Service Key. Check Vercel Environment Variables.', { 
      supabaseUrlValue: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'MISSING',
      hasServiceKeyValue: Boolean(supabaseServiceKey),
      isEmpty: supabaseServiceKey === '',
      isUnmodifiedPlaceholder: supabaseServiceKey.includes('REPLACE_THIS_WITH_YOUR_ACTUAL_SERVICE_KEY'),
      startsWithEyJ: supabaseServiceKey?.startsWith('eyJ') || false,
      envDetails: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'Defined' : 'Undefined',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Defined' : 'Undefined',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Defined' : 'Undefined',
        VITE_SUPABASE_SERVICE_KEY: process.env.VITE_SUPABASE_SERVICE_KEY ? 'Defined' : 'Undefined'
      }
    });
    // EXIT HERE if config is missing or using placeholder
    return res.status(500).json({ 
      error: 'Server configuration error - missing Supabase service key',
      details: 'You need to either:',
      options: [
        '1. Replace the placeholder in HARDCODED_SERVICE_KEY with your actual Supabase service key in the code (for development only)',
        '2. Add SUPABASE_SERVICE_ROLE_KEY to your Vercel project environment variables for all environments',
        '3. Add VITE_SUPABASE_SERVICE_KEY to your Vercel project environment variables for all environments'
      ],
      setup_instructions: 'Go to Vercel Dashboard > Your Project > Settings > Environment Variables and add the required keys'
    });
  }

  // Get the employee ID from the query
  const employeeId = req.query.employeeId as string;
  
  console.log('Request received for employee API', { 
    method: req.method, 
    query: req.query,
    url: req.url,
    employeeId
  });
  
  // Validate employeeId
  if (!employeeId) {
    console.log('Bad Request: Missing employeeId', { query: req.query, url: req.url });
    return res.status(400).json({ error: 'Employee ID is required in the URL path' });
  }
  
  if (!isValidUUID(employeeId)) {
    console.log('Bad Request: Invalid employeeId format', employeeId);
    return res.status(400).json({ error: 'Employee ID must be a valid UUID' });
  }

  try {
    // Initialize Supabase INSIDE try block, using validated variables
    console.log('Initializing Supabase with URL:', supabaseUrl.substring(0, 20) + '...'); 
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Handle GET request - fetch employee data by ID
    if (req.method === 'GET') {
      console.log('Looking up employee with ID:', employeeId);
      
      // Get the employee data from the hr_employees table
      const { data: employee, error } = await supabase
        .from('hr_employees')
        .select('*, department:hr_departments(*), position:hr_job_positions(*)')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('Error fetching employee data:', error);
        return res.status(500).json({ 
          error: 'Database error while fetching employee data',
          details: error.message
        });
      }

      if (!employee) {
        console.log('Employee not found with ID:', employeeId);
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Also get skills for this employee
      const { data: skills, error: skillsError } = await supabase
        .from('hr_employee_skills')
        .select('*, skill:hr_skills(*)')
        .eq('employee_id', employeeId);

      if (skillsError) {
        console.warn('Error fetching employee skills:', skillsError);
        // Continue with the employee data even if skills have an error
      }

      // Format the employee data
      const formattedEmployee = {
        ...employee,
        skills: skills?.map((s: EmployeeSkillRow) => ({
          id: s.skill?.id,
          name: s.skill?.name,
          category: s.skill?.category,
          proficiency: s.proficiency
        })) || []
      };

      console.log('Successfully fetched employee data');
      return res.status(200).json({ 
        data: formattedEmployee,
        success: true
      });
    }

    // If we get here, it's an unsupported method
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Unhandled server error:', error);
    return res.status(500).json({ 
      error: 'Failed to process employee request',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 