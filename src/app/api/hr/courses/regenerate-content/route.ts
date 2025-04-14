import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmployeeDataForPersonalization } from '@/lib/api/hr/employee-data';
import { AgentFactory } from '@/agents/AgentFactory';

/**
 * API endpoint to regenerate personalized course content
 * POST /api/hr/courses/regenerate-content
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get request body
    const body = await req.json();
    const { 
      courseId, 
      forceRegenerate = true,
      personalizationOptions = {} 
    } = body;
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
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
    
    let targetEmployeeId = userId;
    
    // If user is linked to an employee, get that ID
    const { data: mappingData } = await supabase
      .from('employee_user_mapping')
      .select('employee_id')
      .eq('user_id', userId)
      .single();
        
    if (mappingData?.employee_id) {
      targetEmployeeId = mappingData.employee_id;
    }
    
    // Get the HR course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      return NextResponse.json(
        { error: 'Course not found', details: courseError?.message }, 
        { status: 404 }
      );
    }
    
    // Force regeneration by clearing existing content (if requested)
    if (forceRegenerate) {
      // First, check for personalized content in hr_personalized_course_content
      const { data: personalizedContent } = await supabase
        .from('hr_personalized_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', targetEmployeeId);
      
      if (personalizedContent && personalizedContent.length > 0) {
        console.log('Found personalized content to regenerate:', personalizedContent);
        
        // Delete existing personalized content
        for (const content of personalizedContent) {
          await supabase
            .from('hr_personalized_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
      
      // Also check for classic AI-generated content
      const { data: existingContent } = await supabase
        .from('ai_generated_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_by', userId);
      
      if (existingContent && existingContent.length > 0) {
        // Delete related data first
        for (const content of existingContent) {
          await supabase
            .from('course_content_sections')
            .delete()
            .eq('content_id', content.id);
            
          await supabase
            .from('course_module_quizzes')
            .delete()
            .eq('content_id', content.id);
        }
        
        // Then delete the main content
        for (const content of existingContent) {
          await supabase
            .from('ai_generated_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
    }
    
    // Get course enrollment data
    const { data: enrollmentData } = await supabase
      .from('hr_course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .single();
    
    // Get employee data for personalization
    const employeeData = await getEmployeeDataForPersonalization(userId);
    
    // Now, trigger the content generation process
    const apiUrl = new URL(req.url);
    const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
    
    try {
      // Call the content generation endpoint
      const response = await fetch(`${baseUrl}/api/hr/courses/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass along the auth header
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          courseId,
          employeeId: targetEmployeeId,
          personalizationOptions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { 
            error: 'Error calling content generation service', 
            details: errorData.error || response.statusText 
          }, 
          { status: 500 }
        );
      }
      
      // Return success response with the course data
      return NextResponse.json({
        success: true,
        message: 'Course content regeneration started successfully',
        course: courseData
      });
    } catch (regenerateError: any) {
      console.error('Error calling regeneration service:', regenerateError);
      return NextResponse.json(
        { error: 'Failed to regenerate course content', details: regenerateError.message }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in course regeneration:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate course content', details: error.message }, 
      { status: 500 }
    );
  }
} 