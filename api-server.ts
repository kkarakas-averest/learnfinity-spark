import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getSupabase } from './src/lib/supabase.ts'; // Corrected path and extension
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

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

// --- Learner Dashboard Endpoint --- (Temporarily disabled)
app.get('/api/learner/dashboard', async (req: Request, res: Response) => {
  console.log("Received request for /api/learner/dashboard");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for dashboard data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  /* // Original logic commented out
  try {
    console.log(`Fetching dashboard data for userId: ${userId}`);
    const data = await getLearnerDashboardData(userId); // This function doesn't exist yet
    console.log("Successfully fetched dashboard data");
    res.json(data);
  } catch (error) {
    console.error('Error fetching learner dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch learner dashboard data' });
  }
  */
  res.status(501).json({ message: "Endpoint temporarily disabled" }); 
});

// --- Courses Endpoint --- (Temporarily disabled)
app.get('/api/learner/courses', async (req: Request, res: Response) => {
  console.log("Received request for /api/learner/courses");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for courses data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  /* // Original logic commented out
  try {
    console.log(`Fetching courses for userId: ${userId}`);
    const data = await getLearnerCourses(userId); // This function doesn't exist yet
    console.log("Successfully fetched courses data");
    res.json(data);
  } catch (error) {
    console.error('Error fetching learner courses:', error);
    res.status(500).json({ error: 'Failed to fetch learner courses' });
  }
  */
   res.status(501).json({ message: "Endpoint temporarily disabled" });
});

// --- Learning Paths Endpoint --- (Temporarily disabled)
app.get('/api/learner/learning-paths', async (req: Request, res: Response) => {
  console.log("Received request for /api/learner/learning-paths");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for learning paths data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  /* // Original logic commented out
  try {
    console.log(`Fetching learning paths for userId: ${userId}`);
    const data = await getLearnerLearningPaths(userId); // This function doesn't exist yet
    console.log("Successfully fetched learning paths data");
    res.json(data);
  } catch (error) {
    console.error('Error fetching learner learning paths:', error);
    res.status(500).json({ error: 'Failed to fetch learner learning paths' });
  }
  */
   res.status(501).json({ message: "Endpoint temporarily disabled" });
});

// --- Achievements Endpoint --- (Temporarily disabled)
app.get('/api/learner/achievements', async (req: Request, res: Response) => {
  console.log("Received request for /api/learner/achievements");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for achievements data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  /* // Original logic commented out
  try {
    console.log(`Fetching achievements for userId: ${userId}`);
    const data = await getLearnerAchievements(userId); // This function doesn't exist yet
    console.log("Successfully fetched achievements data");
    res.json(data);
  } catch (error) {
    console.error('Error fetching learner achievements:', error);
    res.status(500).json({ error: 'Failed to fetch learner achievements' });
  }
  */
   res.status(501).json({ message: "Endpoint temporarily disabled" });
});

// --- Profile Endpoint --- (Temporarily disabled)
app.get('/api/learner/profile', async (req: Request, res: Response) => {
  console.log("Received request for /api/learner/profile");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for profile data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  /* // Original logic commented out
  try {
    console.log(`Fetching profile for userId: ${userId}`);
    const data = await getLearnerProfile(userId); // This function doesn't exist yet
    console.log("Successfully fetched profile data");
    res.json(data);
  } catch (error) {
    console.error('Error fetching learner profile:', error);
    res.status(500).json({ error: 'Failed to fetch learner profile' });
  }
  */
   res.status(501).json({ message: "Endpoint temporarily disabled" });
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