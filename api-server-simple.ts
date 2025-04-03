import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Supabase client for real data when possible
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
console.log("Using Supabase key:", supabaseKey ? "Key found" : "No key found");
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.API_PORT || 3083;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add a debug endpoint
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/debug', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase_connected: !!supabaseKey
  });
});

// --- Learner Dashboard Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/dashboard', async (req, res) => {
  console.log("Received request for /api/learner/dashboard");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for dashboard data");
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Try to get real user data from Supabase if we have credentials
    let realUserData: any = null;
    let realCoursesData: any[] = [];
    let realLearningPathsData: any[] = [];
    
    if (supabaseKey) {
      console.log(`Attempting to fetch profile data for user: ${userId}`);
      
      // Fetch user profile from Supabase
      let userData = null;
      let userError: any = null;
      let sourceTable: string | null = null;
      
      // Try auth.users first with RPC call
      try {
        // Using rpc to access auth schema users table
        const { data: authUserData, error: authUserError } = await supabase
          .rpc('get_user_by_id', { user_id: userId });

        if (!authUserError && authUserData) {
          console.log("Found data via RPC get_user_by_id:");
          console.log(JSON.stringify(authUserData, null, 2));
          userData = authUserData;
          sourceTable = 'auth.users via RPC';
        } else {
          console.error("Error fetching from RPC get_user_by_id:", authUserError);
          
          // Try a direct query to auth.users (admin only)
          const { data: authUser2, error: authError2 } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (!authError2 && authUser2) {
            console.log("Found data in users table:");
            console.log(JSON.stringify(authUser2, null, 2));
            userData = authUser2;
            sourceTable = 'users';
          } else {
            console.error("Error fetching from users:", authError2);
          }
        }
      } catch (e) {
        console.error("Exception querying auth users:", e);
      }
      
      // If we couldn't get data from auth.users, try other tables
      if (!userData) {
        // First try learner_profiles
        const { data: learnerData, error: learnerError } = await supabase
          .from('learner_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (learnerError) {
          console.error("Error fetching from learner_profiles:", learnerError);
          // Try user_profiles next
          const { data: userData2, error: userError2 } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (userError2) {
            console.error("Error fetching from user_profiles:", userError2);
            // Try profiles
            const { data: userData3, error: userError3 } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (userError3) {
              console.error("Error fetching from profiles:", userError3);
              // Try users
              const { data: userData4, error: userError4 } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
                if (userError4) {
                  console.error("Error fetching from users:", userError4);
                  userError = userError4;
                } else {
                  userData = userData4;
                  sourceTable = 'users';
                }
            } else {
              userData = userData3;
              sourceTable = 'profiles';
            }
          } else {
            userData = userData2;
            sourceTable = 'user_profiles';
          }
        } else {
          userData = learnerData;
          sourceTable = 'learner_profiles';
        }
      }
      
      if (!userData) {
        console.error("Could not find user profile in any table:", userError);
      } else {
        console.log(`Successfully fetched profile data from '${sourceTable}' table:`);
        console.log(JSON.stringify(userData, null, 2));
        realUserData = userData;
      }
      
      // Fetch courses data
      const { data: coursesData, error: coursesError } = await supabase
        .from('hr_courses')
        .select('*')
        .limit(10);
        
      if (coursesError) {
        console.error("Error fetching real courses data:", coursesError);
      } else if (coursesData) {
        console.log(`Successfully fetched ${coursesData.length} real courses`);
        realCoursesData = coursesData;
      }
      
      // Fetch learning paths
      const { data: pathsData, error: pathsError } = await supabase
        .from('hr_learning_paths')
        .select('*')
        .limit(5);
        
      if (pathsError) {
        console.error("Error fetching real learning paths data:", pathsError);
      } else if (pathsData) {
        console.log(`Successfully fetched ${pathsData.length} real learning paths`);
        realLearningPathsData = pathsData;
      }
    }
    
    // Prepare profile data (real or mock)
    const profile = realUserData ? {
      id: realUserData.id,
      name: realUserData.name || realUserData.full_name || realUserData.email,
      email: realUserData.email,
      role: realUserData.role || 'learner',
      avatar: realUserData.avatar_url,
      bio: realUserData.bio || 'Learning enthusiast',
      lastLogin: new Date().toISOString(),
      joinDate: realUserData.created_at,
      isHrProfile: !!realUserData.hr_profile_id,
      hrEmployeeId: realUserData.hr_profile_id,
      department: realUserData.department,
      position: realUserData.position
    } : {
      id: userId,
      name: "John Doe",
      email: "johndoe@example.com",
      role: "learner",
      avatar: null,
      bio: "Learning enthusiast",
      lastLogin: new Date().toISOString(),
      joinDate: "2023-01-15T00:00:00.000Z",
      isHrProfile: true,
      hrEmployeeId: "EMP123456",
      department: "Engineering",
      position: "Software Developer"
    };
    
    // Prepare courses data (real or mock)
    const courseItems = realCoursesData ? realCoursesData.map(course => ({
      id: course.id,
      name: course.title,
      title: course.title,
      description: course.description,
      progress: course.progress || Math.floor(Math.random() * 100),
      status: course.status || (Math.random() > 0.5 ? 'in_progress' : 'not_started'),
      category: course.category || 'Development'
    })) : [
      {
        id: "course1",
        name: "Introduction to React",
        title: "Introduction to React",
        description: "Learn the basics of React",
        progress: 30,
        status: "in_progress",
        category: "Web Development"
      },
      {
        id: "course2",
        name: "Advanced JavaScript",
        title: "Advanced JavaScript",
        description: "Master JavaScript concepts",
        progress: 0,
        status: "not_started",
        category: "Programming"
      }
    ];
    
    // Prepare learning paths data (real or mock)
    const learningPaths = realLearningPathsData ? realLearningPathsData.map(path => ({
      id: path.id,
      name: path.title,
      title: path.title,
      description: path.description,
      progress: path.progress || Math.floor(Math.random() * 100),
      courses: path.courses || ["course1", "course2"],
      thumbnail_url: path.thumbnail_url,
      is_hr_assigned: true,
      courses_count: path.courses_count || 2,
      due_date: path.due_date || "2025-06-30T00:00:00.000Z"
    })) : [
      {
        id: "path1",
        name: "Frontend Development",
        title: "Frontend Development",
        description: "Complete path to become a frontend developer",
        progress: 25,
        courses: ["course1", "course2"],
        thumbnail_url: null,
        is_hr_assigned: true,
        courses_count: 2,
        due_date: "2025-06-30T00:00:00.000Z"
      }
    ];
    
    // Send complete response with real or mock data
    res.json({
      profile,
      courses: {
        total: courseItems.length,
        inProgress: courseItems.filter(c => c.status === 'in_progress').length,
        completed: courseItems.filter(c => c.status === 'completed').length,
        notStarted: courseItems.filter(c => c.status === 'not_started').length,
        hrAssigned: realCoursesData ? realCoursesData.filter(c => c.is_hr_assigned).length : 1,
        featured: courseItems.length > 0 ? {
          id: courseItems[0].id,
          title: courseItems[0].title,
          description: courseItems[0].description,
          duration: "2 hours",
          progress: courseItems[0].progress,
          completed_sections: Math.floor(courseItems[0].progress / 10),
          total_sections: 10,
          thumbnail_url: null,
          category: courseItems[0].category,
          hr_training_id: "HR123",
          hr_training_title: "Frontend Essentials"
        } : {
          id: "course1",
          title: "Introduction to React",
          description: "Learn the basics of React",
          duration: "2 hours",
          progress: 30,
          completed_sections: 3,
          total_sections: 10,
          thumbnail_url: null,
          category: "Web Development",
          hr_training_id: "HR123",
          hr_training_title: "Frontend Essentials"
        },
        items: courseItems
      },
      learningPaths,
      completedCourses: courseItems.filter(c => c.status === 'completed').length,
      inProgressCourses: courseItems.filter(c => c.status === 'in_progress').length,
      stats: {
        coursesCompleted: courseItems.filter(c => c.status === 'completed').length,
        coursesInProgress: courseItems.filter(c => c.status === 'in_progress').length,
        learningPathsCompleted: learningPaths.filter(p => p.progress === 100).length,
        learningPathsInProgress: learningPaths.filter(p => p.progress < 100 && p.progress > 0).length,
        assignedCourses: realCoursesData ? realCoursesData.filter(c => c.is_hr_assigned).length : 3,
        skillsAcquired: 7,
        totalHours: 24
      },
      achievements: {
        certificates: [],
        badges: []
      }
    });
  } catch (error) {
    console.error("Error processing dashboard request:", error);
    res.status(500).json({
      error: "Failed to process dashboard request",
      message: error.message || "An unexpected error occurred"
    });
  }
});

// --- Courses Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/courses', (req, res) => {
  console.log("Received request for /api/learner/courses");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for courses data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json([
    {
      id: "course1",
      name: "Introduction to React",
      description: "Learn the basics of React",
      progress: 30,
      status: "in_progress"
    },
    {
      id: "course2",
      name: "Advanced JavaScript",
      description: "Master JavaScript concepts",
      progress: 0,
      status: "not_started"
    }
  ]);
});

// --- Learning Paths Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/learning-paths', (req, res) => {
  console.log("Received request for /api/learner/learning-paths");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for learning paths data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json([
    {
      id: "path1",
      name: "Frontend Development",
      description: "Complete path to become a frontend developer",
      progress: 25,
      courses: ["course1", "course2"]
    }
  ]);
});

// --- Achievements Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/achievements', (req, res) => {
  console.log("Received request for /api/learner/achievements");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for achievements data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json({
    certificates: [],
    badges: []
  });
});

// --- Profile Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/profile', (req, res) => {
  console.log("Received request for /api/learner/profile");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for profile data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json({
    id: userId,
    name: "John Doe",
    email: "johndoe@example.com",
    role: "learner",
    avatar: null,
    bio: "Learning enthusiast",
    lastLogin: new Date().toISOString(),
    joinDate: "2023-01-15T00:00:00.000Z",
    isHrProfile: true,
    hrEmployeeId: "EMP123456",
    department: "Engineering",
    position: "Software Developer",
    skills: ["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS"],
    interests: ["Frontend Development", "Machine Learning", "Mobile Development"],
    certificates: [],
    badges: [],
    completedCourses: 5,
    inProgressCourses: 2
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ API Server listening on port ${PORT}`);
}); 