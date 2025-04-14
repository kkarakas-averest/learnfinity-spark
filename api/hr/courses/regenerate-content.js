import { createClient } from '@supabase/supabase-js';
import CourseContentService from '../../../src/services/CourseContentService';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the request using Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    const { courseId, forceRegenerate, personalizationOptions } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
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
    
    // Force regeneration by clearing existing content (optional)
    if (forceRegenerate) {
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
        try {
          // Try to call the content generation service
          const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
          const response = await fetch(`${baseUrl}/api/hr/courses/generate-content`, {
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
      return res.status(500).json({ error: 'Failed to generate course content' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Course content regeneration started successfully',
      course: generatedCourse
    });
  } catch (error) {
    console.error('Error in course regeneration:', error);
    return res.status(500).json({ error: 'Failed to regenerate course content' });
  }
} 