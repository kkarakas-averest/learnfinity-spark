// Minimal API endpoint for debugging Vercel function execution
// This endpoint has no dependencies and minimal code

export default function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Return basic success response
    return res.status(200).json({
      success: true,
      message: 'Debug endpoint working correctly',
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      error: 'Error in debug endpoint',
      message: error.message
    });
  }
} 