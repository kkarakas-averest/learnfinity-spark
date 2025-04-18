// Main API entry point for Vercel deployment
export default function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  // Set CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    // Handle OPTIONS preflight requests
    return res.status(200).end();
  }
  
  res.status(200).json({ 
    status: "online", 
    timestamp,
    message: "Learnfinity API is running - available endpoints: /api/learner/dashboard",
    deploy_env: process.env.NODE_ENV || 'unknown',
    is_vercel: process.env.VERCEL || 'false',
    deploy_id: process.env.DEPLOYMENT_TIMESTAMP || 'dev'
  });
} 