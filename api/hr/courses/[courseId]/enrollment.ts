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

  console.log('Request received for enrollment API', { 
    method: req.method, 
    query: req.query,
    body: typeof req.body === 'object' ? 'Has body' : 'No body'
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

      // Defensive: Warn if body is present in GET
      if (req.body && Object.keys(req.body).length > 0) {
        console.warn('GET request should not have a body. Ignoring body.', req.body);
      }

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required as a query parameter' });
      }
      
      console.log('Checking enrollment status via GET', { userId, courseId });

      // Check if the user is already enrolled
      const { data: enrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
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

      console.log('Checking enrollment status via POST', { userId, courseId });

      // Check if the user is already enrolled
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
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

      console.log('Creating new enrollment');

      // Create the enrollment
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
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
