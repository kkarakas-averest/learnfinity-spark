// Static API for employee creation that always returns success
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
    const { name, email, department_id } = body || {};
    if (!name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing fields',
        message: 'name, email, and department_id are required'
      });
    }

    // Generate a proper UUID for the employee using the uuid package
    const employeeId = uuidv4();
    
    // Return success - this endpoint always succeeds
    return res.status(200).json({
      success: true,
      message: 'Successfully created employee (static endpoint)',
      data: {
        id: employeeId,
        name: name,
        email: email,
        department_id: department_id,
        position_id: body.position_id || null,
        status: body.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        hire_date: body.hire_date || new Date().toISOString(),
        rag_status: 'green',
        progress: 0,
        company_id: body.company_id || '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
        phone: body.phone || null,
        user_id: uuidv4(), // Generate a fake user ID for authentication
      },
      // Include user account information
      userAccount: {
        email: email,
        id: uuidv4(),
        tempPassword: `Welcome123!${Math.floor(Math.random() * 1000)}`
      }
    });
  } catch (error) {
    console.error('Static employee creation error:', error);
    
    // Always return a proper JSON response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'An error occurred during static employee creation'
    });
  }
}; 