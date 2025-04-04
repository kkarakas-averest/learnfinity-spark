// Main API entry point for Vercel deployment
export default function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  res.status(200).json({ 
    status: "online", 
    timestamp,
    message: "Learnfinity API is running - available endpoints: /api/learner/dashboard",
    deploy_env: process.env.NODE_ENV || 'unknown',
    is_vercel: process.env.VERCEL_DEPLOYMENT === 'true',
    deploy_id: process.env.DEPLOYMENT_TIMESTAMP || 'dev'
  });
} 