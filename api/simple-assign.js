// Simplified minimal API for course assignment with no external dependencies
// Uses Vercel's fetch API to communicate with Supabase REST API directly

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

    // Supabase configuration
    const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.QH9bEfOxTXbRQmrVYsKnQEwgIH0V-MgfHHQHnPpEcQY";

    // Check if employee is already enrolled using direct REST API
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/hr_course_enrollments?course_id=eq.${encodeURIComponent(courseId)}&employee_id=eq.${encodeURIComponent(employeeId)}&select=id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const enrollments = await checkResponse.json();
    
    // If enrollment exists, return it
    if (enrollments && enrollments.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Employee is already enrolled in this course',
        enrollmentId: enrollments[0].id
      });
    }

    // Generate a UUID for the enrollment
    // Simple UUID function without external dependencies
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    const enrollmentId = generateUUID();
    const timestamp = new Date().toISOString();

    // Create enrollment record using direct REST API
    const insertResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/hr_course_enrollments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: enrollmentId,
          course_id: courseId,
          employee_id: employeeId,
          status: 'assigned',
          progress: 0,
          score: null,
          enrollment_date: timestamp,
          completion_date: null
        })
      }
    );

    if (!insertResponse.ok) {
      return res.status(500).json({
        success: false,
        error: `Failed to create enrollment: ${insertResponse.statusText}`,
        message: 'Failed to create enrollment'
      });
    }

    // Try to record activity (non-critical)
    try {
      const activityId = generateUUID();
      await fetch(
        `${SUPABASE_URL}/rest/v1/hr_employee_activities`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            id: activityId,
            employee_id: employeeId,
            activity_type: 'course_assigned',
            description: `Assigned to course: ${courseId}`,
            course_id: courseId,
            timestamp: timestamp
          })
        }
      );
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
    console.error('Course assignment error:', error);
    
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during course assignment'
    });
  }
}; 