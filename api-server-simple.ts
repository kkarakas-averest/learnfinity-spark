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
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/debug', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API server is running correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Learner Dashboard Endpoint ---
// @ts-ignore - Suppress TypeScript error for Express route handler
app.get('/api/learner/dashboard', (req, res) => {
  console.log("Received request for /api/learner/dashboard");
  const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
  if (!userId) {
    console.error("User ID is required for dashboard data");
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  // Send mock data
  res.json({
    profile: {
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
    },
    courses: {
      total: 2,
      inProgress: 1,
      completed: 0,
      notStarted: 1,
      hrAssigned: 1,
      featured: {
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
      items: [
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
      ]
    },
    learningPaths: [
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
    ],
    completedCourses: 0,
    inProgressCourses: 1,
    stats: {
      coursesCompleted: 5,
      coursesInProgress: 2,
      learningPathsCompleted: 1,
      learningPathsInProgress: 1,
      assignedCourses: 3,
      skillsAcquired: 7,
      totalHours: 24
    },
    achievements: {
      certificates: [],
      badges: []
    }
  });
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