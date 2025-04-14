// Simple test endpoint for course assignment that uses hardcoded credentials
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// IMPORTANT: This endpoint uses hardcoded credentials for testing purposes
// Replace with environment variables for production use
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.QH9bEfOxTXbRQmrVYsKnQEwgIH0V-MgfHHQHnPpEcQY";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

  try {
    // For GET requests, return a test message
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Course assignment test endpoint is working',
        timestamp: new Date().toISOString()
      });
    }

    // Only accept POST requests for assignment
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are accepted for assignment'
      });
    }

    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
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
      // Silently continue if activity recording fails
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Successfully assigned course to employee',
      enrollmentId
    });
  } catch (error) {
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during course assignment'
    });
  }
}; 