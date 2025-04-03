import { NextRequest, NextResponse } from 'next/server';
import { aiAgentService } from '@/services/ai-agent.service';
import { getSupabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for content generation request
const contentGenerationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetAudience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  learningObjectives: z.array(z.string()).optional(),
  includeQuizzes: z.boolean().optional(),
  includeAssignments: z.boolean().optional(),
  includeResources: z.boolean().optional(),
  moduleCount: z.number().int().min(1).max(10).optional(),
});

/**
 * API route handler for generating personalized content for an employee
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get employee ID from route params
    const employeeId = params.id;
    
    // Validate employeeId
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const supabase = getSupabase();
    const { data: employee, error } = await supabase
      .from('hr_employees')
      .select('id, name')
      .eq('id', employeeId)
      .single();
      
    if (error || !employee) {
      return NextResponse.json(
        { error: `Employee with ID ${employeeId} not found` },
        { status: 404 }
      );
    }
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate the request
    const validationResult = contentGenerationSchema.safeParse(requestData);
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
      targetAudience,
      duration,
      learningObjectives,
      includeQuizzes,
      includeAssignments,
      includeResources,
      moduleCount
    } = validationResult.data;
    
    // Generate personalized content for the employee
    const result = await aiAgentService.generateEmployeePersonalizedContent(
      employeeId,
      title,
      description,
      {
        targetAudience,
        duration,
        learningObjectives,
        includeQuizzes,
        includeAssignments,
        includeResources,
        moduleCount
      }
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate content' },
        { status: 500 }
      );
    }
    
    // Return the generated course
    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      course: result.course,
      taskId: result.taskId,
      employee: {
        id: employee.id,
        name: employee.name
      }
    });
  } catch (error: any) {
    console.error('Error generating employee content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * API route handler for checking the status of a content generation task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get employee ID from route params
    const employeeId = params.id;
    
    // Get task ID from URL search params
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      // If no task ID provided, get latest tasks for this employee
      const tasks = await aiAgentService.getUserTasks(employeeId);
      const contentGenerationTasks = tasks.filter(
        task => task.agent_type === 'content_creation' && 
               task.task_type === 'generate_employee_course'
      );
      
      return NextResponse.json({
        success: true,
        tasks: contentGenerationTasks
      });
    }
    
    // If task ID provided, get specific task
    const task = await aiAgentService.getTaskById(taskId);
    
    if (!task) {
      return NextResponse.json(
        { error: `Task with ID ${taskId} not found` },
        { status: 404 }
      );
    }
    
    // Return task details
    return NextResponse.json({
      success: true,
      task
    });
  } catch (error: any) {
    console.error('Error getting task status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get task status' },
      { status: 500 }
    );
  }
} 