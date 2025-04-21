
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { enhanceCourseContent } from '@/lib/groq';

/**
 * API endpoint for enhancing course content with personalized data
 * 
 * This endpoint takes course and employee data and generates personalized 
 * course content using the Groq API.
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
      courseTitle,
      courseDescription,
      employeeId,
      employeeName,
      position,
      department,
      profileData
    } = req.body;
    
    if (!courseId || !employeeId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        success: false
      });
    }
    
    console.log(`[enhance-content] Generating personalized content for course ${courseId}, employee ${employeeId}`);
    
    // Generate enhanced content using the Groq API
    const enhancedContent = await enhanceCourseContent(
      courseId,
      courseTitle || 'Untitled Course',
      courseDescription || '',
      employeeId,
      employeeName || 'Employee',
      position || 'Position',
      department || 'Department',
      profileData || {}
    );
    
    // Return the enhanced content
    return res.status(200).json({
      success: true,
      content: enhancedContent,
      message: 'Content enhanced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in enhance-content endpoint:', error);
    return res.status(500).json({
      error: 'Failed to enhance content',
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
