import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Schema for request validation
const ActivityRequestSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().optional().default(10)
});

/**
 * GET /api/learner/agent-activity
 * Get recent AI agent activities for a learner
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    
    // Parse and validate limit
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    // Validate request
    const validationResult = ActivityRequestSchema.safeParse({ userId, limit });
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }
    
    const { userId: validUserId, limit: validLimit } = validationResult.data;
    
    // Get recent agent activities
    const { data: activities, error: activitiesError } = await supabase
      .from('agent_activities')
      .select('*')
      .eq('user_id', validUserId)
      .order('timestamp', { ascending: false })
      .limit(validLimit);
    
    if (activitiesError) {
      console.error('Error fetching agent activities:', activitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch agent activities' },
        { status: 500 }
      );
    }
    
    // Format activities for client
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      agentType: activity.agent_type,
      agentName: activity.agent_name,
      activityType: activity.activity_type,
      description: activity.description,
      timestamp: activity.timestamp,
      metadata: activity.metadata || {}
    })) || [];
    
    return NextResponse.json({ activities: formattedActivities });
    
  } catch (error) {
    console.error('Error in agent activity API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent activities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learner/agent-activity
 * Create a new agent activity entry (usually from client-side interactions)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { userId, agentType, agentName, activityType, description, metadata } = body;
    
    // Validate required fields
    if (!userId || !agentType || !agentName || !activityType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new activity
    const { data: newActivity, error: createError } = await supabase
      .from('agent_activities')
      .insert({
        user_id: userId,
        agent_type: agentType,
        agent_name: agentName,
        activity_type: activityType,
        description,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating agent activity:', createError);
      return NextResponse.json(
        { error: 'Failed to create agent activity' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      activity: {
        id: newActivity.id,
        agentType: newActivity.agent_type,
        agentName: newActivity.agent_name,
        activityType: newActivity.activity_type,
        description: newActivity.description,
        timestamp: newActivity.timestamp,
        metadata: newActivity.metadata || {}
      }
    });
    
  } catch (error) {
    console.error('Error creating agent activity:', error);
    return NextResponse.json(
      { error: 'Failed to create agent activity' },
      { status: 500 }
    );
  }
} 