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
const PORT = process.env.PORT || 3083;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  // Add response logging
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    originalEnd.apply(res, args);
  };
  
  next();
});

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add a timeout handler to avoid long-running requests
app.use((req, res, next) => {
  // Set a 30-second timeout for all requests
  req.setTimeout(30000, () => {
    console.error(`Request timeout for ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(504).json({ error: 'Request timeout', status: 504 });
    }
  });
  
  next();
});

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Only handle errors that haven't been sent yet
  if (res.headersSent) {
    return next(err);
  }
  
  // Ensure contentType is set to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Return a structured JSON error response
  res.status(500).json({
    error: 'An unexpected server error occurred',
    message: err.message || 'Unknown error',
    status: 500
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3083,
      hostname: req.hostname,
    },
    requestInfo: {
      headers: req.headers,
      url: req.url,
      method: req.method,
      ip: req.ip,
      xhr: req.xhr,
      protocol: req.protocol,
    },
    supabaseInfo: {
      supabaseUrlAvailable: !!process.env.SUPABASE_URL,
      supabaseKeyAvailable: !!process.env.SUPABASE_KEY,
    }
  };
  
  // Set correct headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Return debug info
  return res.json(debugInfo);
});

// Helper function to handle API errors consistently
function handleApiError(res, error, fallbackData = null) {
  console.error('API Error:', error);
  
  if (fallbackData) {
    // If fallback data is provided, return it instead of an error
    console.log('Returning fallback data due to error');
    return res.json(fallbackData);
  }
  
  // Otherwise return a structured error response
  return res.status(500).json({
    error: 'API Error',
    message: error.message || 'Unknown error',
    status: 500
  });
}

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
    
    let userData = null;
    let hrEmployeeData = null;
    let profileData = null;
    let hasLearnerProfile = false;
    let hasHrData = false;
    
    // Try to get user data from auth.users
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        userData = data;
        console.log('User data found:', userData);
      } else {
        console.log('User not found in auth.users, continuing with fallback data');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
    
    // Try to get HR employee data
    try {
      const { data, error } = await supabase
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
          hire_date,
          status,
          manager_id,
          manager:manager_id(name)
        `)
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        hrEmployeeData = data;
        hasHrData = true;
        console.log('HR employee data found:', hrEmployeeData.id);
      } else {
        console.log('HR employee data not found:', error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching HR employee data:', err);
    }
    
    // Construct a reliable profile response
    // If no real data is available, use mock data
    if (!userData && !hrEmployeeData) {
      console.log('No user or HR data found, using mock data');
      
      // Create mock profile data
      const mockProfile = {
        id: null,
        userId: userId,
        email: 'user@example.com',
        name: 'Example User',
        bio: 'This is a mock profile for demonstration purposes.',
        phone: '+1 (555) 123-4567',
        title: 'Software Developer',
        department: 'Engineering',
        skills: ['JavaScript', 'React', 'TypeScript', 'NextJS'],
        learningPreferences: {
          preferredLearningStyle: 'visual',
          preferredContentTypes: ['video', 'interactive'],
          learningGoals: ['Improve front-end skills', 'Learn new frameworks']
        },
        createdAt: new Date().toISOString(),
        updatedAt: null,
        onboardingCompleted: true,
        exists: true,
        isHrProfile: true,
        hr: {
          id: 'mock-hr-id',
          hire_date: '2023-01-15',
          status: 'active',
          phone: '+1 (555) 123-4567',
          manager: 'Jane Manager',
          manager_id: 'manager-id'
        }
      };
      
      return res.json(mockProfile);
    }
    
    // Construct profile with real data where available
    const profileResponse = {
      id: profileData?.id || null,
      userId: userId,
      email: profileData?.email || hrEmployeeData?.email || userData?.email || '',
      name: profileData?.name || hrEmployeeData?.name || userData?.name || 'Unknown User',
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
            hrEmployeeData.department.name) : null),
      skills: profileData?.skills || ['TypeScript', 'React', 'NextJS'],
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
        status: hrEmployeeData.status || 'active',
        phone: hrEmployeeData.phone,
        manager: Array.isArray(hrEmployeeData.manager) ? 
          hrEmployeeData.manager[0]?.name : 
          (hrEmployeeData.manager?.name || null),
        manager_id: hrEmployeeData.manager_id,
        department_id: hrEmployeeData.department_id,
        position_id: hrEmployeeData.position_id
      };
    } else {
      // Always include some HR data for demo purposes
      profileResponse.hr = {
        id: userId,
        hire_date: '2023-01-15',
        status: 'active',
        phone: null,
        manager: null,
        manager_id: null,
        department_id: null,
        position_id: null
      };
      profileResponse.isHrProfile = true;
    }
    
    console.log('Sending profile response with HR data:', !!profileResponse.hr);
    return res.json(profileResponse);
    
  } catch (error) {
    console.error('Unexpected error in learner profile API:', error);
    // Return a minimal error profile
    return res.json({
      id: null,
      userId: req.query.userId || null,
      email: 'error@example.com',
      name: 'Demo User',
      bio: null,
      title: 'Software Developer',
      department: 'Engineering',
      skills: ['JavaScript', 'React', 'TypeScript'],
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
      isHrProfile: true,
      hr: {
        id: req.query.userId || 'mock-id',
        hire_date: '2023-01-01',
        status: 'active',
        phone: null,
        manager: null,
        manager_id: null
      }
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
    
    // Create reliable mock courses data
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Introduction to TypeScript',
        description: 'Learn the fundamentals of TypeScript and how to use it with React',
        thumbnailUrl: 'https://example.com/typescript.jpg',
        featured: false,
        category: 'Programming',
        skills: ['TypeScript', 'JavaScript', 'Web Development'],
        ragStatus: 'green',
        learningPathId: 'path-1',
        learningPathName: 'Web Development',
        progress: 75,
        completedSections: 3,
        totalSections: 4,
        duration: 8,
        course_type: 'enrolled'
      },
      {
        id: 'course-2',
        title: 'Advanced React Patterns',
        description: 'Master advanced React patterns and best practices',
        thumbnailUrl: 'https://example.com/react.jpg',
        featured: true,
        category: 'Programming',
        skills: ['React', 'JavaScript', 'Web Development'],
        ragStatus: 'amber',
        learningPathId: 'path-1',
        learningPathName: 'Web Development',
        progress: 30,
        completedSections: 2,
        totalSections: 6,
        duration: 12,
        course_type: 'enrolled'
      },
      {
        id: 'hr-course-1',
        title: 'HR Compliance Training',
        description: 'Required compliance training for all employees',
        thumbnailUrl: 'https://example.com/compliance.jpg',
        featured: false,
        category: 'HR Training',
        skills: ['Compliance', 'HR'],
        ragStatus: 'red',
        learningPathId: 'hr-path-1',
        learningPathName: 'HR Required Training',
        progress: 0,
        completedSections: 0,
        totalSections: 3,
        duration: 4,
        course_type: 'hr_assigned',
        hrTrainingId: 'hr-training-1',
        hrTrainingTitle: 'Annual Compliance Training'
      },
      {
        id: 'hr-course-2',
        title: 'Leadership Skills for Managers',
        description: 'Develop essential leadership skills for effective management',
        thumbnailUrl: 'https://example.com/leadership.jpg',
        featured: false,
        category: 'Leadership',
        skills: ['Leadership', 'Management', 'Communication'],
        ragStatus: 'green',
        learningPathId: 'hr-path-2',
        learningPathName: 'Leadership Development',
        progress: 50,
        completedSections: 2,
        totalSections: 4,
        duration: 6,
        course_type: 'hr_assigned',
        hrTrainingId: 'hr-training-2',
        hrTrainingTitle: 'Management Development Program'
      }
    ];
    
    // Try to get employee data to check if this is an HR employee
    let hasHrData = false;
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!employeeError && employeeData) {
        hasHrData = true;
        console.log('Found HR employee data with ID:', employeeData.id);
      }
    } catch (err) {
      console.error('Error checking HR employee data:', err);
    }
    
    // Return consistent course data structure
    return res.json({
      courses: mockCourses,
      featuredCourse: mockCourses.find(c => c.featured),
      counts: {
        total: mockCourses.length,
        inProgress: mockCourses.filter(c => c.progress > 0 && c.progress < 100).length,
        completed: mockCourses.filter(c => c.progress === 100).length,
        notStarted: mockCourses.filter(c => c.progress === 0).length,
        hr_assigned: mockCourses.filter(c => c.course_type === 'hr_assigned').length
      }
    });
  
  } catch (error) {
    console.error('Unexpected error in learner courses API:', error);
    
    // Return fallback courses data even if there's an error
    const fallbackCourses = [
      {
        id: 'fallback-course-1',
        title: 'Getting Started with Learnfinity',
        description: 'An introduction to the Learnfinity learning platform',
        thumbnailUrl: 'https://example.com/learnfinity.jpg',
        featured: true,
        category: 'Onboarding',
        skills: ['Learning Platform'],
        ragStatus: 'green',
        learningPathId: 'onboarding-path',
        learningPathName: 'New User Onboarding',
        progress: 0,
        completedSections: 0,
        totalSections: 3,
        duration: 2,
        course_type: 'assigned'
      }
    ];
    
    return res.json({
      courses: fallbackCourses,
      featuredCourse: fallbackCourses[0],
      counts: {
        total: 1,
        inProgress: 0,
        completed: 0,
        notStarted: 1,
        hr_assigned: 0
      }
    });
  }
});

/**
 * GET /api/learner/dashboard
 * Returns dashboard data including profile, courses, learning paths and stats
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
    
    // Try to get HR employee data
    let hrEmployeeData = null;
    let hasHrData = false;
    
    try {
      const { data, error } = await supabase
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
          hire_date,
          status,
          manager_id,
          manager:manager_id(name)
        `)
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        hrEmployeeData = data;
        hasHrData = true;
        console.log('HR employee data found for dashboard:', hrEmployeeData.id);
      } else {
        console.log('HR employee data not found for dashboard:', error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching HR employee data for dashboard:', err);
    }
    
        // Get real learning paths for the dashboard
    let realLearningPaths = [];
    try {
      console.log('Fetching real learning paths from database...');
      const { data: lpEnrollments, error: lpError } = await supabase
        .from('hr_learning_path_enrollments')
        .select(`
          id,
          learning_path_id,
          status,
          progress,
          enrollment_date,
          completion_date,
          estimated_completion_date,
          hr_learning_paths(id, title, description, skill_level)
        `)
        .eq('employee_id', userId);
        
      if (lpError) {
        console.error('Error fetching learning path enrollments:', lpError.message);
      } else if (lpEnrollments && lpEnrollments.length > 0) {
        console.log(`Found ${lpEnrollments.length} learning paths for user`);
        
        // Transform real learning path data
        realLearningPaths = lpEnrollments.map(enrollment => {
          const pathData = enrollment.hr_learning_paths;
          return {
            id: pathData.id,
            title: pathData.title,
            description: pathData.description || 'No description available',
            courses_count: 3, // We would need to count from real data
            skills: [pathData.skill_level || 'General'], // We would need real skills
            due_date: enrollment.estimated_completion_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            progress: enrollment.progress || 0,
            is_hr_assigned: true,
            hr_learning_path_id: pathData.id,
            thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
            estimatedCompletionDate: enrollment.estimated_completion_date || null,
            enrollmentDate: enrollment.enrollment_date || null
          };
        });
      }
    } catch (lpErr) {
      console.error('Error in learning paths query:', lpErr);
    }
    
    // Get real courses for the dashboard
    let realCourses = [];
    try {
      console.log('Fetching real courses from database...');
      const { data: courseEnrollments, error: ceError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          id,
          course_id,
          status,
          progress,
          enrollment_date,
          completion_date,
          hr_courses(id, title, description, duration, skill_level)
        `)
        .eq('employee_id', userId);
        
      if (ceError) {
        console.error('Error fetching course enrollments:', ceError.message);
      } else if (courseEnrollments && courseEnrollments.length > 0) {
        console.log(`Found ${courseEnrollments.length} courses for user`);
        
        // Transform real course data
        realCourses = courseEnrollments.map(enrollment => {
          const courseData = enrollment.hr_courses;
          return {
            id: courseData.id,
            title: courseData.title,
            description: courseData.description || 'No description available',
            thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
            category: courseData.skill_level || 'General',
            skills: courseData.skill_level ? [courseData.skill_level] : ['General'],
            rag_status: enrollment.status === 'completed' ? 'completed' : 
              (enrollment.progress > 0 ? 'in_progress' : 'not_started'),
            learning_path_id: null, // We would need to link to learning path
            learning_path_name: null,
            progress: enrollment.progress || 0,
            completed_sections: Math.floor((enrollment.progress || 0) / 20), // Estimate
            total_sections: 5, // Default
            duration: courseData.duration ? `${courseData.duration} minutes` : '2 hours',
            course_type: 'required',
            hr_training_id: courseData.id,
            hr_training_title: courseData.title,
            enrollmentDate: enrollment.enrollment_date || null
          };
        });
      }
    } catch (courseErr) {
      console.error('Error in courses query:', courseErr);
    }
    
    // Use mock data as fallback if no real data found
    let learningPaths = realLearningPaths.length > 0 ? realLearningPaths : [
      {
        id: '1',
        title: 'New Employee Orientation',
        description: 'Essential onboarding courses for all new employees',
        courses_count: 4,
        skills: ['Company Knowledge', 'Workplace Policies', 'Team Collaboration'],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 25,
        is_hr_assigned: true,
        hr_learning_path_id: 'hr-lp-1',
        thumbnail_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        enrollmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Leadership Development',
        description: 'Enhance your leadership and management capabilities',
        courses_count: 6,
        skills: ['Leadership', 'Delegation', 'Strategic Thinking', 'Team Building'],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 10,
        is_hr_assigned: true,
        hr_learning_path_id: 'hr-lp-2',
        thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
        estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        enrollmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    let courses = realCourses.length > 0 ? realCourses : [
      {
        id: 'course-1',
        title: 'Introduction to Company Policies',
        description: 'Learn about key company policies and procedures',
        thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
        category: 'Onboarding',
        skills: ['Company Knowledge', 'Workplace Policies'],
        rag_status: 'in_progress',
        learning_path_id: '1',
        learning_path_name: 'New Employee Orientation',
        progress: 45,
        completed_sections: 2,
        total_sections: 5,
        duration: '2 hours',
        course_type: 'required',
        hr_training_id: 'hr-training-1',
        hr_training_title: 'Corporate Policies 101',
        enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'course-2',
        title: 'Team Collaboration Tools',
        description: 'Master the tools used for team collaboration',
        thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
        category: 'Productivity',
        skills: ['Collaboration', 'Communication', 'Technology'],
        rag_status: 'completed',
        learning_path_id: '1',
        learning_path_name: 'New Employee Orientation',
        progress: 100,
        completed_sections: 4,
        total_sections: 4,
        duration: '1.5 hours',
        course_type: 'optional',
        enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Prepare the profile data with real HR data
    const profile = {
      id: null,
      userId: userId,
      email: hrEmployeeData?.email || 'user@example.com',
      name: hrEmployeeData?.name || 'Example User',
      bio: 'Passionate about continuous learning and professional development.',
      phone: hrEmployeeData?.phone || '+1 (555) 123-4567',
      title: hrEmployeeData?.position?.title || 'Software Developer',
      department: hrEmployeeData?.department?.name || 'Engineering',
      skills: ['JavaScript', 'React', 'TypeScript', 'NextJS'],
      learningPreferences: {
        preferredLearningStyle: 'visual',
        preferredContentTypes: ['video', 'interactive'],
        learningGoals: ['Improve leadership skills', 'Learn new technologies']
      },
      createdAt: hrEmployeeData?.hire_date || new Date().toISOString(),
      updatedAt: null,
      onboardingCompleted: true,
      exists: true,
      isHrProfile: !!hasHrData
    };
    
    // Add HR data if available
    if (hrEmployeeData) {
      profile.hr = {
        id: hrEmployeeData.id,
        hire_date: hrEmployeeData.hire_date,
        status: hrEmployeeData.status || 'active',
        phone: hrEmployeeData.phone,
        manager: Array.isArray(hrEmployeeData.manager) ? 
          hrEmployeeData.manager[0]?.name : 
          (hrEmployeeData.manager?.name || null),
        manager_id: hrEmployeeData.manager_id,
        department_id: hrEmployeeData.department_id,
        position_id: hrEmployeeData.position_id
      };
    } else {
      // Include mock HR data for demo purposes
      profile.hr = {
        id: userId,
        hire_date: '2023-01-15',
        status: 'active',
        phone: '+1 (555) 123-4567',
        manager: 'Jane Manager',
        manager_id: 'manager-id'
      };
    }
    
    // Calculate stats from real data
    const inProgress = realCourses.filter(c => c.rag_status === 'in_progress').length;
    const completed = realCourses.filter(c => c.rag_status === 'completed').length;
    const notStarted = realCourses.filter(c => c.rag_status === 'not_started').length;
    
    // Return combined data with real data or fallbacks
    return res.json({
      profile,
      learningPaths,
      courses: {
        total: courses.length,
        featured: courses.length > 0 ? courses[0] : null,
        inProgress: inProgress || 1,
        completed: completed || 0,
        notStarted: notStarted || 1,
        hrAssigned: courses.length,
        items: courses
      },
      stats: {
        coursesCompleted: completed || 0,
        learningPathsCompleted: 0,
        assignedCourses: courses.length,
        skillsAcquired: (completed * 2) || 2
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in learner dashboard API:', error);
    
    // Return fallback dashboard data on error
    return res.json({
      profile: {
        id: null,
        userId: req.query.userId || null,
        email: 'error@example.com',
        name: 'Demo User',
        bio: 'This is a fallback profile for demonstration purposes.',
        phone: '+1 (555) 123-4567',
        title: 'Software Developer',
        department: 'Engineering',
        skills: ['JavaScript', 'React', 'TypeScript'],
        learningPreferences: {
          preferredLearningStyle: 'visual',
          preferredContentTypes: ['video', 'interactive'],
          learningGoals: ['Improve coding skills', 'Learn new frameworks']
        },
        createdAt: new Date().toISOString(),
        updatedAt: null,
        onboardingCompleted: true,
        exists: true,
        isHrProfile: true,
        hr: {
          id: req.query.userId || 'mock-id',
          hire_date: '2023-01-01',
          status: 'active',
          phone: '+1 (555) 123-4567',
          manager: 'John Manager',
          manager_id: 'manager-id'
        }
      },
      learningPaths: [
        {
          id: 'fallback-1',
          title: 'Getting Started with Learnfinity',
          description: 'Essential courses for all users',
          courses_count: 3,
          skills: ['Learning Platform', 'Digital Skills'],
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 15,
          is_hr_assigned: true,
          hr_learning_path_id: 'fallback-hr-1',
          thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
        }
      ],
      courses: {
        total: 1,
        featured: {
          id: 'fallback-course-1',
          title: 'Introduction to Learnfinity',
          description: 'Learn how to use the platform effectively',
          thumbnail_url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
          category: 'Platform',
          skills: ['Learning Platform', 'Digital Skills'],
          rag_status: 'not_started',
          learning_path_id: 'fallback-1',
          learning_path_name: 'Getting Started with Learnfinity',
          progress: 0,
          completed_sections: 0,
          total_sections: 5,
          duration: '1 hour',
          course_type: 'required',
          hr_training_id: 'fallback-hr-course-1',
          hr_training_title: 'Platform Onboarding'
        },
        inProgress: 0,
        completed: 0,
        notStarted: 1,
        hrAssigned: 1,
        items: [
          {
            id: 'fallback-course-1',
            title: 'Introduction to Learnfinity',
            description: 'Learn how to use the platform effectively',
            thumbnail_url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
            category: 'Platform',
            skills: ['Learning Platform', 'Digital Skills'],
            rag_status: 'not_started',
            learning_path_id: 'fallback-1',
            learning_path_name: 'Getting Started with Learnfinity',
            progress: 0,
            completed_sections: 0,
            total_sections: 5,
            duration: '1 hour',
            course_type: 'required',
            hr_training_id: 'fallback-hr-course-1',
            hr_training_title: 'Platform Onboarding'
          }
        ]
      },
      stats: {
        coursesCompleted: 0,
        learningPathsCompleted: 0,
        assignedCourses: 1,
        skillsAcquired: 2
      }
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

/**
 * GET /api/learner/learning-path
 * Gets the learning paths for a specific learner
 */
app.get('/api/learner/learning-path', async (req, res) => {
  try {
    console.log('GET /api/learner/learning-path called with query:', req.query);
    
    // Get userId from query parameters
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log(`Fetching learning paths for user ID: ${userId}`);
    
    let learningPaths = [];
    
    try {
      // Fetch HR employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (!employeeError && employeeData) {
        console.log('Found HR employee data, creating mock learning paths');
        
        // Create mock HR learning paths as fallback
        learningPaths = [
          {
            id: 'hr-path-1',
            title: 'New Employee Orientation',
            description: 'Complete onboarding process for new employees',
            thumbnail_url: null,
            category: 'Onboarding',
            skills: ['Communication', 'Company Knowledge'],
            course_count: 3,
            completed_courses: 0,
            total_duration_minutes: 180,
            progress: 0,
            path_type: 'hr_assigned',
            assigned_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            hr_plan_id: 'hr-plan-1',
            hr_plan_title: 'Employee Onboarding',
            estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            enrollmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'hr-path-2',
            title: 'Leadership Development',
            description: 'Develop essential leadership skills',
            thumbnail_url: null,
            category: 'Leadership',
            skills: ['Leadership', 'Management'],
            course_count: 5,
            completed_courses: 0,
            total_duration_minutes: 300,
            progress: 0,
            path_type: 'hr_assigned',
            assigned_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            hr_plan_id: 'hr-plan-2',
            hr_plan_title: 'Leadership Development Plan',
            estimatedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            enrollmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      }
    } catch (hrError) {
      console.error('Error processing HR learning path data:', hrError);
    }
    
    console.log(`Returning ${learningPaths.length} learning paths`);
    return res.json(learningPaths);
    
  } catch (error) {
    console.error('Unexpected error in learner learning paths API:', error);
    // Return empty array as fallback
    return res.json([]);
  }
});

/**
 * POST /api/sync-hr/employee/:id
 * Syncs HR employee data to a learner profile
 */
app.post('/api/sync-hr/employee/:id', async (req, res) => {
  try {
    console.log('POST /api/sync-hr/employee called with params:', req.params);
    
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    
    console.log(`Syncing employee ID: ${id} to learner profile`);
    
    // Get employee data from HR system
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
        hire_date,
        status,
        manager_id,
        manager:manager_id(name)
      `)
      .eq('id', id)
      .single();
      
    if (employeeError) {
      console.error('Error fetching employee data:', employeeError);
      return res.status(404).json({ 
        error: 'Employee not found', 
        details: employeeError.message 
      });
    }
    
    console.log('Employee data found:', employeeData.id);
    
    // Check if a user exists with this email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', employeeData.email)
      .single();
      
    let userId = employeeData.id;
    
    if (userError) {
      // User doesn't exist, create a user entry
      console.log('No user found for this employee, using employee ID as user ID');
    } else {
      userId = userData.id;
      console.log('Found matching user:', userId);
    }
    
    // Check if learner profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking learner profile:', profileError);
    }
    
    // Prepare data for updating or creating
    const department = employeeData.department 
      ? (Array.isArray(employeeData.department) 
          ? employeeData.department[0]?.name 
          : employeeData.department.name) 
      : null;
      
    const position = employeeData.position 
      ? (Array.isArray(employeeData.position) 
          ? employeeData.position[0]?.title 
          : employeeData.position.title) 
      : null;
      
    // Data for updating existing profile or creating new one
    const updateData = {
      name: employeeData.name,
      email: employeeData.email,
      phone: employeeData.phone,
      title: position,
      department: department,
      hr_employee_id: employeeData.id,
      hr_department_id: employeeData.department_id,
      hr_position_id: employeeData.position_id,
      hr_hire_date: employeeData.hire_date,
      hr_status: employeeData.status,
      hr_manager_id: employeeData.manager_id,
      hr_manager_name: employeeData.manager 
        ? (Array.isArray(employeeData.manager) 
            ? employeeData.manager[0]?.name 
            : employeeData.manager.name) 
        : null,
      updated_at: new Date().toISOString()
    };
    
    let result;
    if (!profileData) {
      // Create new learner profile
      console.log('Creating new learner profile from HR data');
      
      const newProfile = {
        ...updateData,
        user_id: userId,
        bio: 'Employee profile synced from HR system',
        learning_preferences: {
          preferred_learning_style: null,
          preferred_content_types: [],
          learning_goals: []
        },
        onboarding_completed: false,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('learner_profiles')
        .insert([newProfile])
        .select();
        
      if (error) {
        console.error('Error creating learner profile:', error);
        return res.status(500).json({ 
          error: 'Failed to create learner profile', 
          details: error.message 
        });
      }
      
      result = { created: true, profile: data[0] };
      console.log('Learner profile created');
      
    } else {
      // Update existing profile
      console.log('Updating existing learner profile with HR data');
      
      const { data, error } = await supabase
        .from('learner_profiles')
        .update(updateData)
        .eq('id', profileData.id)
        .select();
        
      if (error) {
        console.error('Error updating learner profile:', error);
        return res.status(500).json({ 
          error: 'Failed to update learner profile', 
          details: error.message 
        });
      }
      
      result = { updated: true, profile: data[0] };
      console.log('Learner profile updated');
    }
    
    // Now sync employee's courses to learner enrollments
    try {
      console.log('Syncing HR training courses to learner enrollments');
      
      const { data: trainings, error: trainingsError } = await supabase
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
            module_count
          ),
          training:training_id(
            id,
            title,
            description,
            type
          )
        `)
        .eq('employee_id', id);
        
      if (trainingsError) {
        console.error('Error fetching employee trainings:', trainingsError);
      } else if (trainings && trainings.length > 0) {
        console.log(`Found ${trainings.length} HR trainings to sync`);
        
        // For each training with a course, ensure course enrollment exists
        for (const training of trainings) {
          if (!training.course_id) continue;
          
          const courseData = Array.isArray(training.courses) ? 
            training.courses[0] : training.courses;
            
          if (!courseData) continue;
          
          // Check if enrollment exists
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('id, progress')
            .eq('user_id', userId)
            .eq('course_id', training.course_id)
            .single();
            
          if (enrollmentError && enrollmentError.code !== 'PGRST116') {
            console.error('Error checking course enrollment:', enrollmentError);
            continue;
          }
          
          if (!enrollmentData) {
            // Create new enrollment
            console.log(`Creating enrollment for course ${training.course_id}`);
            
            let progress = 0;
            let ragStatus = 'green';
            let completedModules = 0;
            
            // Map HR training status to learner enrollment status
            if (training.status === 'completed') {
              progress = 100;
              ragStatus = 'green';
              completedModules = courseData.module_count || 1;
            } else if (training.status === 'in_progress') {
              progress = 50;
              ragStatus = 'amber';
              completedModules = Math.ceil((courseData.module_count || 2) / 2);
            } else {
              progress = 0;
              ragStatus = 'amber'; // HR assigned courses default to amber
              completedModules = 0;
            }
            
            const { error: createError } = await supabase
              .from('course_enrollments')
              .insert([{
                user_id: userId,
                course_id: training.course_id,
                progress,
                rag_status: ragStatus,
                completed_modules: completedModules,
                total_modules: courseData.module_count || 1,
                due_date: training.due_date,
                hr_training_id: training.training_id,
                hr_training_title: Array.isArray(training.training) 
                  ? training.training[0]?.title 
                  : (training.training?.title || 'HR Training'),
                hr_assigned: true,
                created_at: new Date().toISOString()
              }]);
              
            if (createError) {
              console.error('Error creating course enrollment:', createError);
            } else {
              console.log('Course enrollment created');
            }
          } else {
            console.log(`Enrollment already exists for course ${training.course_id}`);
            // Optionally update the existing enrollment with HR data
          }
        }
      }
    } catch (err) {
      console.error('Error syncing HR trainings:', err);
      // Don't fail the entire operation if just the training sync fails
    }
    
    // Return the result
    return res.json({
      success: true,
      ...result,
      message: `HR employee data successfully ${result.created ? 'synced to new' : 'synced to existing'} learner profile`
    });
    
  } catch (error) {
    console.error('Unexpected error in sync HR endpoint:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    });
  }
});

// Add a final catchall error handler to ensure JSON responses
app.use((req, res, next) => {
  // Route not found - send JSON instead of HTML
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    status: 404
  });
});

// Server start with error handling
const server = app.listen(PORT, HOST, () => {
  console.log('Starting API server with config:');
  console.log(`- Supabase URL available: ${!!process.env.SUPABASE_URL}`);
  console.log(`- Supabase Key available: ${!!process.env.SUPABASE_KEY}`);
  
  // For local development, provide the localhost URL
  console.log(`API server running at http://localhost:${PORT}`);
  
  // For production, just output the port the server is listening on
  if (process.env.NODE_ENV === 'production') {
    console.log(`API server running in production mode on port ${PORT}`);
  } else {
    console.log(`API server also accessible on your local network at http://${HOST}:${PORT}`);
  }
});

// Handle port conflicts gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && process.env.NODE_ENV !== 'production') {
    console.log(`Port ${PORT} is already in use. Trying another port...`);
    const newPort = PORT + 1;
    console.log(`Attempting to use port ${newPort} instead...`);
    server.close();
    app.listen(newPort, HOST, () => {
      console.log(`API server running at http://localhost:${newPort}`);
      console.log(`API server also accessible on your local network at http://${HOST}:${newPort}`);
      console.log(`WARNING: Using alternative port. Update your frontend proxy configuration!`);
    });
  } else {
    console.error('Server error:', error);
    process.exit(1); // Exit in production to allow container orchestration to restart
  }
});

// Add process-level unhandled exception handling to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - keeping process alive:', error);
  // Optionally alert developers in production via email/message etc.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION - keeping process alive:', reason);
  // Optionally alert developers in production via email/message etc.
}); 