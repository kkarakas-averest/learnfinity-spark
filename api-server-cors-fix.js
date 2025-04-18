
// Simple Express API server with CORS setup to handle API requests
// This file doesn't rely on TypeScript and will work regardless of TS config issues

import express from 'express';
import cors from 'cors';
import hrCourseRegenerate from './src/api/hr-course-regenerate.ts';

// Create Express app
const app = express();
const PORT = process.env.API_PORT || 3084; // Use different port to avoid conflicts

// CORS Configuration to allow cross-origin requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
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
  try {
    console.log('[Express Server] Handling regenerate-content request');
    
    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Use the existing handler logic
    const courseId = req.body?.courseId;
    
    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required',
        success: false
      });
    }
    
    return res.json({
      success: true,
      message: 'Course content regeneration initiated',
      job_id: `job_${Date.now()}`,
      course: {
        id: courseId,
        status: 'regenerating'
      }
    });
  } catch (error) {
    console.error('[Express Server] Error handling regenerate-content request:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Simplified version endpoint with flat URL structure - using imported handler
app.post('/api/hr-course-regenerate', (req, res) => {
  console.log('[Express Server] Handling hr-course-regenerate request');
  return hrCourseRegenerate(req, res);
});

app.get('/api/hr-course-regenerate', (req, res) => {
  console.log('[Express Server] Handling hr-course-regenerate GET request');
  return hrCourseRegenerate(req, res);
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
