import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

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

  // *** NEW FIX: Explicitly nullify body for GET requests ***
  if (req.method === 'GET') {
    if (req.body && Object.keys(req.body).length > 0) {
      console.warn('GET request received with body. Explicitly removing body before processing.', req.body);
      // Force body to null to clear it at the infrastructure level
      req.body = null;
    }
  }

  console.log('Request received for enrollment API', { 
    method: req.method, 
    query: req.query,
    body: req.body ? 'Has body' : 'No body'
  });

  // Get course ID from the URL
  const { courseId } = req.query;
  
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials', { 
        hasUrl: Boolean(supabaseUrl), 
        hasKey: Boolean(supabaseServiceKey)
      });
      return res.status(500).json({ 
        error: 'Server configuration error - missing credentials' 
      });
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET request - check enrollment for a user
    if (req.method === 'GET') {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required as a query parameter' });
      }
      
      console.log('Looking up employee ID for user', { userId });

      // First, get employee_id from hr_employees table using user_id
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (employeeError) {
        // Handle the case where we can't find an employee record
        if (employeeError.code === 'PGRST116') { // "No rows returned" error
          console.log('No employee record found for user', { userId });
          
          // IMPORTANT: In this case, try using the userId as the employeeId directly
          // This handles the case where userId might actually BE the employeeId
          console.log('Checking enrollment with userId as employeeId fallback', { userId, courseId });
          
          const { data: enrollment, error: checkError } = await supabase
            .from('hr_course_enrollments')
            .select('*')
            .eq('employee_id', userId)
            .eq('course_id', courseId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking enrollment with userId as employeeId:', checkError);
            return res.status(500).json({ error: checkError.message });
          }

          if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
          }

          console.log('Retrieved enrollment using userId as employeeId', enrollment);
          return res.status(200).json({ enrollment });
        } else {
          // This is a real error, not just "no rows"
          console.error('Error looking up employee:', employeeError);
          return res.status(500).json({ error: `Error looking up employee: ${employeeError.message}` });
        }
      }

      const employeeId = employee?.id;
      
      if (!employeeId) {
        return res.status(404).json({ error: 'No employee record found for this user' });
      }
      
      console.log('Found employee ID, checking enrollment', { employeeId, courseId });
      
      // Now check if the employee is enrolled in the course, using employee_id
      const { data: enrollment, error: checkError } = await supabase
        .from('hr_course_enrollments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking enrollment:', checkError);
        return res.status(500).json({ error: checkError.message });
      }

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      console.log('Retrieved enrollment', enrollment);
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
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to process enrollment request' });
  }
}
