
import { Request, Response } from 'express';

/**
 * API endpoint to get course enrollment information
 * Gets enrollment details for a specific course ID
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
    
    console.log(`[enrollment] Getting enrollment for course ${courseId}`);
    
    // In a production app, this is where you'd query the database
    // For this Express implementation, we'll return mock data
    
    // Create mock enrollment data
    const mockEnrollment = {
      id: `enroll-${Date.now()}`,
      courseId: courseId,
      employeeId: `emp-${Math.random().toString(36).substring(2, 9)}`,
      enrollmentDate: new Date().toISOString(),
      status: "enrolled",
      progress: 0,
      personalized_content_id: null
    };
    
    // Return the enrollment data
    return res.status(200).json(mockEnrollment);
  } catch (error: any) {
    console.error('Error in enrollment endpoint:', error);
    return res.status(500).json({
      error: 'Failed to get enrollment',
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
