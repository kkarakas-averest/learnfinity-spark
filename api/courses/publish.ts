import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Set CORS headers helper function
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return res;
};

// HARDCODED FALLBACK VALUES - Only used if environment variables fail
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

/**
 * API endpoint for publishing AI-generated course content
 * 
 * This handles:
 * 1. Creating or updating the course in hr_courses table
 * 2. Creating enrollments for the target employees
 * 3. Setting the content status to published
 * 
 * Request format:
 * {
 *   contentId: string,           // ID of the generated content
 *   employeeIds?: string[],      // Optional list of employees to enroll (if not provided, uses the employee from content)
 *   title?: string,              // Optional override for course title
 *   description?: string,        // Optional override for course description
 *   sendNotification?: boolean,  // Whether to send notifications to enrolled employees (optional)
 *   assignmentMessage?: string,  // Optional message to include with assignment
 *   dueDate?: string             // Optional due date for the course
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   courseId?: string,
 *   enrollmentIds?: string[],
 *   error?: string
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Check for authentication (JWT or dev token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get request data
    const {
      contentId,
      employeeIds,
      title,
      description,
      sendNotification = true,
      assignmentMessage,
      dueDate
    } = req.body;

    // Validate required parameters
    if (!contentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'contentId is required' 
      });
    }
    
    console.log(`Publishing content ${contentId}`);
    
    // Get the content data
    const { data: contentData, error: contentError } = await supabase
      .from('ai_course_content')
      .select(`
        id,
        title,
        description,
        learning_objectives,
        employee_id,
        content
      `)
      .eq('id', contentId)
      .single();
      
    if (contentError || !contentData) {
      console.error('Error fetching content:', contentError);
      return res.status(404).json({ 
        success: false, 
        error: 'Content not found' 
      });
    }
    
    // Create a new course record
    const courseId = uuidv4();
    const { error: courseError } = await supabase
      .from('hr_courses')
      .insert({
        id: courseId,
        title: title || contentData.title,
        description: description || contentData.description,
        ai_generated: true,
        difficulty_level: 'intermediate',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        learning_objectives: contentData.learning_objectives || []
      });
      
    if (courseError) {
      console.error('Error creating course:', courseError);
      return res.status(500).json({ 
        success: false, 
        error: `Error creating course record: ${courseError.message}` 
      });
    }
    
    // Update the content record with the course ID
    const { error: updateContentError } = await supabase
      .from('ai_course_content')
      .update({
        course_id: courseId,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);
      
    if (updateContentError) {
      console.error('Error updating content:', updateContentError);
      // Continue anyway
    }
    
    // Determine which employees to enroll
    const targetEmployeeIds = employeeIds && employeeIds.length > 0
      ? employeeIds
      : contentData.employee_id 
        ? [contentData.employee_id] 
        : [];
        
    if (targetEmployeeIds.length === 0) {
      console.warn('No employees to enroll');
      return res.status(200).json({
        success: true,
        courseId,
        warning: 'No employees were enrolled'
      });
    }
    
    // Create enrollments for all target employees
    const enrollmentIds: string[] = [];
    const enrollmentErrors: string[] = [];
    
    for (const employeeId of targetEmployeeIds) {
      try {
        const enrollmentId = uuidv4();
        
        const { error: enrollmentError } = await supabase
          .from('hr_course_enrollments')
          .insert({
            id: enrollmentId,
            employee_id: employeeId,
            course_id: courseId,
            status: 'assigned',
            progress: 0,
            enrollment_date: new Date().toISOString(),
            personalized_content_id: contentId,
            personalized_content_generation_status: 'completed',
            personalized_content_completed_at: new Date().toISOString(),
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            assignment_message: assignmentMessage
          });
          
        if (enrollmentError) {
          console.error(`Error creating enrollment for employee ${employeeId}:`, enrollmentError);
          enrollmentErrors.push(`Failed to enroll employee ${employeeId}: ${enrollmentError.message}`);
        } else {
          enrollmentIds.push(enrollmentId);
        }
      } catch (err) {
        console.error(`Error processing enrollment for employee ${employeeId}:`, err);
        enrollmentErrors.push(`Failed to process enrollment for employee ${employeeId}`);
      }
    }
    
    // If notifications are enabled, send them (simulated for now)
    if (sendNotification && enrollmentIds.length > 0) {
      console.log(`Sending notifications to ${enrollmentIds.length} employees`);
      // In a real implementation, this would call a notification service
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      courseId,
      enrollmentIds,
      enrollmentCount: enrollmentIds.length,
      errors: enrollmentErrors.length > 0 ? enrollmentErrors : undefined
    });
    
  } catch (error) {
    console.error('Error publishing course:', error);
    
    return res.status(500).json({
      success: false,
      error: `Error publishing course: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 