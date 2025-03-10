import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' }),
  status: z.enum(['all', 'in_progress', 'completed', 'not_started']).optional().default('all'),
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0)
});

/**
 * GET handler for fetching a learner's courses
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status') as 'all' | 'in_progress' | 'completed' | 'not_started' || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate request parameters
    const validatedData = requestSchema.safeParse({
      userId,
      status,
      limit,
      offset
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { userId: validUserId, status: validStatus, limit: validLimit, offset: validOffset } = validatedData.data;

    // Build the query to fetch courses for the learner
    let query = supabase
      .from('learning_path_courses')
      .select(`
        id,
        course_id,
        learning_path_id,
        progress,
        rag_status,
        completed_sections,
        sections,
        courses (
          id,
          title,
          description,
          estimated_duration,
          skills,
          thumbnail_url,
          featured,
          category
        ),
        learning_paths (
          id,
          name
        )
      `)
      .eq('learning_paths.user_id', validUserId);

    // Apply status filter if specified
    if (validStatus !== 'all') {
      switch (validStatus) {
        case 'in_progress':
          query = query.gt('progress', 0).lt('progress', 100);
          break;
        case 'completed':
          query = query.eq('progress', 100);
          break;
        case 'not_started':
          query = query.eq('progress', 0);
          break;
      }
    }

    // Apply pagination
    query = query.range(validOffset, validOffset + validLimit - 1);

    // Execute the query
    const { data: coursesData, error } = await query;

    if (error) {
      console.error('Error fetching learner courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data for the frontend
    const formattedCourses = coursesData.map(item => ({
      id: item.course_id,
      title: item.courses.title,
      description: item.courses.description,
      duration: item.courses.estimated_duration,
      progress: item.progress,
      completedSections: item.completed_sections,
      totalSections: item.sections,
      thumbnailUrl: item.courses.thumbnail_url,
      featured: item.courses.featured,
      category: item.courses.category,
      skills: item.courses.skills,
      ragStatus: item.rag_status,
      learningPathId: item.learning_path_id,
      learningPathName: item.learning_paths.name
    }));

    // Get count of courses by status for summary stats
    const { data: countData, error: countError } = await supabase
      .from('learning_path_courses')
      .select(`
        progress,
        id
      `, { count: 'exact' })
      .eq('learning_paths.user_id', validUserId);

    if (countError) {
      console.error('Error fetching course counts:', countError);
    }

    // Calculate counts
    const counts = {
      total: countData?.length || 0,
      inProgress: countData?.filter(c => c.progress > 0 && c.progress < 100).length || 0,
      completed: countData?.filter(c => c.progress === 100).length || 0,
      notStarted: countData?.filter(c => c.progress === 0).length || 0
    };

    // Find a featured course if available
    const featuredCourse = formattedCourses.find(course => course.featured) || 
                          (formattedCourses.length > 0 ? formattedCourses[0] : null);

    return NextResponse.json({
      courses: formattedCourses,
      counts,
      featuredCourse
    });
  } catch (error) {
    console.error('Unexpected error in courses API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 