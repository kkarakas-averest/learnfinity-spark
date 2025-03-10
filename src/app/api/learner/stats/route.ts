import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Schema for request validation
const StatsRequestSchema = z.object({
  userId: z.string().uuid()
});

/**
 * GET /api/learner/stats
 * Get learner dashboard statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Validate request
    const validationResult = StatsRequestSchema.safeParse({ userId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get learner stats from database
    
    // 1. Get courses in progress
    const { data: coursesData, error: coursesError } = await supabase
      .from('learning_path_courses')
      .select(`
        id,
        course_id,
        progress,
        learning_paths!inner(user_id)
      `)
      .eq('learning_paths.user_id', userId)
      .lt('progress', 100) // Not completed
      .gt('progress', 0);  // Started
    
    if (coursesError) {
      console.error('Error fetching courses in progress:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch learner stats' },
        { status: 500 }
      );
    }
    
    // 2. Get completed courses for achievement count
    const { data: completedCoursesData, error: completedCoursesError } = await supabase
      .from('learning_path_courses')
      .select(`
        id,
        course_id,
        progress,
        learning_paths!inner(user_id),
        created_at
      `)
      .eq('learning_paths.user_id', userId)
      .eq('progress', 100); // Fully completed
    
    if (completedCoursesError) {
      console.error('Error fetching completed courses:', completedCoursesError);
      return NextResponse.json(
        { error: 'Failed to fetch learner stats' },
        { status: 500 }
      );
    }
    
    // 3. Get learning streak (simplified version)
    const { data: activityData, error: activityError } = await supabase
      .from('agent_activities')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(30); // Get last 30 activities
    
    if (activityError) {
      console.error('Error fetching activity data:', activityError);
      return NextResponse.json(
        { error: 'Failed to fetch learner stats' },
        { status: 500 }
      );
    }
    
    // Calculate hours remaining (estimating 2 hours per course at average remaining progress)
    const coursesInProgress = coursesData?.length || 0;
    const hoursRemaining = coursesData?.reduce((total, course) => {
      const remainingProgress = 100 - (course.progress || 0);
      // Assume 2 hours per course at 100% progress
      return total + (remainingProgress / 100 * 2);
    }, 0) || 0;
    
    // Calculate overall completion
    const totalCourses = (coursesData?.length || 0) + (completedCoursesData?.length || 0);
    const overallCompletion = totalCourses > 0 
      ? Math.round((completedCoursesData?.length || 0) / totalCourses * 100)
      : 0;
    
    // Calculate new achievements (completed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newAchievements = completedCoursesData?.filter(course => {
      const completedDate = new Date(course.created_at);
      return completedDate >= thirtyDaysAgo;
    }).length || 0;
    
    // Calculate learning streak
    const streak = calculateStreak(activityData);
    
    // Return stats
    return NextResponse.json({
      coursesInProgress,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10, // Round to 1 decimal
      overallCompletion,
      completionChange: 5, // For now, hardcode +5% (this would be calculated from historical data)
      achievements: completedCoursesData?.length || 0,
      newAchievements,
      learningStreak: streak
    });
    
  } catch (error) {
    console.error('Error in learner stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learner stats' },
      { status: 500 }
    );
  }
}

/**
 * Calculate learning streak based on activity data
 * (Simplified version - a proper implementation would track consecutive days)
 */
function calculateStreak(activityData: any[] = []): number {
  if (!activityData.length) return 0;
  
  // Group activities by day
  const activityDays = new Set();
  
  activityData.forEach(activity => {
    const date = new Date(activity.timestamp).toISOString().split('T')[0];
    activityDays.add(date);
  });
  
  // Get current date and recent dates
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Check if there's activity today or yesterday (to give some flexibility)
  const hasRecentActivity = activityDays.has(today) || activityDays.has(yesterday);
  if (!hasRecentActivity) return 0;
  
  // Count consecutive days backwards
  let streak = 0;
  let currentDate = hasRecentActivity ? today : yesterday;
  
  while (true) {
    // Check if we have activity for the current date
    const currentDateStr = new Date(currentDate).toISOString().split('T')[0];
    if (activityDays.has(currentDateStr)) {
      streak++;
      // Move to previous day
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      currentDate = prevDate.toISOString();
    } else {
      break;
    }
    
    // Safety check - limit to 30 days max
    if (streak >= 30) break;
  }
  
  return streak;
} 