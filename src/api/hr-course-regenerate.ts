
// This is a simple Express-compatible API handler for regenerating course content
// It will work with both Express and can be adapted for Next.js if needed

import { Request, Response } from 'express';

// Export a default handler function for Express compatibility
export default function handler(req: Request, res: Response) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    // Extract course ID from query params or body
    const courseId = req.method === 'GET' 
      ? req.query.courseId 
      : (req.body?.courseId || null);
      
    if (!courseId) {
      res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
      return;
    }
    
    // Return a successful response with job ID for tracking
    res.status(200).json({
      success: true,
      message: 'Course content regeneration request received',
      job_id: `job_${Date.now()}`, // This would normally be a real job ID
      timestamp: new Date().toISOString(),
      course: {
        id: courseId,
        status: 'regenerating'
      }
    });
  } catch (error: any) {
    console.error('Error in hr-course-regenerate endpoint:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: error?.message || 'Unknown error',
      success: false
    });
  }
}

// For compatibility with Next.js API routes
export const config = {
  api: {
    bodyParser: true,
  },
};
