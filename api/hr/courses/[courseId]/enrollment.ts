import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Simple UUID validator
function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Extracts courseId from URL path if present
function extractCourseIdFromPath(url: string): string | null {
  const match = url?.match(/\/api\/hr\/courses\/([^\/]+)\/enrollment/);
  return match ? match[1] : null;
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

// Configure regions only
export const config = {
  regions: ['iad1'], // Default Washington DC region
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

  // Check if the essential variables were actually found and EXIT EARLY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL ERROR: Missing Supabase URL or Service Key. Check Vercel Environment Variables.', { 
      supabaseUrlValue: supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : 'MISSING',
      hasServiceKeyValue: Boolean(supabaseServiceKey),
      envDetails: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'Defined' : 'Undefined',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Defined' : 'Undefined',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Defined' : 'Undefined',
        VITE_SUPABASE_SERVICE_KEY: process.env.VITE_SUPABASE_SERVICE_KEY ? 'Defined' : 'Undefined'
      }
    });
    // EXIT HERE if config is missing
    return res.status(500).json({ error: 'Server configuration error - missing Supabase credentials' });
  }
  // *** END Env Var Check ***

  // *** STEP 2: Nullify body if GET (keep this) ***
  if (req.method === 'GET') {
    if (req.body && Object.keys(req.body).length > 0) {
      console.warn('GET request received with body...');
      req.body = null;
    }
  }

  // *** STEP 3: Log Request (keep this) ***
  console.log('Request received for enrollment API', { 
    method: req.method, 
    query: req.query,
    body: req.body ? 'Has body' : 'No body',
    headers: req.headers,
    url: req.url
  });

  // *** STEP 4: Extract and Validate courseId (keep this) ***
  let courseId = req.query.courseId as string;
  
  // If courseId isn't available in query, try to extract from URL path
  if (!courseId && req.url) {
    const pathExtractedId = extractCourseIdFromPath(req.url);
    if (pathExtractedId) {
      console.log(`CourseId extracted from URL path: ${pathExtractedId}`);
      courseId = pathExtractedId;
    }
  }
  
  console.log('CourseId parameter details:', { 
    courseIdValue: courseId,
    courseIdType: typeof courseId,
    allQueryParams: req.query
  });
  
  // Validate courseId
  if (!courseId) {
    console.log('Bad Request: Missing courseId', { query: req.query, url: req.url });
    return res.status(400).json({ error: 'Course ID is required in the URL path' });
  }
  
  if (!isValidUUID(courseId)) {
    console.log('Bad Request: Invalid courseId format', courseId);
    return res.status(400).json({ error: 'Course ID must be a valid UUID' });
  }

  // *** STEP 5: Main Try/Catch Block ***
  try {
    // Initialize Supabase INSIDE try block, using validated variables
    console.log('Initializing Supabase with URL:', supabaseUrl.substring(0, 8) + '...'); 
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Handle GET request - check enrollment for a user
    if (req.method === 'GET') {
      const userId = req.query.userId as string;
      
      if (!userId) {
        console.log('Bad Request: Missing userId');
        return res.status(400).json({ error: 'User ID is required as a query parameter' });
      }

      if (!isValidUUID(userId)) {
        console.log('Bad Request: Invalid userId format', userId);
        return res.status(400).json({ error: 'User ID must be a valid UUID' });
      }

      console.log('STEP 1: Looking up enrollment directly using userId as employeeId', { userId, courseId });
      
      // OPTIMIZATION: Try direct enrollment lookup first since that's the most likely case
      // Skip employee lookup entirely - assume the ID might be an employee ID already
      const { data: directEnrollment, error: directError } = await supabase
    .from('hr_course_enrollments')
    .select('*')
        .eq('employee_id', userId)
    .eq('course_id', courseId)
    .single();

      if (directEnrollment) {
        // Success! Return the enrollment directly without any employee lookup
        console.log('DIRECT HIT: Found enrollment directly using userId as employeeId', directEnrollment);
        return res.status(200).json({ enrollment: directEnrollment });
      }
      
      // If no direct hit but no real error (just no rows), proceed to employee lookup
      if (directError && directError.code !== 'PGRST116') {
        console.error('Error checking direct enrollment:', directError);
      } else {
        console.log('No direct enrollment found, attempting employee mapping...');
      }
      
      console.log('STEP 2: Looking up employee ID for user', { userId });

      // Now try mapping user_id to employee_id if direct lookup failed
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id, user_id, name')
        .eq('user_id', userId)
        .single();

      // Log exactly what we found to debug
      if (employee) {
        console.log('Found employee record:', employee);
      } else {
        console.log('No employee record found with this user_id', { userId });
      }

      if (employeeError) {
        if (employeeError.code === 'PGRST116') { // "No rows returned" error
          console.log('No employee record with user_id matching', { userId });
          
          // We already tried the direct lookup above, so no need to fall back again
          return res.status(404).json({ error: 'Enrollment not found' });
        } else {
          // This is a real error, not just "no rows"
          console.error('Database error looking up employee:', employeeError);
          return res.status(500).json({ 
            error: `Error looking up employee: ${employeeError.message}`,
            details: employeeError
          });
        }
      }

      const employeeId = employee?.id;
      
      if (!employeeId) {
        console.log('Found employee record but missing ID field');
        return res.status(404).json({ error: 'Invalid employee record (missing ID)' });
      }
      
      // Check if it's the same as the userId (circular reference case)
      if (employeeId === userId) {
        console.log('CIRCULAR REFERENCE: employee.id equals user_id', { employeeId, userId });
        // We already tried this ID in the direct lookup above
    return res.status(404).json({ error: 'Enrollment not found' });
  }

      console.log('STEP 3: Found mapped employee ID, checking enrollment', { 
        employeeId, 
        userId, 
        isCircular: employeeId === userId, 
        courseId 
      });
      
      // Now check if the employee is enrolled in the course, using the mapped employee_id
      const { data: enrollment, error: checkError } = await supabase
        .from('hr_course_enrollments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') { // "No rows returned" error
          console.log('No enrollment found for mapped employee ID', { employeeId, courseId });
          return res.status(404).json({ error: 'Enrollment not found' });
        } else {
          // Real database error
          console.error('Error checking enrollment with mapped employee ID:', checkError);
          return res.status(500).json({ 
            error: `Database error: ${checkError.message}`,
            details: checkError
          });
        }
      }

      if (!enrollment) {
        console.log('No enrollment found after mapping user to employee');
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      console.log('SUCCESS: Retrieved enrollment using mapped employee ID', enrollment);
      return res.status(200).json({ enrollment });
    }
    
    // Handle POST request - create new enrollment
    if (req.method === 'POST') {
      // Get the user data from the request body
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required in request body' });
      }

      // First, get employee_id from hr_employees table
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (employeeError && employeeError.code !== 'PGRST116') {
        console.error('Error looking up employee:', employeeError);
        return res.status(500).json({ error: `Error looking up employee: ${employeeError.message}` });
      }

      // If no employee record found, we could either fail or use the userId as employeeId
      const employeeId = employee?.id || userId; // Fallback to userId if no employee record
      
      console.log('Checking enrollment status via POST', { userId, employeeId, courseId });

      // Check if the employee is already enrolled, using employee_id
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('hr_course_enrollments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking enrollment:', checkError);
        return res.status(500).json({ error: checkError.message });
      }

      if (existingEnrollment) {
        console.log('User already enrolled', existingEnrollment);
        return res.status(409).json({ 
          error: 'Already enrolled',
          enrollment: existingEnrollment
        });
      }

      console.log('Creating new enrollment with employee_id', { employeeId, courseId });

      // Create the enrollment using employee_id
      const { data: enrollment, error } = await supabase
        .from('hr_course_enrollments')
        .insert({
          employee_id: employeeId, // Use employee_id, not user_id
          course_id: courseId,
          status: 'active',
          enrollment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Enrollment error:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('Enrollment successful', enrollment);

      // Return the enrollment data
      return res.status(201).json({ enrollment });
    }

    // If we get here, it's an unsupported method
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Unhandled server error:', error);
    return res.status(500).json({ 
      error: 'Failed to process enrollment request',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
