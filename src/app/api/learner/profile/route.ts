import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for GET request
const getRequestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

// Define validation schema for POST request (update profile)
const updateProfileSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' }),
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  learningPreferences: z.object({
    preferredLearningStyle: z.enum(['visual', 'auditory', 'reading', 'kinesthetic']).optional(),
    preferredContentTypes: z.array(z.string()).optional(),
    learningGoals: z.array(z.string()).optional()
  }).optional()
});

/**
 * GET handler for fetching a learner's profile
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    // Validate request parameters
    const validatedData = getRequestSchema.safeParse({ userId });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { userId: validUserId } = validatedData.data;

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select(`
        id,
        user_id,
        name,
        email,
        bio,
        title,
        department,
        skills,
        learning_preferences,
        created_at,
        updated_at
      `)
      .eq('user_id', validUserId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    // If no profile exists, fetch basic user data
    if (!profileData) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('id', validUserId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return NextResponse.json(
          { error: 'User not found', details: userError.message },
          { status: 404 }
        );
      }

      // Return basic profile with default values
      return NextResponse.json({
        id: null,
        userId: userData.id,
        email: userData.email,
        name: null,
        bio: null,
        title: null,
        department: null,
        skills: [],
        learningPreferences: {
          preferredLearningStyle: null,
          preferredContentTypes: [],
          learningGoals: []
        },
        createdAt: userData.created_at,
        updatedAt: null,
        exists: false
      });
    }

    // Transform the profile data
    const transformedProfile = {
      id: profileData.id,
      userId: profileData.user_id,
      email: profileData.email,
      name: profileData.name,
      bio: profileData.bio,
      title: profileData.title,
      department: profileData.department,
      skills: profileData.skills || [],
      learningPreferences: {
        preferredLearningStyle: profileData.learning_preferences?.preferred_learning_style,
        preferredContentTypes: profileData.learning_preferences?.preferred_content_types || [],
        learningGoals: profileData.learning_preferences?.learning_goals || []
      },
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
      exists: true
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for updating a learner's profile
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    // Validate request body
    const validatedData = updateProfileSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { 
      userId, 
      name, 
      bio, 
      title, 
      department, 
      skills, 
      learningPreferences 
    } = validatedData.data;

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('learner_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError);
      return NextResponse.json(
        { error: 'Failed to check profile', details: checkError.message },
        { status: 500 }
      );
    }

    // Prepare profile data
    const profileData: any = {
      user_id: userId
    };

    // Add fields if provided
    if (name !== undefined) profileData.name = name;
    if (bio !== undefined) profileData.bio = bio;
    if (title !== undefined) profileData.title = title;
    if (department !== undefined) profileData.department = department;
    if (skills !== undefined) profileData.skills = skills;

    // Format learning preferences if provided
    if (learningPreferences) {
      profileData.learning_preferences = {
        preferred_learning_style: learningPreferences.preferredLearningStyle,
        preferred_content_types: learningPreferences.preferredContentTypes,
        learning_goals: learningPreferences.learningGoals
      };
    }

    let result;

    // Update or insert profile
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('learner_profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('learner_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json(
          { error: 'Failed to create profile', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    // Transform the profile data
    const transformedProfile = {
      id: result.id,
      userId: result.user_id,
      email: result.email,
      name: result.name,
      bio: result.bio,
      title: result.title,
      department: result.department,
      skills: result.skills || [],
      learningPreferences: {
        preferredLearningStyle: result.learning_preferences?.preferred_learning_style,
        preferredContentTypes: result.learning_preferences?.preferred_content_types || [],
        learningGoals: result.learning_preferences?.learning_goals || []
      },
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      exists: true
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 