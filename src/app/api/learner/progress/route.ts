import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AgentService } from '@/agents/AgentService';

// Schema for request validation
const ProgressUpdateSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  sectionId: z.string(),
  completed: z.boolean(),
  timestamp: z.string().datetime()
});

/**
 * POST /api/learner/progress
 * Update a learner's progress in a course
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request
    const validationResult = ProgressUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }
    
    const { userId, courseId, sectionId, completed, timestamp } = validationResult.data;
    
    // Find the learning path course
    const { data: learningPathCourseData, error: learningPathCourseError } = await supabase
      .from('learning_path_courses')
      .select(`
        id,
        learning_path_id,
        progress,
        sections,
        completed_sections,
        rag_status,
        learning_paths!inner(user_id)
      `)
      .eq('learning_paths.user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (learningPathCourseError) {
      console.error('Error fetching learning path course:', learningPathCourseError);
      return NextResponse.json(
        { error: 'Failed to find course in learning path' },
        { status: 500 }
      );
    }
    
    if (!learningPathCourseData) {
      return NextResponse.json(
        { error: 'Course not found in learning path' },
        { status: 404 }
      );
    }
    
    // Log the learning activity
    const { error: activityError } = await supabase
      .from('agent_activities')
      .insert({
        id: uuidv4(),
        user_id: userId,
        agent_type: 'progress_tracking',
        agent_name: 'Progress Tracking System',
        activity_type: 'section_completion',
        description: `${completed ? 'Completed' : 'Started'} section ${sectionId} in course ${courseId}`,
        timestamp,
        metadata: {
          courseId,
          sectionId,
          completed
        }
      });
    
    if (activityError) {
      console.error('Error logging activity:', activityError);
      // Continue anyway, as this is not critical
    }
    
    // If section is now completed, increment completed sections
    let newCompletedSections = learningPathCourseData.completed_sections;
    if (completed) {
      newCompletedSections += 1;
    }
    
    // Calculate new progress percentage
    const totalSections = learningPathCourseData.sections || 1; // Avoid division by zero
    const newProgress = Math.round((newCompletedSections / totalSections) * 100);
    
    // Check if RAG status needs to change
    let newRagStatus = learningPathCourseData.rag_status;
    let ragStatusChanged = false;
    
    // Initialize agent service for RAG status determination
    const agentService = AgentService.getInstance();
    await agentService.initialize();
    
    // Only call agent if progress is significantly different
    const progressDifference = Math.abs(newProgress - learningPathCourseData.progress);
    if (progressDifference >= 10) { // Only reassess if progress changed by 10% or more
      try {
        const task = {
          type: 'determine_rag_status',
          data: {
            userId,
            courseId,
            currentProgress: newProgress,
            previousProgress: learningPathCourseData.progress,
            completedSections: newCompletedSections,
            totalSections
          }
        };
        
        const taskResult = await agentService.executeTask(task);
        
        if (taskResult.status === 'completed' && taskResult.result?.ragStatus) {
          const suggestedRagStatus = taskResult.result.ragStatus;
          
          // Only update if different from current status
          if (suggestedRagStatus !== newRagStatus) {
            newRagStatus = suggestedRagStatus;
            ragStatusChanged = true;
          }
        }
      } catch (error) {
        console.error('Error determining RAG status:', error);
        // Continue with current RAG status if there's an error
      }
    }
    
    // Update the learning path course
    const { error: updateError } = await supabase
      .from('learning_path_courses')
      .update({
        progress: newProgress,
        completed_sections: newCompletedSections,
        rag_status: newRagStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', learningPathCourseData.id);
    
    if (updateError) {
      console.error('Error updating progress:', updateError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }
    
    // Return updated progress
    return NextResponse.json({
      success: true,
      progress: newProgress,
      completedSections: newCompletedSections,
      totalSections,
      ragStatus: newRagStatus,
      ragStatusChanged,
      previousRagStatus: ragStatusChanged ? learningPathCourseData.rag_status : null
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learner/progress
 * Get a learner's progress in all courses
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Validate userId
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get course progress for the user
    const { data: progressData, error: progressError } = await supabase
      .from('learning_path_courses')
      .select(`
        id,
        course_id,
        learning_path_id,
        progress,
        sections,
        completed_sections,
        rag_status,
        created_at,
        updated_at,
        courses:course_id(
          id,
          title,
          description
        ),
        learning_paths!inner(
          id,
          name,
          user_id
        )
      `)
      .eq('learning_paths.user_id', userId);
    
    if (progressError) {
      console.error('Error fetching progress data:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress data' },
        { status: 500 }
      );
    }
    
    // Transform data for client
    const courseProgress = progressData?.map(item => ({
      courseId: item.course_id,
      courseTitle: item.courses.title,
      courseDescription: item.courses.description,
      learningPathId: item.learning_path_id,
      learningPathName: item.learning_paths.name,
      progress: item.progress,
      sections: item.sections,
      completedSections: item.completed_sections,
      ragStatus: item.rag_status,
      lastUpdated: item.updated_at
    })) || [];
    
    return NextResponse.json({ courseProgress });
    
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
} 