// Adapter for the Next.js App Router API route to work with Vercel's current configuration

import { generateCourseWithGroq } from '../../src/lib/groq.js';
import { getSupabase } from '../../src/lib/supabase.js';
import { z } from 'zod';

// Define validation schema for request
const requestSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  targetAudience: z.string().min(3, "Target audience must be at least 3 characters"),
  modules: z.number().min(1).max(5).optional(),
  sectionsPerModule: z.number().min(1).max(5).optional(),
  includeQuiz: z.boolean().optional(),
  userId: z.string(), // Accept any string ID
  customization: z.object({
    skillLevel: z.string().optional(),
    learningStyle: z.string().optional(),
    industry: z.string().optional(),
  }).optional()
});

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Parse request body - handle both string and object formats
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    
    console.log('Request body received:', body);
    
    // Validate the request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
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
    
    // Check GROQ API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured in process.env');
      
      // Print all available environment variables (excluding sensitive values)
      const safeEnvVars = Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('key') && !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('token'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {});
      
      console.log('Available environment variables:', safeEnvVars);
      
      return res.status(500).json({ 
        error: 'GROQ API is not configured on the server',
        details: 'The GROQ_API_KEY environment variable is missing'
      });
    }
    
    console.log('GROQ_API_KEY found with prefix:', process.env.GROQ_API_KEY.substring(0, 5) + '...');
    
    // Generate course content using GroqAPI
    let courseData;
    try {
      console.log('Calling GroqAPI with params:', { topic, targetAudience, modules, sectionsPerModule, includeQuiz });
      courseData = await generateCourseWithGroq(
        topic, 
        targetAudience,
        modules,
        sectionsPerModule,
        includeQuiz
      );
      
      if (!courseData || !courseData.modules || !Array.isArray(courseData.modules)) {
        console.error('Invalid response from GroqAPI:', courseData);
        return res.status(500).json({ 
          error: 'Invalid response from AI service',
          details: 'Response does not contain required course structure'
        });
      }
      
      console.log('GroqAPI response received successfully with:', { 
        title: courseData.title, 
        moduleCount: courseData.modules.length,
        sectionCount: courseData.modules.reduce((sum, m) => sum + m.sections.length, 0)
      });
    } catch (groqError) {
      console.error('Error calling GroqAPI:', groqError);
      return res.status(500).json({ 
        error: 'Failed to generate course content with AI',
        details: groqError.message || 'Unknown error calling AI service'
      });
    }
    
    // Create a unique course ID
    const courseId = `custom-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    
    // Store the course in the database
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }
      
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
        return res.status(500).json({ error: 'Failed to create course record' });
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
        return res.status(500).json({ error: 'Failed to save AI-generated content' });
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
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Course generated and saved successfully',
        courseId,
        title: courseData.title,
        description: courseData.description,
        modules: courseData.modules.length,
        sections: courseData.modules.reduce((total, module) => total + module.sections.length, 0),
        quizzes: courseData.quizzes?.length || 0
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: 'Failed to save course to database',
        details: dbError.message || 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('General error in API route:', error);
    
    return res.status(500).json({
      error: 'Failed to generate course content',
      details: error.message || 'An unexpected error occurred'
    });
  }
} 