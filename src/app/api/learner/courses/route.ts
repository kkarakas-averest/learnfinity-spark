import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

/**
 * GET /api/learner/courses
 * Gets the courses enrolled by a specific learner
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
    
    // Fetch course enrollments for the user
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        status,
        progress,
        last_accessed,
        completion_date,
        enrolled_date,
        courses:course_id(
          id, 
          title, 
          description, 
          thumbnail_url, 
          category, 
          level, 
          duration_minutes,
          content_type
        )
      `)
      .eq('user_id', userId);
      
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch course enrollments', details: enrollmentsError.message },
        { status: 500 }
      );
    }
    
    // Fetch assigned courses (not yet enrolled)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        assigned_date,
        due_date,
        status,
        courses:course_id(
          id, 
          title, 
          description, 
          thumbnail_url, 
          category, 
          level, 
          duration_minutes,
          content_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      // Continue anyway, we'll just return enrolled courses
    }
    
    // Process enrolled courses
    const enrolledCourses = enrollments.map(enrollment => {
      if (!enrollment.courses) return null;
      
      const course = Array.isArray(enrollment.courses) ? 
        enrollment.courses[0] : enrollment.courses;
        
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        category: course.category,
        level: course.level,
        duration_minutes: course.duration_minutes,
        content_type: course.content_type,
        progress: enrollment.progress || 0,
        last_accessed: enrollment.last_accessed,
        completion_status: enrollment.status,
        enrolled_date: enrollment.enrolled_date,
        course_type: 'enrolled'
      };
    }).filter(Boolean);
    
    // Process assigned courses
    const assignedCourses = assignments ? assignments.map(assignment => {
      if (!assignment.courses) return null;
      
      const course = Array.isArray(assignment.courses) ? 
        assignment.courses[0] : assignment.courses;
        
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        category: course.category,
        level: course.level,
        duration_minutes: course.duration_minutes,
        content_type: course.content_type,
        progress: 0,
        assigned_date: assignment.assigned_date,
        due_date: assignment.due_date,
        completion_status: 'not_started',
        course_type: 'assigned'
      };
    }).filter(Boolean) : [];
    
    // Combine all courses
    const allCourses = [...enrolledCourses, ...assignedCourses];
    
    return NextResponse.json({
      courses: allCourses,
      stats: {
        total: allCourses.length,
        enrolled: enrolledCourses.length,
        assigned: assignedCourses.length,
        completed: enrolledCourses.filter(c => c.completion_status === 'completed').length,
        in_progress: enrolledCourses.filter(c => c.progress > 0 && c.completion_status !== 'completed').length
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in learner courses API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 