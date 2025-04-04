import { NextResponse, NextRequest } from 'next/server';
import CourseContentService from '@/services/CourseContentService';
import { getSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Get the Supabase instance
    const supabase = getSupabase();
    
    // Authenticate the request using Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const courseId = params.courseId;
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // Parse the request body for customization options
    const body = await request.json();
    const { personalizationOptions } = body || {};
    
    // Create or update learner profile with these options
    if (personalizationOptions) {
      // Update or create learner profile
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          user_id: userId,
          ...personalizationOptions
        });
      
      if (error) {
        console.error('Error updating learner profile:', error);
      }
    }
    
    // Get course content service
    const courseContentService = new CourseContentService();
    
    // Force regeneration by clearing existing content (optional)
    if (body?.forceRegenerate) {
      // Find and delete existing content
      const { data: existingContent } = await supabase
        .from('ai_generated_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_by', userId);
      
      if (existingContent && existingContent.length > 0) {
        const contentIds = existingContent.map(item => item.id);
        
        // Delete related data first
        await supabase
          .from('course_content_sections')
          .delete()
          .in('content_id', contentIds);
          
        await supabase
          .from('course_module_quizzes')
          .delete()
          .in('content_id', contentIds);
        
        // Then delete the main content
        await supabase
          .from('ai_generated_course_content')
          .delete()
          .in('id', contentIds);
      }
    }
    
    // Generate new course content
    const generatedCourse = await courseContentService.getCourseById(courseId, userId);
    
    if (!generatedCourse) {
      return NextResponse.json({ error: 'Failed to generate course content' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Course content regenerated successfully',
      course: generatedCourse
    });
  } catch (error) {
    console.error('Error in course regeneration:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate course content' }, 
      { status: 500 }
    );
  }
} 