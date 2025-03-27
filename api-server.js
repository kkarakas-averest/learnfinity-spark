import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Starting API server with config:');
console.log(`- Supabase URL available: ${Boolean(supabaseUrl)}`);
console.log(`- Supabase Key available: ${Boolean(supabaseKey)}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with better logging
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Create Express app
const app = express();
const PORT = process.env.API_PORT || 3083;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/learner/profile
 * Gets the profile information for a specific learner
 */
app.get('/api/learner/profile', async (req, res) => {
  try {
    console.log('GET /api/learner/profile called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching profile for user ID: ${userId}`);
    
    // Get user data from auth.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
      
    // Check for user data and handle errors gracefully
    const userEmail = userError ? null : userData?.email;
    const userName = userError ? null : userData?.name;
    
    if (userError) {
      console.log('User not found in auth.users, continuing with HR data check');
    } else {
      console.log('User data found:', userData);
    }
    
    // First check HR employee data to establish base profile
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id, 
        name, 
        email, 
        phone,
        department_id, 
        position_id,
        department:hr_departments(name),
        position:hr_positions(title),
        skills,
        hire_date,
        status,
        manager_id,
        manager:manager_id(name)
      `)
      .eq('user_id', userId)
      .single();
    
    let hasHrData = false;
    let hrEmployeeData = null;
    
    if (employeeError) {
      console.log('HR employee data not found:', employeeError.message);
    } else {
      console.log('HR employee data found:', employeeData.id);
      hasHrData = true;
      hrEmployeeData = employeeData;
    }

    // Next check for learner profile data
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    let hasLearnerProfile = false;
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching learner profile:', profileError);
    } else if (profileData) {
      console.log('Learner profile found:', profileData.id);
      hasLearnerProfile = true;
    }
    
    // Construct a comprehensive profile using both HR and learner data
    const profileResponse = {
      id: profileData?.id || null,
      userId: userId,
      email: profileData?.email || hrEmployeeData?.email || userEmail || '',
      name: profileData?.name || hrEmployeeData?.name || userName || 'Unknown User',
      bio: profileData?.bio || null,
      phone: hrEmployeeData?.phone || null,
      title: profileData?.title || 
        (hrEmployeeData?.position ? 
          (Array.isArray(hrEmployeeData.position) ? 
            hrEmployeeData.position[0]?.title : 
            hrEmployeeData.position.title) : null),
      department: profileData?.department || 
        (hrEmployeeData?.department ? 
          (Array.isArray(hrEmployeeData.department) ? 
            hrEmployeeData.department[0]?.name : 
            hrEmployeeData.department.title) : null),
      skills: profileData?.skills || 
        (Array.isArray(hrEmployeeData?.skills) ? hrEmployeeData.skills : []),
      learningPreferences: {
        preferredLearningStyle: profileData?.learning_preferences?.preferred_learning_style || null,
        preferredContentTypes: profileData?.learning_preferences?.preferred_content_types || [],
        learningGoals: profileData?.learning_preferences?.learning_goals || []
      },
      createdAt: profileData?.created_at || (hrEmployeeData ? hrEmployeeData.hire_date : null),
      updatedAt: profileData?.updated_at || null,
      onboardingCompleted: profileData?.onboarding_completed || false,
      exists: hasLearnerProfile,
      isHrProfile: !hasLearnerProfile && hasHrData
    };
    
    // Add HR data if available
    if (hrEmployeeData) {
      profileResponse.hr = {
        id: hrEmployeeData.id,
        hire_date: hrEmployeeData.hire_date,
        status: hrEmployeeData.status,
        phone: hrEmployeeData.phone,
        manager: Array.isArray(hrEmployeeData.manager) ? 
          hrEmployeeData.manager[0]?.name : 
          (hrEmployeeData.manager?.name || null),
        manager_id: hrEmployeeData.manager_id,
        department_id: hrEmployeeData.department_id,
        position_id: hrEmployeeData.position_id
      };
    }
    
    console.log('Sending profile response with HR data:', !!profileResponse.hr);
    return res.json(profileResponse);
    
  } catch (error) {
    console.error('Unexpected error in learner profile API:', error);
    // Return a minimal error profile
    return res.json({
      id: null,
      userId: req.query.userId || null,
      email: null,
      name: 'Error User',
      bio: null,
      title: null,
      department: null,
      skills: [],
      phone: null,
      learningPreferences: {
        preferredLearningStyle: null,
        preferredContentTypes: [],
        learningGoals: []
      },
      createdAt: null,
      updatedAt: null,
      onboardingCompleted: false,
      exists: false,
      isHrProfile: false,
      error: true,
      errorMessage: error.message
    });
  }
});

/**
 * GET /api/learner/courses
 * Gets the courses enrolled by a specific learner
 */
app.get('/api/learner/courses', async (req, res) => {
  try {
    console.log('GET /api/learner/courses called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching courses for user ID: ${userId}`);
    
    // Fetch course enrollments for the user
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        status,
        progress,
        last_accessed,
        completion_date,
        enrolled_date,
        courses:course_id(
          id, 
          title, 
          description, 
          thumbnail_url, 
          category, 
          level, 
          duration_minutes,
          content_type
        )
      `)
      .eq('user_id', userId);
      
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return res.status(500).json({ 
        error: 'Failed to fetch course enrollments', 
        details: enrollmentsError.message 
      });
    }
    
    console.log(`Found ${enrollments?.length || 0} course enrollments`);
    
    // Fetch assigned courses (not yet enrolled)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select(`
        id,
        assigned_date,
        due_date,
        status,
        courses:course_id(
          id, 
          title, 
          description, 
          thumbnail_url, 
          category, 
          level, 
          duration_minutes,
          content_type
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      // Continue anyway, we'll just return enrolled courses
    } else {
      console.log(`Found ${assignments?.length || 0} course assignments`);
    }
    
    // Get HR trainings/courses assigned to the employee
    const { data: hrTrainings, error: hrTrainingsError } = await supabase
      .from('hr_employee_trainings')
      .select(`
        id,
        training_id,
        assigned_date,
        due_date,
        status,
        course_id,
        courses:course_id(
          id, 
          title, 
          description, 
          thumbnail_url, 
          category, 
          level, 
          duration_minutes,
          content_type
        ),
        training:training_id(
          id,
          title,
          description,
          type
        )
      `)
      .eq('employee_user_id', userId)
      .or('status.eq.assigned,status.eq.pending,status.eq.in_progress');
      
    if (hrTrainingsError) {
      console.error('Error fetching HR trainings:', hrTrainingsError);
      // Continue without HR data
    } else {
      console.log(`Found ${hrTrainings?.length || 0} HR training assignments`);
    }
    
    // Process enrolled courses
    const enrolledCourses = enrollments.map(enrollment => {
      if (!enrollment.courses) return null;
      
      const course = Array.isArray(enrollment.courses) ? 
        enrollment.courses[0] : enrollment.courses;
        
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        category: course.category,
        level: course.level,
        duration_minutes: course.duration_minutes,
        content_type: course.content_type,
        progress: enrollment.progress || 0,
        last_accessed: enrollment.last_accessed,
        completion_status: enrollment.status,
        enrolled_date: enrollment.enrolled_date,
        course_type: 'enrolled'
      };
    }).filter(Boolean);
    
    // Process assigned courses
    const assignedCourses = assignments ? assignments.map(assignment => {
      if (!assignment.courses) return null;
      
      const course = Array.isArray(assignment.courses) ? 
        assignment.courses[0] : assignment.courses;
        
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        category: course.category,
        level: course.level,
        duration_minutes: course.duration_minutes,
        content_type: course.content_type,
        progress: 0,
        assigned_date: assignment.assigned_date,
        due_date: assignment.due_date,
        completion_status: 'not_started',
        course_type: 'assigned'
      };
    }).filter(Boolean) : [];
    
    // Process HR training/course assignments
    const hrCourses = hrTrainings ? hrTrainings
      .filter(training => training.course_id && training.courses) // Only include those with actual course data
      .map(training => {
        const course = Array.isArray(training.courses) ? 
          training.courses[0] : training.courses;
          
        const trainingInfo = Array.isArray(training.training) ?
          training.training[0] : training.training;
          
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          category: course.category || 'HR Training',
          level: course.level,
          duration_minutes: course.duration_minutes,
          content_type: course.content_type,
          progress: training.status === 'completed' ? 100 : (training.status === 'in_progress' ? 50 : 0),
          assigned_date: training.assigned_date,
          due_date: training.due_date,
          completion_status: training.status === 'completed' ? 'completed' : 'not_started',
          course_type: 'hr_assigned',
          hr_training_id: training.training_id,
          hr_training_title: trainingInfo?.title || 'HR Training',
          hr_training_type: trainingInfo?.type || 'training'
        };
      }) : [];
    
    // Combine all courses, avoiding duplicates by using a Map
    const courseMap = new Map();
    
    // First add enrolled courses (highest priority)
    enrolledCourses.forEach(course => courseMap.set(course.id, course));
    
    // Then add assigned courses if not already enrolled
    assignedCourses.forEach(course => {
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, course);
      }
    });
    
    // Finally add HR courses if not already included
    hrCourses.forEach(course => {
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, course);
      }
    });
    
    // Convert map back to array
    const allCourses = Array.from(courseMap.values());
    
    console.log(`Returning ${allCourses.length} total courses`);
    
    return res.json({
      courses: allCourses,
      stats: {
        total: allCourses.length,
        enrolled: enrolledCourses.length,
        assigned: assignedCourses.length + hrCourses.length,
        hr_assigned: hrCourses.length,
        completed: allCourses.filter(c => c.completion_status === 'completed').length,
        in_progress: allCourses.filter(c => c.progress > 0 && c.completion_status !== 'completed').length
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in learner courses API:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/learner/dashboard
 * Gets dashboard data for a learner
 */
app.get('/api/learner/dashboard', async (req, res) => {
  try {
    console.log('GET /api/learner/dashboard called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching dashboard data for user ID: ${userId}`);
    
    // Get user email from auth.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        error: 'Failed to fetch user data', 
        details: userError.message 
      });
    }

    console.log('User data found:', userData);

    // 1. Get learner profile data
    let profile = null;
    let isHrProfile = false;
    let hrEmployeeData = null;
    
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching learner profile:', profileError);
      // Continue despite error - we'll try HR data as fallback
    }
    
    // If no learner profile exists, check for employee data from HR
    if (!profileData) {
      console.log('No learner profile found, checking HR data');
      
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
          skills,
          hire_date,
          status,
          manager_id,
          manager:manager_id(name),
          user_id
        `)
        .eq('user_id', userId)
        .single();
      
      if (!employeeError && employeeData) {
        console.log('HR employee data found:', employeeData);
        isHrProfile = true;
        hrEmployeeData = employeeData;
        
        // Create a profile from employee data
        profile = {
          id: `hr-${employeeData.id}`,
          userId,
          email: employeeData.email || userData?.email || '',
          name: employeeData.name || userData?.email?.split('@')[0] || 'Learner',
          bio: null,
          title: employeeData.position ? 
            (Array.isArray(employeeData.position) ? employeeData.position[0]?.title : employeeData.position.title) || null : null,
          department: employeeData.department ? 
            (Array.isArray(employeeData.department) ? employeeData.department[0]?.name : employeeData.department.name) || null : null,
          skills: Array.isArray(employeeData.skills) ? employeeData.skills : [],
          learningPreferences: {
            preferredLearningStyle: null,
            preferredContentTypes: [],
            learningGoals: []
          },
          hr: {
            id: employeeData.id,
            hire_date: employeeData.hire_date,
            status: employeeData.status,
            manager: Array.isArray(employeeData.manager) ? 
              employeeData.manager[0]?.name : 
              (employeeData.manager?.name || null),
            manager_id: employeeData.manager_id
          },
          onboardingCompleted: false
        };
      } else {
        console.log('No HR employee data found, creating minimal profile');
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
      console.log('Learner profile found:', profileData.id);
      
      // Also check for HR data to get additional information
      const { data: hrEmployeeDataCheck, error: hrEmployeeError } = await supabase
        .from('hr_employees')
        .select(`
          id, 
          name, 
          department_id, 
          position_id,
          department:hr_departments(name),
          position:hr_positions(title),
          hire_date,
          status,
          manager_id,
          manager:manager_id(name)
        `)
        .eq('user_id', userId)
        .single();
        
      if (!hrEmployeeError && hrEmployeeDataCheck) {
        hrEmployeeData = hrEmployeeDataCheck;
        console.log('Found corresponding HR data:', hrEmployeeData.id);
      }
      
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
      
      // Add HR data if available
      if (hrEmployeeData) {
        profile.hr = {
          id: hrEmployeeData.id,
          hire_date: hrEmployeeData.hire_date,
          status: hrEmployeeData.status,
          manager: Array.isArray(hrEmployeeData.manager) ? 
            hrEmployeeData.manager[0]?.name : 
            (hrEmployeeData.manager?.name || null),
          manager_id: hrEmployeeData.manager_id
        };
      }
    }
    
    // 2. Get course enrollments
    console.log('Fetching course enrollments');
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
      
    let courses = [];
    if (enrollmentsError) {
      console.error('Error fetching course enrollments:', enrollmentsError);
      // Continue with empty courses array instead of returning error
    } else {
      console.log(`Found ${enrollmentsData?.length || 0} course enrollments`);
      
      // Process courses data
      courses = enrollmentsData?.map(enrollment => {
        const courseData = enrollment.course;
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
          completedModules: enrollment.completed_modules || 0,
          course_type: 'enrolled'
        };
      }) || [];
    }
    
    // Get HR-assigned courses for the employee
    console.log('Fetching HR assigned courses');
    const { data: hrCoursesData, error: hrCoursesError } = await supabase
      .from('hr_employee_trainings')
      .select(`
        id,
        training_id,
        assigned_date,
        due_date,
        status,
        course_id,
        courses:course_id(
          id, 
          title, 
          description, 
          estimated_duration,
          thumbnail_url, 
          module_count
        ),
        training:training_id(
          id,
          title,
          description,
          type
        )
      `)
      .eq('employee_user_id', userId)
      .or('status.eq.assigned,status.eq.pending,status.eq.in_progress');
      
    if (hrCoursesError) {
      console.error('Error fetching HR courses:', hrCoursesError);
      // Continue with existing courses
    } else if (hrCoursesData && hrCoursesData.length > 0) {
      console.log(`Found ${hrCoursesData.length} HR-assigned courses`);
      
      // Process HR-assigned courses and add to courses array
      const hrCourses = hrCoursesData
        .filter(training => training.course_id && training.courses) // Only include with actual course data
        .map(training => {
          const course = Array.isArray(training.courses) ? 
            training.courses[0] : training.courses;
            
          const trainingInfo = Array.isArray(training.training) ?
            training.training[0] : training.training;
            
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            progress: training.status === 'completed' ? 100 : (training.status === 'in_progress' ? 50 : 0),
            thumbnailUrl: course.thumbnail_url,
            ragStatus: 'amber', // Amber status for HR-assigned courses by default
            dueDate: training.due_date,
            estimatedDuration: course.estimated_duration,
            lastAccessed: null, // HR assigned courses may not have last accessed data
            moduleCount: course.module_count || 0,
            completedModules: 0, // Default to 0 for not started
            course_type: 'hr_assigned',
            hr_training_id: training.training_id,
            hr_training_title: trainingInfo?.title || 'HR Training'
          };
        });
        
      // Add HR courses to the course list if they're not already enrolled
      hrCourses.forEach(hrCourse => {
        if (!courses.some(c => c.id === hrCourse.id)) {
          courses.push(hrCourse);
        }
      });
    }
    
    // 3. Get learning paths
    console.log('Fetching learning paths');
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
      
    let learningPaths = [];
    if (pathsError) {
      console.error('Error fetching learning paths:', pathsError);
      // Continue with empty paths array
    } else {
      console.log(`Found ${pathsData?.length || 0} learning paths`);
      learningPaths = (pathsData || []).map((enrollment) => {
        const pathData = enrollment.learning_path;
        return {
          id: pathData.id,
          title: pathData.title,
          description: pathData.description,
          progress: enrollment.progress || 0,
          ragStatus: (enrollment.rag_status || 'green').toLowerCase(),
          courseCount: pathData.course_count || 0,
          completedCourses: enrollment.completed_courses || 0
        };
      });
    }
    
    // 4. Calculate course stats
    const courseStats = {
      total: courses.length,
      inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
      completed: courses.filter(c => c.progress === 100).length,
      notStarted: courses.filter(c => c.progress === 0).length
    };
    
    // 5. Fetch learner stats
    console.log('Fetching learner statistics');
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
      console.log('Learner statistics found');
      learnerStats = {
        coursesInProgress: statsData.courses_in_progress || courseStats.inProgress,
        coursesCompleted: statsData.courses_completed || courseStats.completed,
        totalTimeSpent: `${statsData.total_time_spent || 0}h`,
        averageScore: statsData.average_score || 0,
        certificatesEarned: statsData.certificates_earned || 0
      };
    } else if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching learner statistics:', statsError);
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
    
    console.log('Returning dashboard data');
    
    // Return combined data
    return res.json({
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
      isHrProfile,
      hrEmployeeData
    });
    
  } catch (error) {
    console.error('Unexpected error in learner dashboard API:', error);
    // Return structured error response
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/learner/achievements
 * Gets achievements earned by a specific learner
 */
app.get('/api/learner/achievements', async (req, res) => {
  try {
    console.log('GET /api/learner/achievements called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching achievements for user ID: ${userId}`);
    
    // Fetch certificates for the user
    const { data: certificatesData, error: certificatesError } = await supabase
      .from('learner_certificates')
      .select(`
        id,
        title,
        description,
        image_url,
        issued_date,
        course_id,
        course:courses(title)
      `)
      .eq('user_id', userId);
      
    if (certificatesError) {
      console.error('Error fetching certificates:', certificatesError);
      return res.status(500).json({ 
        error: 'Failed to fetch certificates', 
        details: certificatesError.message 
      });
    }
    
    console.log(`Found ${certificatesData?.length || 0} certificates`);
    
    // Fetch badges for the user
    const { data: badgesData, error: badgesError } = await supabase
      .from('learner_badges')
      .select(`
        id,
        title,
        description,
        image_url,
        awarded_date,
        badge_type,
        skill_id,
        skill:skills(name)
      `)
      .eq('user_id', userId);
      
    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return res.status(500).json({ 
        error: 'Failed to fetch badges', 
        details: badgesError.message 
      });
    }
    
    console.log(`Found ${badgesData?.length || 0} badges`);
    
    // Process certificates
    const certificates = (certificatesData || []).map(cert => ({
      id: cert.id,
      title: cert.title,
      description: cert.description,
      awardedAt: cert.issued_date,
      type: 'certificate',
      imageUrl: cert.image_url,
      courseTitle: cert.course?.title
    }));
    
    // Process badges
    const badges = (badgesData || []).map(badge => ({
      id: badge.id,
      title: badge.title,
      description: badge.description,
      awardedAt: badge.awarded_date,
      type: badge.badge_type || 'badge',
      imageUrl: badge.image_url,
      skillName: badge.skill?.name
    }));
    
    // Calculate summary stats
    const recentAchievements = [...certificates, ...badges]
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
      .slice(0, 5);
    
    console.log(`Returning ${certificates.length} certificates and ${badges.length} badges`);
    
    return res.json({
      certificates,
      badges,
      summary: {
        totalCertificates: certificates.length,
        totalBadges: badges.length,
        recentAchievements
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in learner achievements API:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to get local IP
function getLocalIP() {
  try {
    // Use ES modules import syntax instead of require
    const os = { networkInterfaces: () => ({}) }; // Default fallback
    try {
      // Dynamic import for ES modules
      import('os').then(osModule => {
        os.networkInterfaces = osModule.networkInterfaces;
      });
    } catch (e) {
      console.warn('Failed to import os module:', e);
    }
    
    const nets = os.networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    console.warn('Error getting local IP:', error);
  }
  return '127.0.0.1';
}

/**
 * GET /api/learner/learning-paths
 * Gets the learning paths for a specific learner
 */
app.get('/api/learner/learning-paths', async (req, res) => {
  try {
    console.log('GET /api/learner/learning-paths called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching learning paths for user ID: ${userId}`);
    
    // Fetch learner learning path enrollments
    const { data: pathEnrollments, error: pathEnrollmentsError } = await supabase
      .from('learning_path_enrollments')
      .select(`
        id,
        status,
        progress,
        completed_courses,
        enrolled_date,
        learning_path:learning_path_id(
          id,
          title,
          description,
          thumbnail_url,
          category,
          skills,
          course_count,
          total_duration_minutes
        )
      `)
      .eq('user_id', userId);
      
    if (pathEnrollmentsError) {
      console.error('Error fetching learning path enrollments:', pathEnrollmentsError);
      return res.status(500).json({ 
        error: 'Failed to fetch learning path enrollments', 
        details: pathEnrollmentsError.message 
      });
    }
    
    console.log(`Found ${pathEnrollments?.length || 0} learning path enrollments`);
    
    // Fetch assigned learning paths (not yet enrolled)
    const { data: pathAssignments, error: pathAssignmentsError } = await supabase
      .from('learning_path_assignments')
      .select(`
        id,
        assigned_date,
        due_date,
        status,
        learning_path:learning_path_id(
          id,
          title,
          description,
          thumbnail_url,
          category,
          skills,
          course_count,
          total_duration_minutes
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');
      
    if (pathAssignmentsError) {
      console.error('Error fetching learning path assignments:', pathAssignmentsError);
      // Continue anyway with enrolled paths
    } else {
      console.log(`Found ${pathAssignments?.length || 0} learning path assignments`);
    }
    
    // Process enrolled learning paths
    const enrolledPaths = pathEnrollments.map(enrollment => {
      if (!enrollment.learning_path) return null;
      
      const path = Array.isArray(enrollment.learning_path) ? 
        enrollment.learning_path[0] : enrollment.learning_path;
        
      return {
        id: path.id,
        title: path.title,
        description: path.description,
        thumbnail_url: path.thumbnail_url,
        category: path.category,
        skills: path.skills || [],
        course_count: path.course_count || 0,
        total_duration_minutes: path.total_duration_minutes || 0,
        progress: enrollment.progress || 0,
        completed_courses: enrollment.completed_courses || 0,
        enrollment_status: enrollment.status,
        enrolled_date: enrollment.enrolled_date,
        path_type: 'enrolled'
      };
    }).filter(Boolean);
    
    // Process assigned learning paths
    const assignedPaths = pathAssignments ? pathAssignments.map(assignment => {
      if (!assignment.learning_path) return null;
      
      const path = Array.isArray(assignment.learning_path) ? 
        assignment.learning_path[0] : assignment.learning_path;
        
      return {
        id: path.id,
        title: path.title,
        description: path.description,
        thumbnail_url: path.thumbnail_url,
        category: path.category,
        skills: path.skills || [],
        course_count: path.course_count || 0,
        total_duration_minutes: path.total_duration_minutes || 0,
        progress: 0,
        completed_courses: 0,
        assigned_date: assignment.assigned_date,
        due_date: assignment.due_date,
        path_type: 'assigned'
      };
    }).filter(Boolean) : [];
    
    // Get HR-assigned learning paths
    const { data: hrAssignments, error: hrAssignmentsError } = await supabase
      .from('hr_employee_development_plans')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        learning_path_id,
        skills
      `)
      .eq('employee_user_id', userId)
      .eq('status', 'active');
      
    // Process HR learning paths if available
    let hrPaths = [];
    if (hrAssignmentsError) {
      console.error('Error fetching HR development plans:', hrAssignmentsError);
    } else if (hrAssignments && hrAssignments.length > 0) {
      console.log(`Found ${hrAssignments.length} HR development plans`);
      
      // Get learning path details for each plan that has a learning path ID
      const pathIds = hrAssignments
        .filter(plan => plan.learning_path_id)
        .map(plan => plan.learning_path_id);
        
      if (pathIds.length > 0) {
        const { data: pathsData, error: pathsError } = await supabase
          .from('learning_paths')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            category,
            skills,
            course_count,
            total_duration_minutes
          `)
          .in('id', pathIds);
          
        if (pathsError) {
          console.error('Error fetching HR learning paths:', pathsError);
        } else if (pathsData) {
          // Map HR learning paths with their assignment data
          hrPaths = pathsData.map(path => {
            const assignment = hrAssignments.find(a => a.learning_path_id === path.id);
            return {
              id: path.id,
              title: path.title,
              description: path.description,
              thumbnail_url: path.thumbnail_url,
              category: path.category,
              skills: path.skills || [],
              course_count: path.course_count || 0,
              total_duration_minutes: path.total_duration_minutes || 0,
              progress: 0, // Not started yet
              completed_courses: 0,
              assigned_date: assignment?.start_date,
              due_date: assignment?.end_date,
              hr_plan_id: assignment?.id,
              hr_plan_title: assignment?.title,
              path_type: 'hr_assigned'
            };
          });
          
          console.log(`Processed ${hrPaths.length} HR learning paths`);
        }
      }
    }
    
    // Combine all learning paths, avoiding duplicates by ID
    const pathMap = new Map();
    
    // First add enrolled paths (highest priority)
    enrolledPaths.forEach(path => pathMap.set(path.id, path));
    
    // Then add assigned paths if not already enrolled
    assignedPaths.forEach(path => {
      if (!pathMap.has(path.id)) {
        pathMap.set(path.id, path);
      }
    });
    
    // Finally add HR paths if not already included
    hrPaths.forEach(path => {
      if (!pathMap.has(path.id)) {
        pathMap.set(path.id, path);
      }
    });
    
    // Convert map back to array
    const allPaths = Array.from(pathMap.values());
    
    console.log(`Returning ${allPaths.length} total learning paths`);
    
    return res.json({
      learning_paths: allPaths,
      stats: {
        total: allPaths.length,
        enrolled: enrolledPaths.length,
        assigned: assignedPaths.length + hrPaths.length,
        completed: enrolledPaths.filter(p => p.progress === 100).length,
        in_progress: enrolledPaths.filter(p => p.progress > 0 && p.progress < 100).length
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in learning paths API:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/learner/profile/sync-hr
 * Syncs HR employee data to a learner profile
 */
app.post('/api/learner/profile/sync-hr', async (req, res) => {
  try {
    console.log('POST /api/learner/profile/sync-hr called with body:', req.body);
    
    const { userId } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Syncing HR data for user ID: ${userId}`);
    
    // Fetch employee data from HR
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id, 
        name, 
        email, 
        phone,
        department_id, 
        position_id,
        department:hr_departments(name),
        position:hr_positions(title),
        skills,
        hire_date,
        status
      `)
      .eq('user_id', userId)
      .single();
      
    if (employeeError) {
      console.error('Error fetching HR employee data:', employeeError);
      return res.status(404).json({ 
        error: 'HR employee data not found', 
        details: employeeError.message 
      });
    }
    
    console.log('HR employee data found:', employeeData.id);
    
    // Check if a learner profile already exists
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    let profileId = null;
    let syncResults = {};
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking learner profile:', profileError);
      return res.status(500).json({ 
        error: 'Error checking existing learner profile', 
        details: profileError.message 
      });
    }
    
    // Extract department and position names from nested objects
    const departmentName = employeeData.department ? 
      (Array.isArray(employeeData.department) ? 
        employeeData.department[0]?.name : 
        employeeData.department.name) : null;
        
    const positionTitle = employeeData.position ? 
      (Array.isArray(employeeData.position) ? 
        employeeData.position[0]?.title : 
        employeeData.position.title) : null;
    
    if (profileData) {
      // Profile exists, update with HR data
      console.log('Updating existing learner profile:', profileData.id);
      
      const updateData = {
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        department: departmentName,
        title: positionTitle,
        // Merge existing skills with HR skills
        skills: [...new Set([
          ...(profileData.skills || []), 
          ...(Array.isArray(employeeData.skills) ? employeeData.skills : [])
        ])],
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('learner_profiles')
        .update(updateData)
        .eq('id', profileData.id);
        
      if (updateError) {
        console.error('Error updating learner profile:', updateError);
        return res.status(500).json({ 
          error: 'Failed to update learner profile', 
          details: updateError.message 
        });
      }
      
      profileId = profileData.id;
      syncResults = {
        action: 'updated',
        profileId,
        fields: Object.keys(updateData)
      };
    } else {
      // Profile doesn't exist, create new from HR data
      console.log('Creating new learner profile from HR data');
      
      const newProfile = {
        user_id: userId,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        department: departmentName,
        title: positionTitle,
        skills: Array.isArray(employeeData.skills) ? employeeData.skills : [],
        learning_preferences: {
          preferredLearningStyle: null,
          preferredContentTypes: [],
          learningGoals: []
        },
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('learner_profiles')
        .insert(newProfile)
        .select();
        
      if (insertError) {
        console.error('Error creating learner profile:', insertError);
        return res.status(500).json({ 
          error: 'Failed to create learner profile', 
          details: insertError.message 
        });
      }
      
      profileId = insertData?.[0]?.id;
      syncResults = {
        action: 'created',
        profileId,
        fields: Object.keys(newProfile)
      };
    }
    
    return res.json({
      success: true,
      message: `Successfully synced HR data to learner profile`,
      profileId,
      syncResults
    });
    
  } catch (error) {
    console.error('Unexpected error syncing HR data:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start the server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`API server also accessible on your network at http://${getLocalIP()}:${PORT}`);
})
.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
    // Try alternative port
    const altPort = parseInt(PORT) + 1;
    console.log(`Attempting to use port ${altPort} instead...`);
    app.listen(altPort, '0.0.0.0', () => {
      console.log(`API server running at http://localhost:${altPort}`);
      console.log(`API server also accessible on your network at http://${getLocalIP()}:${altPort}`);
      console.log(`WARNING: Using alternative port. Update your frontend proxy configuration!`);
    });
  } else {
    console.error('Failed to start server:', err);
  }
}); 