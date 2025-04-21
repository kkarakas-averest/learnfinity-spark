
import { Request, Response } from 'express';

/**
 * API endpoint for updating course enrollment record with new content
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
    // Validate request body
    const {
      courseId,
      employeeId,
      contentId
    } = req.body;
    
    if (!courseId || !employeeId || !contentId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    console.log(`[update-content] Updating enrollment for course ${courseId}, employee ${employeeId}, content ${contentId}`);
    
    // In a production app, this is where you'd update the database
    // For this Express implementation, we'll simulate the DB operation
    
    // Generate a job ID for tracking
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create response with job ID
    return res.status(200).json({
      success: true,
      jobId: jobId,
      message: 'Enrollment record updated successfully',
      timestamp: new Date().toISOString(),
      courseId,
      employeeId,
      contentId
    });
  } catch (error: any) {
    console.error('Error in update-content endpoint:', error);
    return res.status(500).json({
      error: 'Failed to update enrollment',
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
