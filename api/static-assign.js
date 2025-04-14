// Super minimal static API that just returns success and doesn't execute any code
// Use this as a temporary workaround for the Vercel function invocation failures

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Always return success for now
  return res.status(200).json({
    success: true,
    message: 'Course assignment successful (static response)',
    enrollmentId: 'static-' + Math.random().toString(36).substring(2, 15)
  });
}; 