
// Simple Express API server with CORS setup to handle API requests
// This file doesn't rely on TypeScript and will work regardless of TS config issues

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

// Generic handler for all course regeneration endpoints
const handleCourseRegeneration = (req, res) => {
  try {
    console.log('[Express Server] Handling course regeneration request');
    
    // Always set proper CORS and content type headers 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract courseId from query params or body
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
};

// HR Course regenerate endpoint with simplified endpoint
app.all('/api/hr-course-regenerate', handleCourseRegeneration);

// Standard endpoint
app.all('/api/hr/courses/regenerate-content', handleCourseRegeneration);

// Alternative endpoint
app.all('/api/courses/regenerate', handleCourseRegeneration);

// Legacy endpoint with improved handling
app.all('/api/hr/courses/regenerate-content', handleCourseRegeneration);

// Universal enhance endpoint for course content personalization
app.all('/api/hr/courses/enhance-content', (req, res) => {
  try {
    console.log('[Express Server] Handling enhance content request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract parameters
    const body = req.body || {};
    const { courseId, employeeId } = body;
    
    if (!courseId || !employeeId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    // Generate mock enhanced content for development
    const mockEnhancedContent = {
      enhancedDescription: `This course has been personalized for the employee's specific needs and role.`,
      learningObjectives: [
        "Understand key concepts relevant to your role",
        "Apply techniques specific to your department's needs",
        "Develop skills identified in your CV as areas for growth"
      ],
      modules: [
        {
          title: "Personalized Introduction Module",
          description: "Custom introduction based on your experience level",
          sections: [
            {
              title: "Welcome to Your Personalized Course",
              content: "<div class='prose max-w-none'>This content has been tailored to your specific profile and needs.</div>"
            },
            {
              title: "Your Learning Path",
              content: "<div class='prose max-w-none'>Based on your CV, we've identified key areas to focus on.</div>"
            }
          ]
        },
        {
          title: "Core Concepts for Your Role",
          description: "Essential knowledge customized for your position",
          sections: [
            {
              title: "Role-Specific Techniques",
              content: "<div class='prose max-w-none'>This section covers techniques particularly relevant to your current position.</div>"
            }
          ]
        }
      ],
      quizzes: [
        {
          moduleIndex: 0,
          questions: [
            {
              question: "Which approach best fits your current role?",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 2
            }
          ]
        }
      ]
    };
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Course content enhanced successfully',
      content: mockEnhancedContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to enhance course content',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Save personalized content endpoint
app.post('/api/hr/courses/save-personalized-content', (req, res) => {
  try {
    console.log('[Express Server] Handling save personalized content request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract parameters
    const { courseId, employeeId, content } = req.body;
    
    if (!courseId || !employeeId || !content) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    // Generate a unique content ID
    const contentId = uuidv4();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Personalized content saved successfully',
      contentId: contentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to save personalized content',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Update enrollment endpoint
app.post('/api/hr/course-enrollments/update-content', (req, res) => {
  try {
    console.log('[Express Server] Handling update enrollment content request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract parameters
    const { courseId, employeeId, contentId } = req.body;
    
    if (!courseId || !employeeId || !contentId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    // Generate a job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      jobId: jobId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to update enrollment',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Course enrollment endpoint
app.get('/api/hr/courses/:courseId/enrollment', (req, res) => {
  try {
    console.log('[Express Server] Handling get course enrollment request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract course ID from URL params
    const courseId = req.params.courseId;
    
    if (!courseId) {
      return res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
    }
    
    // Return mock enrollment data
    return res.status(200).json({
      courseId: courseId,
      employeeId: "test-employee-id",
      enrollmentDate: new Date().toISOString(),
      status: "enrolled",
      progress: 0
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to get enrollment',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Employee data endpoint
app.get('/api/hr/employees/:employeeId', (req, res) => {
  try {
    console.log('[Express Server] Handling get employee request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract employee ID from URL params
    const employeeId = req.params.employeeId;
    
    if (!employeeId) {
      return res.status(400).json({
        error: 'Missing required parameter: employeeId',
        success: false
      });
    }
    
    // Return mock employee data with CV extracted data
    return res.status(200).json({
      id: employeeId,
      name: "John Doe",
      email: "john.doe@example.com",
      position: {
        id: "pos-123",
        title: "Senior Developer"
      },
      department: {
        id: "dept-456",
        name: "Engineering"
      },
      cv_extraction_date: new Date().toISOString(),
      cv_file_url: "https://example.com/cv.pdf",
      cv_extracted_data: {
        summary: "Experienced software developer with 10+ years in full-stack development. Specializes in React, TypeScript, and Node.js.",
        skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "REST API", "GraphQL"],
        experience: [
          {
            title: "Senior Developer",
            company: "Tech Solutions Inc.",
            years: "2018-Present"
          },
          {
            title: "Frontend Developer",
            company: "Web Innovators",
            years: "2015-2018"
          }
        ],
        education: [
          {
            degree: "BSc Computer Science",
            institution: "University of Technology"
          }
        ],
        certifications: ["AWS Certified Developer", "React Professional"],
        personalInsights: {
          yearsOfExperience: 10,
          toolsAndTechnologies: ["VS Code", "GitHub", "Docker", "AWS"],
          preferredLearningStyle: "Visual"
        }
      }
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to get employee',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Course data endpoint
app.get('/api/hr/courses/:courseId', (req, res) => {
  try {
    console.log('[Express Server] Handling get course request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract course ID from URL params
    const courseId = req.params.courseId;
    
    if (!courseId) {
      return res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
    }
    
    // Return mock course data
    return res.status(200).json({
      id: courseId,
      title: "Advanced Web Development",
      description: "Learn advanced techniques for building modern web applications with React, TypeScript, and Node.js.",
      skill_level: "intermediate",
      duration: 120,  // minutes
      department_id: "dept-456",
      skills: ["JavaScript", "React", "TypeScript"],
      status: "active",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),  // 30 days ago
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to get course',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
});

// Personalize content process endpoint
app.all('/api/hr/courses/personalize-content/process', (req, res) => {
  try {
    console.log('[Express Server] Handling personalize content process request');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    // Extract job_id parameter
    const jobId = req.method === 'GET' ? req.query.job_id : req.body?.job_id;
    
    if (!jobId) {
      return res.status(400).json({
        error: 'Missing required parameter: job_id',
        success: false
      });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Content processing completed successfully',
      job_id: jobId,
      status: 'completed',
      progress: 100
    });
  } catch (error) {
    console.error('[Express Server] Error:', error);
    return res.status(500).json({
      error: 'Failed to process content generation job',
      message: error?.message || 'Unknown error',
      success: false
    });
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
