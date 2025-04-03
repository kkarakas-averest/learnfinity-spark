import express from 'express';
import cors from 'cors';
import { getSupabase } from './src/lib/supabase.js'; // Corrected path
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  getLearnerDashboardData,
  getCoursesData,
  getLearningPathsData,
  getAchievementsData,
  getProfileData
} from './src/services/learnerDashboardService.js'; // Corrected path
import { getLearnerCourses } from './src/services/learnerCourseService.js'; // Corrected path
import { getLearnerLearningPaths } from './src/services/learnerLearningPathService.js'; // Corrected path
import { getLearnerAchievements } from './src/services/learnerAchievementService.js'; // Corrected path
import { getLearnerProfile } from './src/services/learnerProfileService.js'; // Corrected path

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.API_PORT || 3083;

// Use the singleton Supabase client
const supabase = getSupabase();

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

// API Routes

// Helper function for error handling
const handleApiError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({
    error: message,
    details: error instanceof Error ? error.message : String(error),
    status: statusCode
  });
};

// Learner Dashboard Endpoint
app.get('/api/learner/dashboard', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required', status: 400 });
  }

  try {
    const dashboardData = await getLearnerDashboardData(userId);
    res.json(dashboardData);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch learner dashboard data');
  }
});

// Courses Endpoint
app.get('/api/learner/courses', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required', status: 400 });
  }

  try {
    const coursesData = await getCoursesData(userId);
    res.json(coursesData);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch courses data');
  }
});

// Learning Paths Endpoint
app.get('/api/learner/learning-paths', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required', status: 400 });
  }

  try {
    const pathsData = await getLearningPathsData(userId);
    res.json(pathsData);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch learning paths data');
  }
});

// Achievements Endpoint
app.get('/api/learner/achievements', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required', status: 400 });
  }

  try {
    const achievementsData = await getAchievementsData(userId);
    res.json(achievementsData);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch achievements data');
  }
});

// Profile Endpoint
app.get('/api/learner/profile', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required', status: 400 });
  }

  try {
    const profileData = await getProfileData(userId);
    res.json(profileData);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch profile data');
  }
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'An unexpected error occurred'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API Server listening on port ${PORT}`);
}); 