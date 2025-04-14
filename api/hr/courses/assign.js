// Simple adapter for course assignment API that works reliably in Vercel
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase with explicit credentials to avoid env issues
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

// For debugging purposes
console.log('API HANDLER LOADED');
console.log('ENV VARIABLES:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
  HAS_VITE_KEY: !!process.env.VITE_SUPABASE_SERVICE_KEY
});

module.exports = async (req, res) => {
  console.log('REQUEST RECEIVED:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('HANDLING OPTIONS REQUEST');
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('INVALID METHOD:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    console.log('CREATING SUPABASE CLIENT');
    
    // Use a fallback service key for testing if environment variables are failing
    const fallbackServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.QH9bEfOxTXbRQmrVYsKnQEwgIH0V-MgfHHQHnPpEcQY"; 
    
    // Initialize Supabase client
    const finalKey = SUPABASE_KEY || fallbackServiceKey;
    console.log('USING KEY TYPE:', finalKey === fallbackServiceKey ? 'FALLBACK' : 'ENV');
    
    const supabase = createClient(SUPABASE_URL, finalKey);
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
    
    console.log('SUPABASE CLIENT CREATED');

    // Parse request body
    let body;
    try {
      console.log('PARSING REQUEST BODY', typeof req.body);
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('BODY PARSED:', body ? 'SUCCESS' : 'EMPTY');
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: 'Could not parse JSON request body'
      });
    }

    // Validate required fields
    const { courseId, employeeId } = body || {};
    console.log('FIELDS:', { courseId, employeeId });
    
    if (!courseId || !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields',
        message: 'courseId and employeeId are required'
      });
    }

    // Check if employee is already enrolled
    console.log('CHECKING EXISTING ENROLLMENT');
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .maybeSingle();
      
    if (checkError) {
      console.error('CHECK ERROR:', checkError);
    }

    // Handle existing enrollment
    if (existingEnrollment) {
      console.log('EXISTING ENROLLMENT FOUND:', existingEnrollment.id);
      return res.status(200).json({
        success: true,
        message: 'Employee is already enrolled in this course',
        enrollmentId: existingEnrollment.id
      });
    }

    // Create a new enrollment
    console.log('CREATING NEW ENROLLMENT');
    const enrollmentId = uuidv4();
    const { error: insertError } = await supabase
      .from('hr_course_enrollments')
      .insert([{
        id: enrollmentId,
        course_id: courseId,
        employee_id: employeeId,
        status: 'assigned',
        progress: 0,
        score: null,
        enrollment_date: new Date().toISOString(),
        completion_date: null
      }]);

    if (insertError) {
      console.error('Error inserting enrollment:', insertError);
      return res.status(500).json({
        success: false,
        error: insertError.message,
        message: 'Failed to create enrollment'
      });
    }
    
    console.log('ENROLLMENT CREATED:', enrollmentId);

    // Record activity (non-critical, don't fail if this errors)
    try {
      console.log('RECORDING ACTIVITY');
      await supabase
        .from('hr_employee_activities')
        .insert({
          id: uuidv4(),
          employee_id: employeeId,
          activity_type: 'course_assigned',
          description: `Assigned to course: ${courseId}`,
          course_id: courseId,
          timestamp: new Date().toISOString()
        });
      console.log('ACTIVITY RECORDED');
    } catch (activityError) {
      console.error('Error recording activity (non-critical):', activityError);
    }

    // Return success
    console.log('SENDING SUCCESS RESPONSE');
    return res.status(200).json({
      success: true,
      message: 'Successfully assigned course to employee',
      enrollmentId
    });
  } catch (error) {
    console.error('COURSE ASSIGNMENT ERROR:', error);
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during course assignment'
    });
  }
}; 