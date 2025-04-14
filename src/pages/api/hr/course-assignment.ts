/**
 * Course assignment API endpoint for HR
 * 
 * Handles HR course assignment requests and bypasses RLS using server-side calls
 */
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

type AssignCourseRequest = {
  courseId: string;
  employeeId: string;
};

type AssignCourseResponse = {
  success: boolean;
  error?: string;
  message: string;
  enrollmentId?: string;
};

// Express-compatible handler for course assignment
export default async function assignCourse(req: { body: AssignCourseRequest }, res: {
  status: (code: number) => { json: (data: AssignCourseResponse) => void };
}) {
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

    // Since we're operating server-side, use service key if needed - for this code to work,
    // ensure your environment has SUPABASE_SERVICE_KEY set
    const apiKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Make a direct API call to bypass RLS
    const response = await fetch(`${apiUrl}/rest/v1/hr_course_enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey as string,
        'Authorization': `Bearer ${apiKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(enrollmentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create enrollment: ${errorText}`);
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
    return res.status(500).json({
      success: false,
      error: 'Assignment failed',
      message: error instanceof Error ? error.message : 'An error occurred during course assignment'
    });
  }
} 