
// Static API for course assignment that always returns success
// For client-side fallback testing

const { v4: uuidv4 } = require('uuid');

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

    // Generate a proper UUID for the enrollment using the uuid package
    const enrollmentId = uuidv4();

    // Return success - this endpoint always succeeds
    return res.status(200).json({
      success: true,
      message: 'Successfully assigned course to employee (static endpoint)',
      enrollmentId,
      // Add personalization flag to indicate content should be generated
      personalizationQueued: true
    });
  } catch (error) {
    console.error('Static course assignment error:', error);
    
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during static course assignment'
    });
  }
};
