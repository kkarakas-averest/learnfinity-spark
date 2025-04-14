/**
 * Course assignment API endpoint for HR
 * Handles HR course assignment requests
 */
import { supabase } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import { NextApiRequest, NextApiResponse } from 'next';

// Express-compatible handler for course assignment
export default async function assignCourse(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  const { courseId, employeeId } = req.body;

  // Validate required fields
  if (!courseId || !employeeId) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields', 
      message: 'Both courseId and employeeId are required'
    });
  }

  try {
    // Check if the employee is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // An error occurred (not a "no rows returned" error)
      throw checkError;
    }

    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: 'Employee is already enrolled in this course',
        enrollmentId: existingEnrollment.id
      });
    }

    // Create enrollment record
    const enrollmentId = uuidv4();
    const enrollmentData = {
      id: enrollmentId,
      course_id: courseId,
      employee_id: employeeId,
      status: 'assigned',
      progress: 0,
      score: null,
      enrollment_date: new Date().toISOString(),
      completion_date: null
    };

    // Insert the enrollment with supabase client
    const { error: insertError } = await supabase
      .from('hr_course_enrollments')
      .insert([enrollmentData]);

    if (insertError) {
      console.error('Error inserting enrollment:', insertError);
      return res.status(500).json({ 
        success: false, 
        error: insertError.message,
        message: 'Failed to create enrollment'
      });
    }

    // Record activity in the employee_activities table
    const { error: activityError } = await supabase
      .from('hr_employee_activities')
      .insert({
        id: uuidv4(),
        employee_id: employeeId,
        activity_type: 'course_assigned',
        description: `Assigned to course: ${courseId}`,
        course_id: courseId,
        timestamp: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error recording activity:', activityError);
      // Continue even if activity recording fails
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully assigned course to employee',
      enrollmentId: enrollmentId
    });
  } catch (error) {
    console.error('Course assignment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: 'An error occurred during course assignment'
    });
  }
} 