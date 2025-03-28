
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

/**
 * GET /api/learner/hr-profile
 * This API endpoint provides HR profile data for the learner dashboard.
 * It fetches the employee data from the HR system and any courses assigned to them.
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Validate request
    const validationResult = requestSchema.safeParse({ userId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get employee data from HR system
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id,
        name,
        email,
        phone,
        status,
        profile_image_url,
        hire_date,
        rag_status,
        skills,
        department:hr_departments(id, name),
        position:hr_positions(id, title),
        manager:hr_employees(id, name, email),
        user_id
      `)
      .eq('user_id', userId)
      .single();
      
    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('Error fetching HR employee data:', employeeError);
      return NextResponse.json(
        { error: 'Failed to fetch employee data', details: employeeError.message },
        { status: 500 }
      );
    }
    
    // Get assigned courses from HR system
    const { data: assignedCoursesData, error: coursesError } = await supabase
      .from('hr_course_enrollments')
      .select(`
        id,
        status,
        progress,
        enrollment_date,
        completion_date,
        score,
        course:hr_courses(
          id,
          title,
          description,
          duration,
          skill_level,
          status,
          difficulty_level
        )
      `)
      .eq('employee_id', employeeData?.id || '')
      .order('enrollment_date', { ascending: false });
      
    if (coursesError) {
      console.error('Error fetching assigned courses:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch assigned courses', details: coursesError.message },
        { status: 500 }
      );
    }
    
    // Format course data
    const assignedCourses = assignedCoursesData?.map(enrollment => {
      const courseData = enrollment.course as any;
      return {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        level: courseData.skill_level || courseData.difficulty_level,
        duration_minutes: courseData.duration || 60,
        progress: enrollment.progress || 0,
        status: enrollment.status,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date,
        score: enrollment.score,
        course_type: 'hr_assigned'
      };
    }) || [];
    
    return NextResponse.json({
      success: true,
      hrProfile: employeeData || null,
      assignedCourses
    });
    
  } catch (error) {
    console.error('Unexpected error in HR profile API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
