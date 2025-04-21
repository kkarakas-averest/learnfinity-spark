/**
 * Simple API Server with CORS support
 * Designed to work with the Vite development server
 */
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables - do this at the very beginning
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded from .env file');
}

// Create Express app
const app = express();

// Parse PORT as a number to fix type issues
const PORT = typeof process.env.PORT === 'string' ? parseInt(process.env.PORT, 10) : 3083;

// Debug environment variables (without showing full keys)
console.log('\nEnvironment variable check:');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Found ✅' : 'Missing ❌'}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Found ✅' : 'Missing ❌'}`);
console.log(`SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'Found ✅' : 'Missing ❌'}`);
console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Found ✅' : 'Missing ❌'}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Found ✅' : 'Missing ❌'}`);
console.log(`VITE_SUPABASE_SERVICE_KEY: ${process.env.VITE_SUPABASE_SERVICE_KEY ? 'Found ✅' : 'Missing ❌'}\n`);

// CORS Configuration - Allow all origins, including localhost with any port
const corsOptions = {
  origin: function(origin, callback) {
    // Allow any origin (null means same origin/server-to-server)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware with more details
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  console.log('Headers:', req.headers['user-agent'], req.headers['origin'] || 'no-origin', req.headers['referer'] || 'no-referer');
  next();
});

// Set appropriate headers for all responses
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  next();
});

// Initialize Supabase - Look for VITE_, non-prefixed, and NEXT_PUBLIC_ variants
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || ''; // Typically no NEXT_PUBLIC_ for service key

// Log what we found without exposing the full keys (security measure)
console.log(`Using Supabase URL: ${supabaseUrl ? 'Found ✅' : 'Missing ❌'}`);
console.log(`Using Supabase key: ${supabaseKey ? 'Key found' : 'Key missing'}`);
console.log(`Using Supabase service key: ${supabaseServiceKey ? 'Key found' : 'Key missing'}`);

let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseKey) {
    console.log('Initializing Supabase client with anon key');
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    
    if (supabaseServiceKey) {
      console.log('Initializing Supabase admin client with service role key');
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    } else {
      console.warn('No service role key found, using anon key for admin operations (reduced functionality)');
      supabaseAdmin = supabase;
    }
  } else {
    console.warn('Missing Supabase URL or key. Mocked data will be used.');
  }
} catch (error) {
  console.error('Error initializing Supabase:', error);
}

// Type for user profile data
interface UserProfile {
  id?: string;
  user_id?: string;
  name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  role?: string;
  department?: string;
  position?: string;
  job_title?: string;
  avatar_url?: string;
  avatar?: string;
  [key: string]: any;
}

// Debug endpoint
app.get('/api/debug', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase_connected: !!supabase,
    supabase_url_set: !!supabaseUrl,
    supabase_key_set: !!supabaseKey,
    env_vars: {
      // Don't include actual values of sensitive env vars
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      VITE_APP_URL: process.env.VITE_APP_URL,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      VITE_SUPABASE_SERVICE_KEY: process.env.VITE_SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set'
    }
  });
});

// Mock data for the learner dashboard
const getMockDashboardData = (userId: string): any => {
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

// Learner dashboard endpoint
app.get('/api/learner/dashboard', async (req, res) => {
  console.log('Received request for /api/learner/dashboard');
  console.log('Query parameters:', req.query);
  console.log('Request headers:', {
    accept: req.headers.accept,
    origin: req.headers.origin,
    referer: req.headers.referer,
    'user-agent': req.headers['user-agent']
  });
  
  const userId = req.query.userId as string;
  
  if (!userId) {
    res.status(400).json({
      error: 'Missing userId parameter',
      status: 400,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  try {
    // Attempt to fetch real data from Supabase
    let dashboardData = getMockDashboardData(userId);
    
    if (supabase) {
      console.log(`Attempting to fetch profile data for user: ${userId}`);
      
      try {
        // Try to get user profile from different tables
        let profileData: UserProfile | null = null;
        
        const tables = [
          // Try the custom get_user_by_id function first
          { name: 'RPC get_user_by_id', method: async () => {
            if (!supabaseAdmin) return null;
            const { data, error } = await supabaseAdmin.rpc('get_user_by_id', { user_id: userId });
            if (error) throw error;
            return data;
          }},
          // Then try the auth.users table with admin key
          { name: 'users', method: async () => {
            if (!supabaseAdmin) return null;
            try {
              const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
              if (error) throw error;
              return data?.user;
            } catch (e) {
              console.error('Error with admin.getUserById:', e);
              return null;
            }
          }},
          // Try learner_profiles table
          { name: 'learner_profiles', method: async () => {
            if (!supabase) return null;
            const { data, error } = await supabase.from('learner_profiles').select('*').eq('user_id', userId).single();
            if (error) throw error;
            return data;
          }},
          // Try user_profiles table
          { name: 'user_profiles', method: async () => {
            if (!supabase) return null;
            const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
          }},
          // Try profiles table
          { name: 'profiles', method: async () => {
            if (!supabase) return null;
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
          }},
          // Try users table
          { name: 'users', method: async () => {
            if (!supabase) return null;
            const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
          }}
        ];
        
        for (const table of tables) {
          try {
            const data = await table.method();
            if (data) {
              console.log(`Successfully fetched profile data from '${table.name}' table:`);
              console.log(JSON.stringify(data, null, 2));
              profileData = data as UserProfile;
              break;
            }
          } catch (error) {
            console.error(`Error fetching from ${table.name}:`, error);
          }
        }
        
        if (profileData) {
          // Update mock data with real user profile
          dashboardData.profile = {
            ...dashboardData.profile,
            id: profileData.id || profileData.user_id || userId,
            name: profileData.name || profileData.full_name || profileData.username || profileData.email || dashboardData.profile.name,
            email: profileData.email || dashboardData.profile.email,
            role: profileData.role || 'learner',
            department: profileData.department || dashboardData.profile.department,
            position: profileData.position || profileData.job_title || dashboardData.profile.position,
            avatar: profileData.avatar_url || profileData.avatar || null
          };
        } else {
          throw new Error('Could not find user profile in any table');
        }
        
        // Try to get courses
        try {
          if (!supabase) throw new Error('Supabase client not initialized');
          
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .limit(10);
          
          if (coursesError) throw coursesError;
          
          if (coursesData && coursesData.length > 0) {
            console.log(`Successfully fetched ${coursesData.length} real courses`);
            dashboardData.courses.items = coursesData.map(course => ({
              id: course.id,
              title: course.title,
              description: course.description,
              duration: course.duration || '1 hour',
              thumbnail_url: course.thumbnail_url,
              progress: 0,
              hr_assigned: false
            }));
            dashboardData.courses.total = coursesData.length;
            dashboardData.courses.notStarted = coursesData.length;
            
            if (coursesData.length > 0 && !dashboardData.courses.featured) {
              dashboardData.courses.featured = {
                ...coursesData[0],
                progress: 0,
                completed_sections: 0,
                total_sections: 5
              };
            }
          }
        } catch (error) {
          console.error('Error fetching real courses data:', error);
        }
        
        // Try to get learning paths
        try {
          if (!supabase) throw new Error('Supabase client not initialized');
          
          const { data: pathsData, error: pathsError } = await supabase
            .from('learning_paths')
            .select('*')
            .limit(5);
          
          if (pathsError) throw pathsError;
          
          if (pathsData && pathsData.length > 0) {
            console.log(`Successfully fetched ${pathsData.length} real learning paths`);
            dashboardData.learningPaths = pathsData.map(path => ({
              id: path.id,
              title: path.title,
              description: path.description,
              courses: path.course_count || 3,
              progress: 0,
              completed: false
            }));
          }
        } catch (error) {
          console.error('Error fetching real learning paths data:', error);
        }
        
      } catch (error) {
        console.error('Could not find user profile in any table:', error);
      }
    }
    
    // Return the dashboard data (either mock or real) with explicit content-type
    console.log('Returning dashboard data for user', userId);
    
    // Set these headers explicitly for this response
    res.set({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma'
    });
    
    res.json(dashboardData);
    return;
    
  } catch (error) {
    console.error('Error processing dashboard request:', error);
    
    // Set headers for error response too
    res.set({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      timestamp: new Date().toISOString()
    });
    return;
  }
});

// Logging helper function (consider moving to a shared utils file)
const logWithTimestamp = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const reqIdText = requestId ? `[ReqID:${requestId}] ` : '';
  const logPrefix = `[${timestamp}] [EXPRESS-REGENERATE] ${reqIdText}`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

// Common logic for processing regeneration
async function processContentRegenerationExpress(
  req: Request,
  res: Response,
  courseId: string,
  userId: string,
  forceRegenerate: boolean = true,
  personalizationOptions: any = {},
  requestId: string
) {
  logWithTimestamp(`🚀 Starting content regeneration process for course: ${courseId}`, undefined, requestId);
  
  if (!supabase || !supabaseAdmin) {
      logWithTimestamp(`❌ Supabase client not initialized`, undefined, requestId);
      return res.status(500).json({ error: 'Server configuration error: Supabase not initialized' });
  }

  // Create or update learner profile with these options
  if (personalizationOptions && Object.keys(personalizationOptions).length > 0) {
    logWithTimestamp(`📝 Updating learner profile for user: ${userId.substring(0, 8)}...`, undefined, requestId);
    const { error } = await supabase
      .from('learner_profiles')
      .upsert({ user_id: userId, ...personalizationOptions });
    if (error) logWithTimestamp(`❌ Error updating learner profile:`, error, requestId);
    else logWithTimestamp(`✅ Learner profile updated successfully`, undefined, requestId);
  }
  
  let targetEmployeeId = userId;
  logWithTimestamp(`🔍 Looking up employee mapping for user: ${userId.substring(0, 8)}...`, undefined, requestId);
  const { data: mappingData, error: mappingError } = await supabase
    .from('employee_user_mapping')
    .select('employee_id')
    .eq('user_id', userId)
    .single();
  
  if (mappingData?.employee_id) {
    targetEmployeeId = mappingData.employee_id;
    logWithTimestamp(`✅ Found employee mapping: ${targetEmployeeId.substring(0, 8)}...`, undefined, requestId);
  } else {
    logWithTimestamp(`⚠️ No employee mapping found, using user ID as employee ID`, undefined, requestId);
  }
  
  logWithTimestamp(`🔍 Verifying course exists: ${courseId}`, undefined, requestId);
  const { data: courseData, error: courseError } = await supabase
    .from('hr_courses')
    .select('*')
    .eq('id', courseId)
    .single();
    
  if (courseError || !courseData) {
    logWithTimestamp(`❌ Error fetching course:`, courseError, requestId);
    return res.status(404).json({ error: 'Course not found', details: courseError?.message });
  }
  logWithTimestamp(`✅ Course verified: ${courseData.title}`, undefined, requestId);
  
  logWithTimestamp(`🔍 Checking for existing jobs for course: ${courseId} and employee: ${targetEmployeeId}`, undefined, requestId);
  const { data: existingJobs, error: jobQueryError } = await supabaseAdmin
    .from('content_generation_jobs')
    .select('*')
    .eq('course_id', courseId)
    .eq('employee_id', targetEmployeeId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (jobQueryError) {
    logWithTimestamp(`⚠️ Error checking for existing jobs:`, jobQueryError, requestId);
  } else if (existingJobs && existingJobs.length > 0) {
    const existingJob = existingJobs[0];
    logWithTimestamp(`✅ Found existing ${existingJob.status} job: ${existingJob.id}`, undefined, requestId);
    await supabaseAdmin
      .from('content_generation_jobs')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', existingJob.id);
      
    logWithTimestamp(`🔄 Returning existing job ID: ${existingJob.id}`, undefined, requestId);
    return res.json({
      success: true,
      message: `Reusing existing ${existingJob.status} job`,
      job_id: existingJob.id,
      status: existingJob.status,
      current_step: existingJob.current_step,
      progress: existingJob.progress
    });
  }
  
  const jobId = uuidv4();
  logWithTimestamp(`📝 Creating job record with ID: ${jobId}`, undefined, requestId);
  
  const { error: jobError } = await supabaseAdmin
    .from('content_generation_jobs')
    .insert({
      id: jobId,
      course_id: courseId,
      employee_id: targetEmployeeId,
      status: 'in_progress',
      total_steps: 10,
      current_step: 1,
      progress: 0,
      step_description: 'Initializing content generation process',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { personalization_options: personalizationOptions }
    });
    
  if (jobError) {
    logWithTimestamp(`❌ Error creating job record:`, jobError, requestId);
    return res.status(500).json({ error: 'Failed to create job record', details: jobError.message });
  }
  logWithTimestamp(`✅ Job record created successfully, ID: ${jobId}`, undefined, requestId);
  
  // Placeholder content generation (adapt as needed from original logic)
  const contentOutline = { /* ... simplified placeholder structure ... */ }; 
  const personalizedContent = { /* ... simplified placeholder structure ... */ };

  const { error: storageError } = await supabase
    .from('hr_personalized_course_content')
    .insert({
        // Ensure this matches your table schema
        id: jobId, 
        course_id: courseId,
        employee_id: targetEmployeeId,
        content: personalizedContent, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true 
    });
    
  if (storageError) {
    logWithTimestamp(`❌ Error storing placeholder content:`, storageError, requestId);
    // Don't fail the request, but log the error
  }

  // Mark job as completed (or trigger async process here if needed)
  await supabaseAdmin
    .from('content_generation_jobs')
    .update({
      status: 'completed', // Or 'pending' if async
      current_step: 10,
      step_description: 'Placeholder content generated successfully',
      progress: 100,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString() // Or null if async
    })
    .eq('id', jobId);
    
  return res.json({
    success: true,
    message: 'Course content regeneration started successfully (Placeholder)',
    job_id: jobId,
  });
}

// --- Express Route Handler Function ---
// @ts-expect-error: Express async handler type limitation
app.all('/api/hr/courses/regenerate-content', async (req, res) => {
  const requestId = uuidv4().slice(0, 8);
  logWithTimestamp(`📩 Request received: ${req.method} ${req.path}`, undefined, requestId);

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
      logWithTimestamp(`↩️ Responding to OPTIONS request`, undefined, requestId);
      // Add CORS headers specifically for the OPTIONS preflight response
      res.setHeader('Access-Control-Allow-Origin', '*'); 
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      // ADD Cache-Control and Pragma here as well for consistency
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).send();
  }

  if (!supabase) {
    logWithTimestamp(`❌ Supabase client not ready`, undefined, requestId);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    let userId: string | undefined;
    let courseId: string | undefined;
    let forceRegenerate: boolean = true;
    let personalizationOptions: any = {};
    
    // Authentication: Prioritize Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      logWithTimestamp(`🔐 Attempting Bearer token auth`, undefined, requestId);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
        logWithTimestamp(`✅ Authenticated with Bearer token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
      } else {
         logWithTimestamp(`❌ Bearer token auth failed:`, error, requestId);
      }
    }
    
    // If no token auth, try access_token from query (for GET) or body (for POST fallback)
    if (!userId) {
        const accessToken = req.query.access_token as string || req.body?.access_token as string;
        if (accessToken) {
            logWithTimestamp(`🔐 Attempting access_token auth (from ${req.method === 'GET' ? 'query' : 'body'})`, undefined, requestId);
            const { data, error } = await supabase.auth.getUser(accessToken);
             if (!error && data.user) {
                userId = data.user.id;
                logWithTimestamp(`✅ Authenticated with access_token for user: ${userId?.substring(0, 8)}...`, undefined, requestId);
            } else {
                logWithTimestamp(`❌ access_token auth failed:`, error, requestId);
            }
        }
    }

    if (!userId) {
      logWithTimestamp(`❌ Authentication failed`, undefined, requestId);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get parameters based on method
    if (req.method === 'GET') {
        courseId = req.query.courseId as string;
        forceRegenerate = req.query.forceRegenerate !== 'false';
        try {
            const optionsParam = req.query.personalizationOptions as string;
            if (optionsParam) personalizationOptions = JSON.parse(optionsParam);
        } catch (e) {
            logWithTimestamp(`⚠️ Failed to parse personalizationOptions from query:`, e, requestId);
        }
    } else if (req.method === 'POST') {
        courseId = req.body?.courseId;
        forceRegenerate = req.body?.forceRegenerate !== false;
        personalizationOptions = req.body?.personalizationOptions || {};
    } else {
         logWithTimestamp(`❌ Method not allowed: ${req.method}`, undefined, requestId);
         // Set Allow header for 405
         res.setHeader('Allow', 'GET, POST, OPTIONS');
         return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!courseId) {
      logWithTimestamp(`❌ Missing courseId`, undefined, requestId);
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Process the request using the common logic function
    return await processContentRegenerationExpress(req, res, courseId, userId, forceRegenerate, personalizationOptions, requestId);

  } catch (error: any) {
    logWithTimestamp(`❌ Unexpected error in route handler:`, error, requestId);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Handle all OPTIONS requests for CORS preflight
app.options('*', cors(corsOptions));

// Fallback for all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    status: 404,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    status: 500,
    timestamp: new Date().toISOString()
  });
});

// Start server with port fallback mechanism
const startServer = (port: number, maxRetries: number = 3) => {
  const server = app.listen(port)
    .on('error', (error: any) => {
      if (error.code === 'EADDRINUSE' && maxRetries > 0) {
        console.warn(`⚠️ Port ${port} is already in use, trying ${port + 1}...`);
        server.close();
        startServer(port + 1, maxRetries - 1);
      } else {
        console.error(`❌ Failed to start server:`, error);
        process.exit(1);
      }
    })
    .on('listening', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`✅ API Server listening on port ${actualPort}`);
      
      // Set up graceful shutdown
      process.on('SIGINT', () => {
        console.log('Gracefully shutting down API server...');
        server.close(() => {
          console.log('API server closed');
          process.exit(0);
        });
      });
    });
    
  return server;
};

// Start the server with the preferred port
startServer(PORT);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 