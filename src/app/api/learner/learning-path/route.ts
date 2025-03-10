import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentService } from '@/agents/AgentService';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Schema for request validation
const LearningPathRequestSchema = z.object({
  userId: z.string().uuid()
});

/**
 * GET /api/learner/learning-path
 * Get a learner's personalized learning path
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Validate request
    const validationResult = LearningPathRequestSchema.safeParse({ userId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get learning path from database
    const { data: learningPathData, error: learningPathError } = await supabase
      .from('learning_paths')
      .select(`
        id,
        name,
        description,
        certification_name,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // If no learning path found or there was an error, return appropriate response
    if (learningPathError && learningPathError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching learning path:', learningPathError);
      return NextResponse.json(
        { error: 'Failed to fetch learning path' },
        { status: 500 }
      );
    }
    
    // If no learning path found, return empty result
    if (!learningPathData) {
      return NextResponse.json({ path: null });
    }
    
    // Get courses in the learning path
    const { data: coursesData, error: coursesError } = await supabase
      .from('learning_path_courses')
      .select(`
        id,
        course_id,
        match_score,
        rag_status,
        progress,
        sections,
        completed_sections,
        courses:course_id(
          id,
          title,
          description,
          estimated_duration,
          skills
        )
      `)
      .eq('learning_path_id', learningPathData.id)
      .order('position', { ascending: true });
    
    if (coursesError) {
      console.error('Error fetching learning path courses:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch learning path courses' },
        { status: 500 }
      );
    }
    
    // Transform courses data to match our client interface
    const transformedCourses = coursesData?.map(course => ({
      id: course.course_id,
      title: course.courses.title,
      description: course.courses.description,
      duration: course.courses.estimated_duration,
      matchScore: course.match_score,
      ragStatus: course.rag_status,
      progress: course.progress,
      sections: course.sections,
      completedSections: course.completed_sections,
      skills: course.courses.skills || []
    })) || [];
    
    // Build the learning path object
    const learningPath = {
      id: learningPathData.id,
      name: learningPathData.name,
      description: learningPathData.description,
      courses: transformedCourses,
      createdAt: learningPathData.created_at,
      updatedAt: learningPathData.updated_at,
      certificationName: learningPathData.certification_name
    };
    
    return NextResponse.json({ path: learningPath });
    
  } catch (error) {
    console.error('Error in learning path API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning path' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learner/learning-path
 * Generate a new personalized learning path for a learner
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { userId } = body;
    
    // Validate request
    const validationResult = LearningPathRequestSchema.safeParse({ userId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get learner profile
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching learner profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch learner profile' },
        { status: 500 }
      );
    }
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'Learner profile not found' },
        { status: 404 }
      );
    }
    
    // Initialize the agent service
    const agentService = AgentService.getInstance();
    await agentService.initialize();
    
    // Create task for agent to generate learning path
    const task = {
      type: 'personalize_learning',
      data: { 
        userId, 
        learnerProfile: profileData
      }
    };
    
    // Submit task to agent service
    const taskResult = await agentService.executeTask(task);
    
    if (taskResult.status === 'failed' || !taskResult.result) {
      throw new Error(taskResult.error || 'Failed to generate learning path');
    }
    
    // Get recommended courses from agent result
    const { recommendedCourses, pathName, pathDescription } = taskResult.result;
    
    if (!recommendedCourses || !Array.isArray(recommendedCourses) || recommendedCourses.length === 0) {
      throw new Error('No courses recommended by the agent');
    }
    
    // Create new learning path
    const { data: newPath, error: newPathError } = await supabase
      .from('learning_paths')
      .insert({
        id: uuidv4(),
        user_id: userId,
        name: pathName || 'Personalized Learning Path',
        description: pathDescription || 'AI-generated learning path based on your profile and preferences.',
        certification_name: taskResult.result.certificationName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (newPathError) {
      console.error('Error creating learning path:', newPathError);
      throw new Error('Failed to create learning path');
    }
    
    // Add courses to learning path
    const coursesToInsert = recommendedCourses.map((course: any, index: number) => ({
      id: uuidv4(),
      learning_path_id: newPath.id,
      course_id: course.id,
      position: index,
      match_score: course.matchScore || 85, // Default to 85% if not provided
      rag_status: 'green', // Start with green status
      progress: 0, // No progress yet
      sections: course.sections || 10, // Default to 10 sections if not provided
      completed_sections: 0, // No completed sections yet
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error: insertCoursesError } = await supabase
      .from('learning_path_courses')
      .insert(coursesToInsert);
    
    if (insertCoursesError) {
      console.error('Error inserting courses:', insertCoursesError);
      throw new Error('Failed to add courses to learning path');
    }
    
    // Log agent activity
    await supabase
      .from('agent_activities')
      .insert({
        id: uuidv4(),
        user_id: userId,
        agent_type: 'personalization',
        agent_name: 'Personalization Agent',
        activity_type: 'learning_path_creation',
        description: `Created personalized learning path "${pathName || 'Personalized Learning Path'}" with ${recommendedCourses.length} courses`,
        timestamp: new Date().toISOString(),
        metadata: { learning_path_id: newPath.id }
      });
    
    // Return newly created learning path
    return NextResponse.json({
      success: true,
      message: 'Learning path created successfully',
      pathId: newPath.id
    });
    
  } catch (error) {
    console.error('Error in create learning path API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create learning path',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 