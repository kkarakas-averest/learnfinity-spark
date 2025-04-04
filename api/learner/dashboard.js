import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

// Mock data generator - same as in api-server-cors.ts
function generateMockDashboardData(userId) {
  return {
    profile: {
      id: userId || "mock-user-id",
      userId: userId || "mock-user-id",
      name: "Demo User",
      email: "demo@example.com",
      bio: "Learning enthusiast",
      title: "Software Developer",
      department: "Engineering",
      skills: ["JavaScript", "React", "Node.js"],
      learningPreferences: {
        preferredLearningStyle: "Visual",
        preferredContentTypes: ["Video", "Interactive"],
        learningGoals: ["Master React", "Learn TypeScript"]
      },
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exists: true,
      hr: {
        id: "hr-" + (userId || "mock-user-id"),
        hire_date: "2023-01-15",
        status: "Active",
        phone: "+1234567890",
        manager: "Jane Manager",
        manager_id: "manager-123",
        department_id: "dept-eng",
        position_id: "pos-dev"
      }
    },
    courses: {
      total: 5,
      featured: {
        id: "course-01",
        title: "Advanced React Patterns",
        description: "Learn advanced patterns in React development",
        duration: 480,
        progress: 65,
        completedSections: 5,
        totalSections: 8,
        thumbnailUrl: "https://via.placeholder.com/300x200",
        featured: true,
        category: "Web Development",
        skills: ["React", "JavaScript", "Frontend"],
        ragStatus: "amber",
        learningPathId: "path-01",
        learningPathName: "Frontend Mastery"
      },
      inProgress: 2,
      completed: 1,
      notStarted: 2,
      hrAssigned: 2,
      items: [
        {
          id: "course-01",
          title: "Advanced React Patterns",
          description: "Learn advanced patterns in React development",
          duration: 480,
          progress: 65,
          completedSections: 5,
          totalSections: 8,
          thumbnailUrl: "https://via.placeholder.com/300x200",
          featured: true,
          category: "Web Development",
          skills: ["React", "JavaScript", "Frontend"],
          ragStatus: "amber",
          learningPathId: "path-01",
          learningPathName: "Frontend Mastery"
        },
        {
          id: "course-02",
          title: "Node.js Microservices",
          description: "Building scalable microservices with Node.js",
          duration: 360,
          progress: 30,
          completedSections: 2,
          totalSections: 6,
          thumbnailUrl: "https://via.placeholder.com/300x200",
          featured: false,
          category: "Backend Development",
          skills: ["Node.js", "Microservices", "API"],
          ragStatus: "green",
          learningPathId: "path-02",
          learningPathName: "Backend Architecture"
        },
        {
          id: "course-03",
          title: "TypeScript Fundamentals",
          description: "Core concepts of TypeScript",
          duration: 240,
          progress: 100,
          completedSections: 5,
          totalSections: 5,
          thumbnailUrl: "https://via.placeholder.com/300x200",
          featured: false,
          category: "Programming Languages",
          skills: ["TypeScript", "Static Typing", "JavaScript"],
          ragStatus: "green",
          learningPathId: "path-01",
          learningPathName: "Frontend Mastery"
        },
        {
          id: "course-04",
          title: "AWS for Developers",
          description: "Essential AWS services for application developers",
          duration: 420,
          progress: 0,
          completedSections: 0,
          totalSections: 7,
          thumbnailUrl: "https://via.placeholder.com/300x200",
          featured: false,
          category: "Cloud Computing",
          skills: ["AWS", "Cloud", "Infrastructure"],
          ragStatus: "red",
          learningPathId: "path-03",
          learningPathName: "Cloud Solutions",
          hrTrainingId: "hr-training-01",
          hrTrainingTitle: "Cloud Certification Program"
        },
        {
          id: "course-05",
          title: "Agile Development Practices",
          description: "Implementing Agile methodologies in development teams",
          duration: 300,
          progress: 0,
          completedSections: 0,
          totalSections: 5,
          thumbnailUrl: "https://via.placeholder.com/300x200",
          featured: false,
          category: "Project Management",
          skills: ["Agile", "Scrum", "Kanban"],
          ragStatus: "amber",
          learningPathId: "path-04",
          learningPathName: "Professional Development",
          hrTrainingId: "hr-training-02",
          hrTrainingTitle: "Leadership Essentials"
        }
      ]
    },
    learningPaths: [
      {
        id: "path-01",
        title: "Frontend Mastery",
        description: "Become an expert in frontend development",
        thumbnail_url: "https://via.placeholder.com/300x200",
        category: "Web Development",
        course_count: 3,
        completed_courses: 1,
        progress: 55,
        path_type: "enrolled",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    stats: {
      coursesCompleted: 1,
      learningPathsCompleted: 0,
      assignedCourses: 2,
      skillsAcquired: 3
    }
  };
}

// CORS options
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Handler setup with CORS
const corsMiddleware = cors(corsOptions);

export default async function handler(req, res) {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Promise((resolve) => {
      corsMiddleware(req, res, () => {
        res.status(200).end();
        resolve();
      });
    });
  }

  // Apply CORS
  await new Promise((resolve) => {
    corsMiddleware(req, res, resolve);
  });

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Log connection status
    console.log(`API (Vercel): Attempting to fetch dashboard data for ${userId}`);
    console.log(`API (Vercel): Supabase URL: ${supabaseUrl ? 'Available' : 'Missing'}`);
    console.log(`API (Vercel): Supabase Key: ${supabaseKey ? 'Available' : 'Missing'}`);
    
    let dashboardData = null;
    
    // Try to fetch real data if Supabase credentials are available
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Attempt to query real data
        // First, let's check which tables actually exist
        let availableTables = [];
        try {
          // Get list of tables
          console.log(`API (Vercel): Checking available tables`);
          const { data: tableData } = await supabase
            .from('_metadata')
            .select('*')
            .limit(1)
            .catch(e => {
              console.log(`API (Vercel): Metadata query failed, using direct queries to check tables`);
              return { data: null };
            });
            
          // If metadata check fails, check existence of common tables directly
          const tablesCheck = [
            supabase.from('users').select('count').limit(1),
            supabase.from('courses').select('count').limit(1),
            supabase.from('learning_paths').select('count').limit(1)
          ];
          
          const results = await Promise.allSettled(tablesCheck);
          
          // Get available tables based on successful queries
          availableTables = [
            results[0].status === 'fulfilled' && !results[0].value.error ? 'users' : null,
            results[1].status === 'fulfilled' && !results[1].value.error ? 'courses' : null,
            results[2].status === 'fulfilled' && !results[2].value.error ? 'learning_paths' : null
          ].filter(Boolean);
          
          console.log(`API (Vercel): Available tables: ${availableTables.join(', ')}`);
        } catch (error) {
          console.error(`API (Vercel): Table check error: ${error.message}`);
        }
        
        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.log(`API (Vercel): Error fetching profile: ${profileError.message}`);
          // Fall back to mock data
          dashboardData = generateMockDashboardData(userId);
        } else {
          // If profile is found, fetch additional data (courses, learning paths)
          console.log(`API (Vercel): Found user profile for ${userId}`);
          
          // Get courses from the appropriate table
          let courses = [];
          if (availableTables.includes('courses')) {
            try {
              const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .limit(10);
                
              if (!coursesError && coursesData) {
                courses = coursesData.map(course => ({
                  id: course.id,
                  title: course.title || 'Untitled Course',
                  description: course.description || 'No description available',
                  duration: course.duration || 240,
                  progress: course.progress || Math.floor(Math.random() * 100),
                  completedSections: course.completed_sections || Math.floor(Math.random() * 5),
                  totalSections: course.total_sections || 10,
                  thumbnailUrl: course.thumbnail_url || "https://via.placeholder.com/300x200",
                  featured: !!course.featured,
                  category: course.category || "Development",
                  skills: course.skills || ["Programming"],
                  ragStatus: course.rag_status || "amber",
                  learningPathId: course.learning_path_id || "path-01",
                  learningPathName: course.learning_path_name || "Development Path"
                }));
                console.log(`API (Vercel): Found ${courses.length} courses`);
              }
            } catch (error) {
              console.error(`API (Vercel): Error fetching courses: ${error.message}`);
            }
          }
          
          // Get learning paths from the appropriate table
          let learningPaths = [];
          if (availableTables.includes('learning_paths')) {
            try {
              const { data: pathsData, error: pathsError } = await supabase
                .from('learning_paths')
                .select('*')
                .limit(10);
                
              if (!pathsError && pathsData) {
                learningPaths = pathsData.map(path => ({
                  id: path.id,
                  title: path.title || 'Untitled Path',
                  description: path.description || 'No description available',
                  thumbnail_url: path.thumbnail_url || "https://via.placeholder.com/300x200",
                  category: path.category || "Development",
                  course_count: path.course_count || 3,
                  completed_courses: path.completed_courses || 1,
                  progress: path.progress || Math.floor(Math.random() * 100),
                  path_type: path.path_type || "enrolled",
                  due_date: path.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  assigned_date: path.assigned_date || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
                }));
                console.log(`API (Vercel): Found ${learningPaths.length} learning paths`);
              }
            } catch (error) {
              console.error(`API (Vercel): Error fetching learning paths: ${error.message}`);
            }
          }
          
          // For demonstration, combine real user data with courses/paths (or mock if none found)
          const mockData = generateMockDashboardData(userId);
          
          // Merge real user profile data with available real data and mock data for missing parts
          dashboardData = {
            profile: {
              ...mockData.profile,
              id: userProfile.id || userId,
              name: userProfile.name || mockData.profile.name,
              email: userProfile.email || mockData.profile.email,
            },
            courses: {
              total: courses.length || mockData.courses.total,
              featured: courses.length > 0 ? courses[0] : mockData.courses.featured,
              inProgress: Math.floor((courses.length || 5) / 2),
              completed: Math.floor((courses.length || 5) / 3),
              notStarted: (courses.length || 5) - (Math.floor((courses.length || 5) / 2) + Math.floor((courses.length || 5) / 3)),
              hrAssigned: Math.floor((courses.length || 5) / 4),
              items: courses.length > 0 ? courses : mockData.courses.items
            },
            learningPaths: learningPaths.length > 0 ? learningPaths : mockData.learningPaths,
            stats: {
              coursesCompleted: Math.floor((courses.length || 5) / 3),
              learningPathsCompleted: 0,
              assignedCourses: Math.floor((courses.length || 5) / 4),
              skillsAcquired: 3
            }
          };
        }
      } catch (error) {
        console.error(`API (Vercel): Supabase connection error: ${error.message}`);
        // Fall back to mock data
        dashboardData = generateMockDashboardData(userId);
      }
    } else {
      // No Supabase credentials, use mock data
      console.log('API (Vercel): No Supabase credentials, using mock data');
      dashboardData = generateMockDashboardData(userId);
    }
    
    // Add personalization to mock data if needed
    if (!dashboardData.profile.name || dashboardData.profile.name === 'Demo User') {
      dashboardData.profile.name = `User ${userId.substring(0, 6)}`;
    }
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('API (Vercel):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 