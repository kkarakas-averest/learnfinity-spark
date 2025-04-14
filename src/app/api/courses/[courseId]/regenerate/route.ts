import { NextResponse, NextRequest } from 'next/server';
import CourseContentService from '@/services/CourseContentService';
import { getSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Force regeneration by clearing existing content (optional)
    if (body?.forceRegenerate) {
      // First, check for personalized content (ai_course_content)
      const { data: personalizedContent } = await supabase
        .from('ai_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId);
      
      if (personalizedContent && personalizedContent.length > 0) {
        console.log('Found personalized content to regenerate:', personalizedContent);
        
        // Mark existing content sections for regeneration
        const contentIds = personalizedContent.map(item => item.id);
        
        for (const contentId of contentIds) {
          // Update content sections instead of deleting them
          const { error } = await supabase
            .from('ai_course_content_sections')
            .update({
              content: '<div class="prose max-w-none"><p>Content will be regenerated.</p></div>',
              updated_at: new Date().toISOString()
            })
            .eq('content_id', contentId);
          
          if (error) {
            console.error('Error updating content sections:', error);
          }
          
          // Update the main content record with regeneration status
          await supabase
            .from('ai_course_content')
            .update({
              is_regenerating: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', contentId);
        }
        
        // Trigger async content regeneration here
        // This could be a server action, scheduled task, or call to an AI service
        try {
          // Simulated call to regeneration service
          const response = await fetch(`${request.nextUrl.origin}/api/hr/courses/generate-content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              courseId,
              employeeId: userId,
              regenerateExisting: true
            })
          });
          
          if (!response.ok) {
            console.warn('Regeneration service returned non-OK status:', response.status);
          }
        } catch (regenerateError) {
          console.error('Error calling regeneration service:', regenerateError);
          // Continue - we've already marked content for regeneration
        }
      }
      
      // Also check for classic AI-generated content
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
    const courseContentService = new CourseContentService();
    const generatedCourse = await courseContentService.getCourseById(courseId, userId);
    
    if (!generatedCourse) {
      return NextResponse.json({ error: 'Failed to generate course content' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Course content regeneration started successfully',
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