// Simple adapter for course assignment API that works reliably in Vercel
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase with explicit credentials to avoid env issues
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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
    if (!courseId || !employeeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields',
        message: 'courseId and employeeId are required'
      });
    }

    // Check if employee is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .maybeSingle();

    // Handle existing enrollment
    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: 'Employee is already enrolled in this course',
        enrollmentId: existingEnrollment.id
      });
    }

    // Create a new enrollment
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

    // Record activity (non-critical, don't fail if this errors)
    try {
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
    } catch (activityError) {
      console.error('Error recording activity (non-critical):', activityError);
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Successfully assigned course to employee',
      enrollmentId
    });
  } catch (error) {
    console.error('Course assignment error:', error);
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during course assignment'
    });
  }
}; 