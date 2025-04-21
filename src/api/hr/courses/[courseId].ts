
import { Request, Response } from 'express';

/**
 * API endpoint to get course information
 * Gets course details for a specific course ID
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS and content type headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  try {
    // Extract courseId from URL params or query params
    const courseId = req.params.courseId || req.query.courseId;
    
    if (!courseId) {
      return res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
    }
    
    console.log(`[course] Getting course data for ${courseId}`);
    
    // In a production app, this is where you'd query the database
    // For this Express implementation, we'll return mock data
    
    // Create mock course data
    const mockCourse = {
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
    };
    
    // Return the course data
    return res.status(200).json(mockCourse);
  } catch (error: any) {
    console.error('Error in course endpoint:', error);
    return res.status(500).json({
      error: 'Failed to get course data',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
