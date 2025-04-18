
// Simple Express-compatible API endpoint for testing
// This ensures we have a basic working API endpoint in non-Next.js environments

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Test API is working correctly',
    timestamp: new Date().toISOString(),
    routes_available: [
      '/api/test-api',
      '/api/debug-api-health'
    ]
  });
}
