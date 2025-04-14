import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Course assignment API endpoint for HR
 * Handles HR course assignment requests
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { courseId, employeeId } = body;

    // Validate required fields
    if (!courseId || !employeeId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields', 
          message: 'Both courseId and employeeId are required'
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json({
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

    // Insert the enrollment with service role client
    const { error: insertError } = await supabase
      .from('hr_course_enrollments')
      .insert([enrollmentData]);

    if (insertError) {
      console.error('Error inserting enrollment:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: insertError.message,
          message: 'Failed to create enrollment'
        },
        { status: 500 }
      );
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
    return NextResponse.json({
      success: true,
      message: 'Successfully assigned course to employee',
      enrollmentId: enrollmentId
    });
  } catch (error) {
    console.error('Course assignment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        message: 'An error occurred during course assignment'
      },
      { status: 500 }
    );
  }
} 