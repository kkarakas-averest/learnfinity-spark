import { NextRequest, NextResponse } from 'next/server';
import { AgentService, CourseGenerationRequest } from '@/services/agent-service';
import { getSupabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for content generation test request
const testContentGenerationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetAudience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  learningObjectives: z.array(z.string()).optional(),
  includeQuizzes: z.boolean().optional(),
  includeAssignments: z.boolean().optional(),
  includeResources: z.boolean().optional(),
  moduleCount: z.number().int().min(1).max(10).optional(),
  personalizationData: z.object({
    learningStyle: z.string().optional(),
    interests: z.array(z.string()).optional(),
    priorKnowledge: z.object({}).passthrough().optional(),
    difficultyPreference: z.enum(["easy", "medium", "hard", "adaptive"]).optional()
  }).optional()
});

/**
 * Test API route for generating content directly with the agent service
 * Allows direct testing of the agent system without requiring an employee record
 * This is useful for development/debugging and agent testing
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Test agent route called');
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate the request
    const validationResult = testContentGenerationSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }
    
    // Extract data from validated request
    const { 
      title, 
      description = "", 
      targetAudience = "intermediate",
      duration = "medium",
      learningObjectives = [],
      includeQuizzes = true,
      includeAssignments = true,
      includeResources = true,
      moduleCount = 5,
      personalizationData
    } = validationResult.data;
    
    // Create a course generation request
    const courseRequest: CourseGenerationRequest = {
      title,
      description,
      targetAudience,
      duration,
      learningObjectives: learningObjectives.length > 0 ? learningObjectives : [
        `Understand the fundamentals of ${title}`,
        `Apply ${title} concepts in practical scenarios`,
        `Evaluate the effectiveness of ${title} approaches`
      ],
      includeQuizzes,
      includeAssignments,
      includeResources,
      moduleCount,
      generationMode: 'complete',
      personalization: {
        adaptToLearningStyle: true,
        difficultyLevel: personalizationData?.difficultyPreference || 'adaptive',
        paceAdjustment: 'moderate',
        interestAreas: personalizationData?.interests || [],
        priorKnowledge: personalizationData?.priorKnowledge || {}
      }
    };
    
    // Initialize agent service and generate content directly
    const agentService = AgentService.getInstance();
    await agentService.initialize();
    
    console.log('Generating course with agent service...');
    const startTime = Date.now();
    
    const generatedCourse = await agentService.generateCourse(courseRequest);
    
    const endTime = Date.now();
    const duration_ms = endTime - startTime;
    
    console.log(`Course generated in ${duration_ms}ms`);
    
    // Record this test in the database if available
    try {
      const supabase = getSupabase();
      await supabase
        .from('agent_test_logs')
        .insert({
          request_type: 'course_generation',
          request_data: courseRequest,
          response_data: {
            course_id: generatedCourse.id,
            title: generatedCourse.title,
            module_count: generatedCourse.modules.length,
            generation_time_ms: duration_ms
          },
          duration_ms
        });
    } catch (dbError) {
      console.warn('Could not log test to database:', dbError);
      // Non-critical error, continue
    }
    
    // Return the generated course
    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      course: generatedCourse,
      stats: {
        generation_time_ms: duration_ms,
        modules_count: generatedCourse.modules.length,
        quizzes_count: generatedCourse.quizzes?.length || 0,
        assignments_count: generatedCourse.assignments?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error in test agent route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
} 