import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' })
});

/**
 * GET /api/learner/dashboard
 * This API endpoint provides data needed for the learner dashboard.
 * It combines data from multiple sources:
 * 1. Learner profile (either from learner_profiles or HR system)
 * 2. Course enrollments
 * 3. Course progress statistics
 * 4. Learning paths if applicable
 * 5. Basic stats about learning progress
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
    
    // Get user email from auth.users table
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

    // 1. Get learner profile data
    let profile = null;
    let isHrProfile = false;
    
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching learner profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch learner profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    // If no learner profile exists, check for employee data from HR
    if (!profileData) {
      // Fetch employee data from HR if available
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
      
      if (!employeeError && employeeData) {
        isHrProfile = true;
        // Create a profile from employee data
        profile = {
          id: `hr-${employeeData.id}`,
          userId,
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
          onboardingCompleted: false
        };
      } else {
        // Create minimal profile from auth data
        profile = {
          id: null,
          userId,
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
          onboardingCompleted: false,
          exists: false
        };
      }
    } else {
      // Process existing profile data
      profile = {
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
        onboardingCompleted: profileData.onboarding_completed || false,
        exists: true
      };
    }
    
    // 2. Get course enrollments
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        course:courses (
          id,
          title,
          description,
          estimated_duration,
          thumbnail_url,
          module_count
        ),
        progress,
        rag_status,
        completed_modules,
        due_date,
        last_accessed,
        created_at
      `)
      .eq('user_id', userId);
      
    if (enrollmentsError) {
      console.error('Error fetching course enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch course enrollments', details: enrollmentsError.message },
        { status: 500 }
      );
    }
    
    // Process courses data
    const courses = enrollmentsData?.map(enrollment => {
      const courseData = enrollment.course as any;
      return {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        progress: enrollment.progress || 0,
        thumbnailUrl: courseData.thumbnail_url,
        ragStatus: (enrollment.rag_status || 'green').toLowerCase(),
        dueDate: enrollment.due_date,
        estimatedDuration: courseData.estimated_duration,
        lastAccessed: enrollment.last_accessed,
        moduleCount: courseData.module_count || 0,
        completedModules: enrollment.completed_modules || 0
      };
    }) || [];
    
    // 3. Get learning paths
    const { data: pathsData, error: pathsError } = await supabase
      .from('learning_path_enrollments')
      .select(`
        id,
        learning_path:learning_paths (
          id,
          title,
          description,
          course_count
        ),
        progress,
        rag_status,
        completed_courses,
        created_at
      `)
      .eq('user_id', userId);
      
    const learningPaths = !pathsError ? (pathsData || []).map((enrollment: any) => {
      const pathData = enrollment.learning_path as any;
      return {
        id: pathData.id,
        title: pathData.title,
        description: pathData.description,
        progress: enrollment.progress || 0,
        ragStatus: (enrollment.rag_status || 'green').toLowerCase(),
        courseCount: pathData.course_count || 0,
        completedCourses: enrollment.completed_courses || 0
      };
    }) : [];
    
    // 4. Calculate course stats
    const courseStats = {
      total: courses.length,
      inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
      completed: courses.filter(c => c.progress === 100).length,
      notStarted: courses.filter(c => c.progress === 0).length
    };
    
    // 5. Fetch learner stats
    const { data: statsData, error: statsError } = await supabase
      .from('learner_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    let learnerStats = {
      coursesInProgress: courseStats.inProgress,
      coursesCompleted: courseStats.completed,
      totalTimeSpent: '0h',
      averageScore: 0,
      certificatesEarned: 0
    };
    
    if (!statsError && statsData) {
      learnerStats = {
        coursesInProgress: statsData.courses_in_progress || courseStats.inProgress,
        coursesCompleted: statsData.courses_completed || courseStats.completed,
        totalTimeSpent: `${statsData.total_time_spent || 0}h`,
        averageScore: statsData.average_score || 0,
        certificatesEarned: statsData.certificates_earned || 0
      };
    }
    
    // 6. Featured course - get the most recently accessed course that's in progress
    const featuredCourse = courses.length > 0 
      ? courses
          .filter(c => c.progress > 0 && c.progress < 100)
          .sort((a, b) => {
            if (!a.lastAccessed) return 1;
            if (!b.lastAccessed) return -1;
            return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
          })[0] || courses[0] 
      : null;
    
    // Return combined data
    return NextResponse.json({
      user: {
        id: userId,
        email: userData?.email,
        name: profile?.name || userData?.name,
        role: 'learner'
      },
      profile,
      courses,
      learningPaths,
      counts: courseStats,
      stats: learnerStats,
      featuredCourse,
      isHrProfile
    });
    
  } catch (error) {
    console.error('Unexpected error in learner dashboard API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 