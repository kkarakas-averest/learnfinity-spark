import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

/**
 * GET /api/learner/profile
 * Gets the profile information for a specific learner
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
    
    // Get user data from auth.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: userError.message },
        { status: 500 }
      );
    }
    
    // Fetch learner profile
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    // Handle case where profile doesn't exist
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching learner profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch learner profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    // If no profile exists, check employee data
    if (!profileData) {
      // First check HR employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          id, 
          name, 
          email, 
          department_id, 
          position_id,
          department:hr_departments(name),
          position:hr_positions(title),
          skills
        `)
        .eq('user_id', userId)
        .single();
      
      // If employee data exists, return HR-derived profile
      if (!employeeError && employeeData) {
        return NextResponse.json({
          id: null,
          userId: userId,
          email: employeeData.email || userData?.email || '',
          name: employeeData.name || userData?.email?.split('@')[0] || 'Learner',
          bio: null,
          title: employeeData.position ? 
            (Array.isArray(employeeData.position) && employeeData.position[0]?.title) || null : null,
          department: employeeData.department ? 
            (Array.isArray(employeeData.department) && employeeData.department[0]?.name) || null : null,
          skills: Array.isArray(employeeData.skills) ? employeeData.skills : [],
          learningPreferences: {
            preferredLearningStyle: null,
            preferredContentTypes: [],
            learningGoals: []
          },
          createdAt: null,
          updatedAt: null,
          onboardingCompleted: false,
          exists: false,
          isHrProfile: true
        });
      }
      
      // No profile or employee data exists, return minimal profile
      return NextResponse.json({
        id: null,
        userId: userId,
        email: userData?.email || '',
        name: userData?.name || userData?.email?.split('@')[0] || 'Learner',
        bio: null,
        title: null,
        department: null,
        skills: [],
        learningPreferences: {
          preferredLearningStyle: null,
          preferredContentTypes: [],
          learningGoals: []
        },
        createdAt: null,
        updatedAt: null,
        onboardingCompleted: false,
        exists: false,
        isHrProfile: false
      });
    }
    
    // Profile exists, return it
    return NextResponse.json({
      id: profileData.id,
      userId: profileData.user_id,
      email: userData?.email || '',
      name: profileData.name || userData?.email?.split('@')[0] || 'Learner',
      bio: profileData.bio || null,
      title: profileData.title || null,
      department: profileData.department || null,
      skills: profileData.skills || [],
      learningPreferences: {
        preferredLearningStyle: profileData.learning_preferences?.preferred_learning_style || null,
        preferredContentTypes: profileData.learning_preferences?.preferred_content_types || [],
        learningGoals: profileData.learning_preferences?.learning_goals || []
      },
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
      onboardingCompleted: profileData.onboarding_completed || false,
      exists: true,
      isHrProfile: false
    });
    
  } catch (error) {
    console.error('Unexpected error in learner profile API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learner/profile
 * Creates or updates a learner profile
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const profileSchema = z.object({
      userId: z.string().uuid(),
      name: z.string().optional(),
      bio: z.string().optional().nullable(),
      title: z.string().optional().nullable(),
      department: z.string().optional().nullable(),
      skills: z.array(z.string()).optional(),
      learningPreferences: z.object({
        preferredLearningStyle: z.string().optional().nullable(),
        preferredContentTypes: z.array(z.string()).optional(),
        learningGoals: z.array(z.string()).optional()
      }).optional(),
      onboardingCompleted: z.boolean().optional()
    });
    
    const validationResult = profileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: validationResult.error },
        { status: 400 }
      );
    }
    
    const { userId, ...profileData } = validationResult.data;
    
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('learner_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Error checking profile existence', details: checkError.message },
        { status: 500 }
      );
    }
    
    let result;
    
    // Format data for Supabase
    const supabaseData: {
      user_id: string;
      name?: string;
      bio?: string | null;
      title?: string | null;
      department?: string | null;
      skills?: string[];
      learning_preferences?: any;
      onboarding_completed?: boolean;
      updated_at: string;
      created_at?: string;
    } = {
      user_id: userId,
      name: profileData.name,
      bio: profileData.bio,
      title: profileData.title,
      department: profileData.department,
      skills: profileData.skills,
      learning_preferences: profileData.learningPreferences,
      onboarding_completed: profileData.onboardingCompleted,
      updated_at: new Date().toISOString()
    };
    
    // Update or insert based on existence
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('learner_profiles')
        .update(supabaseData)
        .eq('id', existingProfile.id)
        .select();
    } else {
      // Create new profile
      supabaseData.created_at = new Date().toISOString();
      result = await supabase
        .from('learner_profiles')
        .insert(supabaseData)
        .select();
    }
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to save profile', details: result.error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      profile: result.data[0]
    });
    
  } catch (error) {
    console.error('Unexpected error saving profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 