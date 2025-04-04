import { NextResponse, NextRequest } from 'next/server';
import { generateCourseWithGroq } from '@/lib/groq';
import { getSupabase } from '@/lib/supabase';
import { z } from 'zod';

// Define validation schema for request
const requestSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  targetAudience: z.string().min(3, "Target audience must be at least 3 characters"),
  modules: z.number().min(1).max(5).optional(),
  sectionsPerModule: z.number().min(1).max(5).optional(),
  includeQuiz: z.boolean().optional(),
  userId: z.string().uuid("Invalid user ID format"),
  customization: z.object({
    skillLevel: z.string().optional(),
    learningStyle: z.string().optional(),
    industry: z.string().optional(),
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      topic, 
      targetAudience, 
      modules = 3, 
      sectionsPerModule = 3, 
      includeQuiz = true,
      userId,
      customization = {}
    } = validationResult.data;
    
    console.log(`Generating course on "${topic}" for ${targetAudience} audience...`);
    
    // Generate course content using GroqAPI
    const courseData = await generateCourseWithGroq(
      topic, 
      targetAudience,
      modules,
      sectionsPerModule,
      includeQuiz
    );
    
    // Create a unique course ID
    const courseId = `custom-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    
    // Store the course in the database
    const supabase = getSupabase();
    
    // 1. First, create the course record
    const { data: courseRecord, error: courseError } = await supabase
      .from('courses')
      .insert({
        id: courseId,
        title: courseData.title,
        description: courseData.description,
        level: customization.skillLevel || 'intermediate',
        estimated_duration: modules * sectionsPerModule * 20, // Estimate 20 minutes per section
        is_published: true,
        cover_image: `/images/courses/custom-${Math.floor(Math.random() * 5) + 1}.jpg`,
        created_by: userId
      })
      .select('id')
      .single();
    
    if (courseError) {
      console.error('Error creating course:', courseError);
      return NextResponse.json(
        { error: 'Failed to create course record' },
        { status: 500 }
      );
    }
    
    // 2. Create enrollment for the user
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        user_id: userId,
        enrolled_date: new Date().toISOString(),
        progress: 0,
        rag_status: 'green'
      });
    
    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      // Continue anyway since the course was created
    }
    
    // 3. Save the AI-generated content
    const { data: aiContentRecord, error: aiContentError } = await supabase
      .from('ai_generated_course_content')
      .insert({
        course_id: courseId,
        title: courseData.title,
        content: courseData, // Store the entire course data
        created_by: userId,
        personalization_params: {
          topic,
          targetAudience,
          ...customization
        },
        is_published: true
      })
      .select('id')
      .single();
    
    if (aiContentError) {
      console.error('Error saving AI content:', aiContentError);
      return NextResponse.json(
        { error: 'Failed to save AI-generated content' },
        { status: 500 }
      );
    }
    
    // 4. Create modules and sections
    const aiContentId = aiContentRecord.id;
    
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      
      // Create module record
      const { data: moduleRecord, error: moduleError } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: module.title,
          description: module.description,
          order_index: i,
          duration: module.sections.length * 20 // Estimate 20 minutes per section
        })
        .select('id')
        .single();
      
      if (moduleError) {
        console.error(`Error creating module ${i}:`, moduleError);
        continue; // Skip this module but continue with others
      }
      
      // Create section records
      for (let j = 0; j < module.sections.length; j++) {
        const section = module.sections[j];
        
        // Create section record
        const { error: sectionError } = await supabase
          .from('module_sections')
          .insert({
            module_id: moduleRecord.id,
            title: section.title,
            content: section.content,
            content_type: 'text',
            order_index: j,
            duration: 20 // Default 20 minutes per section
          });
        
        if (sectionError) {
          console.error(`Error creating section ${j} for module ${i}:`, sectionError);
          // Continue with other sections
        }
      }
      
      // Save section in AI content sections table
      for (let j = 0; j < module.sections.length; j++) {
        const section = module.sections[j];
        
        const { error: aiSectionError } = await supabase
          .from('course_content_sections')
          .insert({
            content_id: aiContentId,
            title: section.title,
            module_id: `module-${i + 1}`,
            section_id: `section-${j + 1}`,
            content: section.content,
            order_index: j
          });
        
        if (aiSectionError) {
          console.error(`Error saving AI section ${j} for module ${i}:`, aiSectionError);
          // Continue with other sections
        }
      }
    }
    
    // 5. Save quizzes if present
    if (courseData.quizzes && Array.isArray(courseData.quizzes)) {
      for (let i = 0; i < courseData.quizzes.length; i++) {
        const quiz = courseData.quizzes[i];
        
        const { error: quizError } = await supabase
          .from('course_module_quizzes')
          .insert({
            content_id: aiContentId,
            module_id: `module-${quiz.moduleIndex + 1}`,
            quiz_data: quiz
          });
        
        if (quizError) {
          console.error(`Error saving quiz for module ${quiz.moduleIndex}:`, quizError);
          // Continue with other quizzes
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Course generated and saved successfully',
      courseId,
      title: courseData.title,
      description: courseData.description,
      modules: courseData.modules.length,
      sections: courseData.modules.reduce((total: number, module: any) => total + module.sections.length, 0),
      quizzes: courseData.quizzes?.length || 0
    });
  } catch (error: any) {
    console.error('Error generating course with GroqAPI:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate course content' },
      { status: 500 }
    );
  }
} 