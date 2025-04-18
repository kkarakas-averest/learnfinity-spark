
// This is a simple Express-compatible API handler for regenerating course content
// It will work with both Express and can be adapted for Next.js if needed

import { Request, Response } from 'express';

// Export a default handler function for Express compatibility
export default function handler(req: Request, res: Response) {
  try {
    // Always set proper CORS and content type headers first thing
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    
    // Detailed logging for debugging
    console.log(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Request received:`, {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      hasBody: !!req.body
    });
    
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      console.log(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Responding to OPTIONS request`);
      res.status(204).end();
      return;
    }
    
    // Extract course ID from query params or body
    const courseId = req.method === 'GET' 
      ? req.query.courseId 
      : (req.body?.courseId || null);
      
    console.log(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Course ID:`, courseId);
      
    if (!courseId) {
      console.log(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Missing courseId parameter`);
      res.status(400).json({
        error: 'Missing required parameter: courseId',
        success: false
      });
      return;
    }
    
    // Generate a unique job ID for tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Return a successful response with job ID for tracking
    console.log(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Returning success response with job ID: ${jobId}`);
    res.status(200).json({
      success: true,
      message: 'Course content regeneration request received',
      job_id: jobId,
      timestamp: new Date().toISOString(),
      course: {
        id: courseId,
        status: 'regenerating'
      }
    });
  } catch (error: any) {
    // Convert error to string first to avoid serialization issues
    const errorMessage = error?.message || 'Unknown error';
    const errorString = String(errorMessage);
    
    console.error(`[${new Date().toISOString()}] [HR-COURSE-REGENERATE] Error:`, errorString);
    
    // Always return valid JSON even in error cases
    res.status(500).json({
      error: 'Failed to process request',
      message: errorString,
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
