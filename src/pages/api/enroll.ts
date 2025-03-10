import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { AgentService } from '@/agents/AgentService';

/**
 * Course enrollment API endpoint
 * 
 * Handles enrollment requests, records the enrollment,
 * and uses AI agents to create personalized learning paths
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { courseId, userId } = req.body;

  // Validate required fields
  if (!courseId || !userId) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      message: 'Both courseId and userId are required'
    });
  }

  try {
    // Check if the user is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // An error occurred (not a "no rows returned" error)
      throw checkError;
    }

    if (existingEnrollment) {
      return res.status(400).json({
        error: 'Already enrolled',
        message: 'User is already enrolled in this course'
      });
    }

    // Create enrollment record
    const enrollmentData = {
      id: uuidv4(),
      course_id: courseId,
      employee_id: userId,
      status: 'enrolled',
      progress: 0,
      score: null,
      enrollment_date: new Date().toISOString(),
      completion_date: null
    };

    const { error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .insert(enrollmentData);

    if (enrollmentError) {
      throw enrollmentError;
    }

    // Record activity in the employee_activities table
    const { error: activityError } = await supabase
      .from('hr_employee_activities')
      .insert({
        id: uuidv4(),
        employee_id: userId,
        activity_type: 'course_enrolled',
        description: `Enrolled in course: ${courseId}`,
        course_id: courseId,
        timestamp: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error recording activity:', activityError);
      // Continue even if activity recording fails
    }

    // Use AI agents to create personalized learning path
    try {
      const agentService = new AgentService();
      
      // Get course details
      const { data: courseData } = await supabase
        .from('hr_courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      // Get employee details
      const { data: employeeData } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Only proceed with AI personalization if we have both course and employee data
      if (courseData && employeeData) {
        // Use the EducatorAgent to create a personalized learning path
        const personalizationTask = {
          type: 'adapt_content',
          data: {
            employeeId: userId,
            contentId: courseId,
            learnerData: {
              name: employeeData.name,
              title: employeeData.title,
              department: employeeData.department,
              skills: employeeData.skills || [],
              learningPreferences: employeeData.learning_preferences || {},
              courseHistory: [] // Would typically fetch from learning_history
            }
          }
        };
        
        // Execute the task asynchronously (don't await)
        agentService.executeTask('educator', personalizationTask)
          .then(result => {
            console.log('AI personalization complete:', result);
          })
          .catch(error => {
            console.error('AI personalization error:', error);
          });
      }
    } catch (aiError) {
      console.error('Error during AI processing:', aiError);
      // Continue even if AI processing fails
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollmentId: enrollmentData.id
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return res.status(500).json({
      error: 'Enrollment failed',
      message: error.message || 'An error occurred during enrollment'
    });
  }
} 