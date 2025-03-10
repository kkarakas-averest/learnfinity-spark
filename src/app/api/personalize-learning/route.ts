import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentService } from '@/agents/AgentService';
import { z } from 'zod';

// Schema for request validation
const PersonalizationRequestSchema = z.object({
  userId: z.string().uuid()
});

/**
 * POST /api/personalize-learning
 * Triggers the personalization process for a learner based on their profile preferences
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validationResult = PersonalizationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }
    
    const { userId } = validationResult.data;
    
    // Get learner profile from database
    const { data: profile, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error('Error fetching learner profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch learner profile' },
        { status: 404 }
      );
    }
    
    // Get employee data if available
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Get user data for additional context
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }
    
    // Initialize the agent service
    const agentService = AgentService.getInstance();
    await agentService.initialize();
    
    // Get the manager agent
    const manager = agentService.getManagerAgent();
    
    if (!manager) {
      throw new Error('Agent system not initialized properly');
    }
    
    console.log(`Processing personalization for user: ${userId}`);
    
    // Prepare the data for the personalization agent
    const personalizationData = {
      userId,
      learnerProfile: {
        ...profile,
        employee: employee || null,
        userData: user || null
      }
    };
    
    // Create and execute the personalization task
    const task = {
      type: 'personalize_learning',
      data: personalizationData,
      priority: 'high'
    };
    
    // Submit the task to the agent system
    const taskResult = await agentService.executeTask(task);
    
    // Create a response with the personalization result
    return NextResponse.json({
      success: true,
      message: 'Personalization process initiated',
      taskId: taskResult.id,
      status: taskResult.status
    });
    
  } catch (error) {
    console.error('Error in personalization process:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process personalization',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 