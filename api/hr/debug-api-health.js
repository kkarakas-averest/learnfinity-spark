
// Simple Express.js route handler for the debug API health endpoint
// This ensures we have a working endpoint even in non-Next.js environments

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'API is working correctly via Express handler',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
