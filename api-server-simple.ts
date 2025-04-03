import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

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
app.get('/api/debug', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Learner Dashboard Endpoint ---
app.get('/api/learner/dashboard', (req, res) => {
  console.log("Received request for /api/learner/dashboard");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for dashboard data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Send mock data
  res.json({
    courses: [],
    learningPaths: [],
    completedCourses: 0,
    inProgressCourses: 0,
    achievements: {
      certificates: [],
      badges: []
    }
  });
});

// --- Courses Endpoint ---
app.get('/api/learner/courses', (req, res) => {
  console.log("Received request for /api/learner/courses");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for courses data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json([]);
});

// --- Learning Paths Endpoint ---
app.get('/api/learner/learning-paths', (req, res) => {
  console.log("Received request for /api/learner/learning-paths");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for learning paths data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json([]);
});

// --- Achievements Endpoint ---
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
app.get('/api/learner/profile', (req, res) => {
  console.log("Received request for /api/learner/profile");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for profile data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  res.json({
    id: userId,
    name: "Test User",
    email: "test@example.com",
    role: "learner"
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