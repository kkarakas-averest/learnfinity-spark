import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

let supabase = null;
let supabaseAdmin = null;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    } else {
      supabaseAdmin = supabase;
    }
  }
} catch (error) {
  console.error('Error initializing Supabase:', error);
}

// Get mock data for the learner dashboard
const getMockDashboardData = (userId) => {
  return {
    profile: {
      id: userId || '6e2c2548-c04a-419b-a17c-c2feb6a3d9c6',
      name: 'John Doe',
      email: 'johndoe@example.com',
      role: 'learner',
      avatar: null,
      bio: 'Learning enthusiast',
      lastLogin: new Date().toISOString(),
      joinDate: '2023-01-15T00:00:00.000Z',
      isHrProfile: true,
      hrEmployeeId: 'EMP123456',
      department: 'Engineering',
      position: 'Software Developer'
    },
    courses: {
      total: 2,
      inProgress: 1,
      completed: 0,
      notStarted: 1,
      hrAssigned: 0,
      featured: {
        id: 'course1',
        title: 'Introduction to React',
        description: 'Learn the basics of React',
        duration: '2 hours',
        progress: 30,
        completed_sections: 3,
        total_sections: 10,
        thumbnail_url: null,
        category: 'Web Development',
        hr_training_id: 'HR123',
        hr_training_title: 'Frontend Essentials'
      },
      items: [
        {
          id: 'course1',
          title: 'Introduction to React',
          description: 'Learn the basics of React',
          duration: '2 hours',
          progress: 30,
          completed_sections: 3,
          total_sections: 10,
          thumbnail_url: null,
          category: 'Web Development',
          skills: ['React', 'JavaScript', 'Web Development'],
          rag_status: 'in_progress',
          hr_training_id: 'HR123',
          hr_training_title: 'Frontend Essentials'
        },
        {
          id: 'course2',
          title: 'Advanced TypeScript',
          description: 'Master TypeScript for large applications',
          duration: '3 hours',
          progress: 0,
          completed_sections: 0,
          total_sections: 8,
          thumbnail_url: null,
          category: 'Programming',
          skills: ['TypeScript', 'JavaScript', 'Programming'],
          rag_status: 'not_started'
        }
      ]
    },
    learningPaths: [
      {
        id: 'path1',
        title: 'Frontend Development',
        description: 'Complete path to become a frontend developer',
        courses_count: 3,
        progress: 25,
        thumbnail_url: null,
        skills: ['React', 'CSS', 'JavaScript'],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    completedCourses: 0,
    inProgressCourses: 1,
    stats: {
      coursesCompleted: 0,
      coursesInProgress: 1,
      learningPathsCompleted: 0,
      learningPathsInProgress: 1,
      assignedCourses: 0,
      skillsAcquired: 7,
      totalHours: 24
    },
    achievements: {
      certificates: [],
      badges: []
    }
  };
};

// API Handler for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId parameter',
      status: 400,
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // If Supabase is available, try to get real data
    if (supabase) {
      try {
        // Attempt to fetch user profile data
        let profileData = null;
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (!userError && userData) {
            profileData = userData;
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        // Fetch courses data
        const { data: coursesData, error: coursesError } = await supabase
          .from('hr_courses')
          .select('*')
          .limit(10);
        
        // Fetch learning paths data
        const { data: pathsData, error: pathsError } = await supabase
          .from('hr_learning_paths')
          .select('*')
          .limit(10);
        
        // If we have real data, use it, otherwise fallback to mock
        if ((profileData || coursesData || pathsData) && 
            !(coursesError && pathsError)) {
          
          // Start with mock data as a template
          const dashboardData = getMockDashboardData(userId);
          
          // Replace with real data where available
          if (profileData) {
            dashboardData.profile = {
              ...dashboardData.profile,
              id: profileData.id,
              name: profileData.name || profileData.full_name || dashboardData.profile.name,
              email: profileData.email || dashboardData.profile.email,
              role: profileData.role || dashboardData.profile.role
            };
          }
          
          if (coursesData && coursesData.length > 0) {
            dashboardData.courses.items = coursesData.map(course => ({
              id: course.id,
              title: course.title,
              description: course.description,
              duration: course.duration || '2 hours',
              progress: Math.floor(Math.random() * 100),
              completed_sections: Math.floor(Math.random() * 10),
              total_sections: 10,
              thumbnail_url: course.thumbnail_url,
              category: course.category || 'Development',
              skills: course.skills || ['Programming'],
              rag_status: Math.random() > 0.5 ? 'in_progress' : 'not_started'
            }));
            
            dashboardData.courses.total = coursesData.length;
            dashboardData.courses.featured = dashboardData.courses.items[0];
          }
          
          if (pathsData && pathsData.length > 0) {
            dashboardData.learningPaths = pathsData.map(path => ({
              id: path.id,
              title: path.title,
              description: path.description,
              courses_count: path.courses_count || 3,
              progress: Math.floor(Math.random() * 100),
              thumbnail_url: path.thumbnail_url,
              due_date: new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000).toISOString(),
              skills: path.skills || ['Programming', 'Development']
            }));
          }
          
          return res.status(200).json(dashboardData);
        }
      } catch (supabaseError) {
        console.error('Error fetching from Supabase:', supabaseError);
        // On error, fall through to mock data
      }
    }
    
    // Fallback to mock data
    const mockData = getMockDashboardData(userId);
    return res.status(200).json(mockData);
    
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      status: 500,
      timestamp: new Date().toISOString()
    });
  }
} 