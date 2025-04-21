
// Simple Express API server with CORS setup to handle API requests
// This file doesn't rely on TypeScript and will work regardless of TS config issues

const express = require('express');
const cors = require('cors');
const path = require('path');

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
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString()
  });
});

// HR Course regenerate endpoint with improved handling
app.all('/api/hr/courses/regenerate-content', (req, res) => {
  try {
    console.log('[Express Server] Handling regenerate-content request');
    
    // Always set proper CORS and content type headers 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Use the existing handler logic
    const courseId = req.method === 'GET' ? req.query.courseId : req.body?.courseId;
    
    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required',
        success: false
      });
    }
    
    // Generate a unique job ID for tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return res.status(200).json({
      success: true,
      message: 'Course content regeneration initiated',
      job_id: jobId,
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

// Simplified endpoint with direct handler
app.all('/api/hr-course-regenerate', (req, res) => {
  try {
    console.log('[Express Server] Handling hr-course-regenerate request');
    
    // Always set proper content type and CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract course ID from query params or body
    const courseId = req.method === 'GET' ? req.query.courseId : req.body?.courseId;
      
    if (!courseId) {
      console.log(`[API Server] Missing courseId parameter`);
      return res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
    }
    
    // Generate a unique job ID for tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Return a successful response with job ID for tracking
    console.log(`[API Server] Returning success response with job ID: ${jobId}`);
    return res.status(200).json({
      success: true,
      message: 'Course content regeneration request received',
      job_id: jobId,
      timestamp: new Date().toISOString(),
      course: {
        id: courseId,
        status: 'regenerating'
      }
    });
  } catch (error) {
    console.error(`[API Server] Error:`, error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Add more handler routes from Next.js API routes
// Employee content generation endpoint
app.all('/api/employee/content/generate', (req, res) => {
  try {
    const { employeeId, courseRequest } = req.method === 'GET' ? req.query : req.body;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Generate a unique job ID for tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return res.status(200).json({
      success: true,
      jobId,
      message: 'Content generation initiated'
    });
  } catch (error) {
    console.error('Error generating employee content:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
});

// Agent status endpoint
app.get('/api/agents/status', (req, res) => {
  try {
    // Simulate agent status data
    const agentStatus = {
      agents: [
        {
          id: "manager-agent",
          name: "Manager Agent",
          role: "System Orchestrator",
          status: "healthy",
          tasksProcessed: 127,
          lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          uptime: "3 days 4 hours",
          cpuUsage: "12%",
          memoryUsage: "156MB"
        },
        {
          id: "educator-agent",
          name: "Educator Agent",
          role: "Content Generator",
          status: "busy",
          currentTask: "Content Generation",
          tasksProcessed: 95,
          lastActivity: new Date(), // Just now
          uptime: "3 days 4 hours",
          cpuUsage: "48%",
          memoryUsage: "412MB"
        }
      ],
      systemStatus: {
        status: "running",
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        totalTasksProcessed: 285,
        totalAgents: 2,
        activeAgents: 2
      }
    };
    
    return res.json(agentStatus);
  } catch (error) {
    console.error("Error retrieving agent status:", error);
    return res.status(500).json({ error: "Failed to retrieve agent status" });
  }
});

// Course generation endpoint
app.all('/api/agents/course', (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    if (req.method === 'POST') {
      const body = req.body;
      
      // Generate a mock course response
      const courseId = `course_${body?.title?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}_${Date.now().toString().slice(-6)}`;
      
      return res.json({
        id: courseId,
        title: body?.title || 'Untitled Course',
        description: body?.description || 'Course description',
        modules: Array.from({ length: body?.moduleCount || 3 }, (_, i) => ({
          id: `module_${i + 1}`,
          title: `Module ${i + 1}`
        }))
      });
    }
    
    if (req.method === 'GET') {
      const courseId = req.query.id;
      
      if (!courseId) {
        return res.status(400).json({ error: "Course ID is required" });
      }
      
      return res.json({
        id: courseId,
        title: 'Retrieved Course',
        description: 'This course was retrieved from the database'
      });
    }
    
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error handling course request:", error);
    return res.status(500).json({ error: "Failed to process course request" });
  }
});

// Fallback for all other routes
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
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
