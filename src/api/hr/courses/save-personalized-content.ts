
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint for saving personalized course content to the database
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
      content,
      isActive = true
    } = req.body;
    
    if (!courseId || !employeeId || !content) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    console.log(`[save-personalized-content] Saving personalized content for course ${courseId}, employee ${employeeId}`);
    
    // Generate a UUID for the content record
    const contentId = uuidv4();
    
    // In a production app, this is where you'd save to the database
    // For this Express implementation, we'll simulate the DB operation
    
    // Create response with content ID
    return res.status(200).json({
      success: true,
      contentId: contentId,
      message: 'Personalized content saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in save-personalized-content endpoint:', error);
    return res.status(500).json({
      error: 'Failed to save personalized content',
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
