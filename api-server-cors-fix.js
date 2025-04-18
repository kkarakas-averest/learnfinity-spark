
// Simple Express API server with CORS setup to handle API requests
// This file doesn't rely on TypeScript and will work regardless of TS config issues

import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
const PORT = process.env.API_PORT || 3084; // Use different port to avoid conflicts

// CORS Configuration to allow cross-origin requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Debug API endpoint
app.get('/api/debug-api-health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// HR Course regenerate endpoint
app.post('/api/hr/courses/regenerate-content', (req, res) => {
  const courseId = req.body?.courseId;
  
  if (!courseId) {
    return res.status(400).json({ 
      error: 'Course ID is required',
      success: false
    });
  }
  
  res.json({
    success: true,
    message: 'Course content regeneration initiated',
    job_id: `job_${Date.now()}`,
    course: {
      id: courseId,
      status: 'regenerating'
    }
  });
});

// Simplified version endpoint with flat URL structure
app.post('/api/hr-course-regenerate', (req, res) => {
  const courseId = req.body?.courseId;
  
  if (!courseId) {
    return res.status(400).json({ 
      error: 'Course ID is required',
      success: false
    });
  }
  
  res.json({
    success: true,
    message: 'Course content regeneration initiated (simplified endpoint)',
    job_id: `job_${Date.now()}`,
    course: {
      id: courseId,
      status: 'regenerating'
    }
  });
});

// Fallback for all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server (CORS fixed) listening on port ${PORT}`);
  console.log(`Debug API available at http://localhost:${PORT}/api/debug-api-health`);
  console.log(`Course regenerate API available at http://localhost:${PORT}/api/hr/courses/regenerate-content`);
  console.log(`Simplified endpoint available at http://localhost:${PORT}/api/hr-course-regenerate`);
});
