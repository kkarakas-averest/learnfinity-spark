import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { 
  getHybridProfile, 
  getHybridCourses, 
  getHybridLearningPaths, 
  getHybridStats 
} from './hybrid-data';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

/**
 * GET /api/learner/dashboard
 * This API endpoint provides data needed for the learner dashboard.
 * It uses a hybrid approach that:
 * 1. Gets real data from the database when available
 * 2. Adds mock data only for required fields that don't exist
 * This ensures a consistent user experience while showing real user data.
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Validate request
    const validationResult = requestSchema.safeParse({ userId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Get hybrid profile data (real + mock for missing fields)
    const profile = await getHybridProfile(supabase, userId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
    
    // Get hybrid courses data (real + mock for missing fields)
    const courses = await getHybridCourses(supabase, userId);
    
    // Get hybrid learning paths data (real + empty array if none)
    const learningPaths = await getHybridLearningPaths(supabase, userId);
    
    // Get hybrid stats based on real data with fallbacks
    const stats = await getHybridStats(
      supabase, 
      userId, 
      { 
        completed: courses.completed, 
        total: courses.total 
      }, 
      learningPaths
    );
    
    // Return combined data
    return NextResponse.json({
      user: {
        id: userId,
        email: profile.email,
        name: profile.name,
        role: 'learner'
      },
      profile,
      courses: {
        total: courses.total,
        featured: courses.featured,
        inProgress: courses.inProgress,
        completed: courses.completed,
        notStarted: courses.notStarted,
        hrAssigned: courses.hrAssigned,
        items: courses.items
      },
      learningPaths,
      stats
    });
    
  } catch (error) {
    console.error('Unexpected error in learner dashboard API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 