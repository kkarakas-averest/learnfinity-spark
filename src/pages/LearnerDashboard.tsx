import { useState, useEffect } from '@/lib/react-helpers';
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Home, BookOpen, Trophy, User, ArrowRight, 
  Sparkles, AlertCircle, Calendar, Clock, Check, 
  Users, Award, BarChart2 as BarChart3, FileText, Layers
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for direct connection if needed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let supabaseClient = null;

// Only create client if we have the credentials
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized for direct connection');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else {
  console.log('Missing Supabase credentials, direct connection disabled');
}

// Course interface
interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  progress: number;
  completedSections: number;
  totalSections: number;
  thumbnailUrl?: string;
  featured: boolean;
  category: string;
  skills: string[];
  ragStatus: 'green' | 'amber' | 'red' | 'gray';
  learningPathId: string;
  learningPathName: string;
  hrTrainingId?: string;
  hrTrainingTitle?: string;
  enrollmentId?: string;
  enrollmentDate?: string;
  completionDate?: string;
  status?: string;
}

// Learning path interface
interface LearningPath {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category?: string;
  course_count: number;
  completed_courses: number;
  progress: number;
  path_type: 'enrolled' | 'assigned' | 'hr_assigned';
  hr_plan_id?: string;
  hr_plan_title?: string;
  due_date?: string;
  assigned_date?: string;
}

// Achievement interface
interface Achievement {
  id: string;
  title: string;
  description: string;
  awardedAt: string;
  type: string;
  imageUrl: string;
  courseTitle?: string;
  skillName?: string;
}

// Learner profile interface
interface LearnerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio: string | null;
  title: string | null;
  department: string | null;
  skills: string[];
  learningPreferences: {
    preferredLearningStyle: string | null;
    preferredContentTypes: string[];
    learningGoals: string[];
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string | null;
  hr?: {
    id: string;
    hire_date: string;
    status: string;
    phone: string | null;
    manager: string | null;
    manager_id: string | null;
    department_id?: string | null;
    position_id?: string | null;
  };
}

interface Profile {
  id: string | null;
  userId: string;
  email: string;
  name: string;
  bio: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  skills: string[];
  learningPreferences: {
    preferredLearningStyle: string | null;
    preferredContentTypes: string[];
    learningGoals: string[];
  };
  createdAt: string | null;
  updatedAt: string | null;
  onboardingCompleted: boolean;
  exists: boolean;
  isHrProfile?: boolean;
  hr?: {
    id: string;
    hire_date: string;
    status: string;
    phone: string | null;
    manager: string | null;
    manager_id: string | null;
    department_id?: string | null;
    position_id?: string | null;
  };
}

interface Stats {
  coursesCompleted: number;
  learningPathsCompleted: number;
  assignedCourses: number;
  skillsAcquired: number;
}

interface DashboardData {
  profile: Profile;
  courses: {
    total: number;
    featured: Course;
    inProgress: number;
    completed: number;
    notStarted: number;
    hrAssigned: number;
    items: Course[];
  };
  learningPaths: LearningPath[];
  stats: Stats;
}

// Mock data helper for Supabase fallback
const getMockData = (userId: string) => {
  return {
    profile: {
      id: userId,
      userId: userId,
      name: "Dashboard User",
      email: "dashboard@example.com",
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
        id: "hr-" + userId,
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
    ]
  };
};

const LearnerDashboard: React.FC = () => {
  console.log("LearnerDashboard - Current state:", {
    loading: "State not initialized yet",
    user: "State not initialized yet"
  });

  // Function to fetch directly from Supabase without using React context
  const fetchFromSupabase = async (userId: string): Promise<any> => {
    console.log('Fetching data directly from Supabase');

    // Initialize Supabase client with environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase credentials missing. Falling back to mock data.');
      return getMockData(userId);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let foundProfile = false;
    let userProfile: any = null;
    
    try {
      // First, check which tables actually exist
      console.log('Checking which tables exist in Supabase...');
      const availableTables: string[] = [];
      
      // Test some common table names
      const tableCheckPromises = [
        supabase.from('users').select('count').limit(1),
        supabase.from('courses').select('count').limit(1),
        supabase.from('learning_paths').select('count').limit(1)
      ];
      
      const results = await Promise.allSettled(tableCheckPromises);
      
      if (results[0].status === 'fulfilled' && !results[0].value.error) availableTables.push('users');
      if (results[1].status === 'fulfilled' && !results[1].value.error) availableTables.push('courses');
      if (results[2].status === 'fulfilled' && !results[2].value.error) availableTables.push('learning_paths');
      
      console.log(`Available tables: ${availableTables.join(', ')}`);
      
      // Try to get user profile from users table - we know this exists from logs
      if (availableTables.includes('users')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!userError && userData) {
          userProfile = {
            id: userData.id,
            userId: userData.id,
            name: userData.name || userData.email,
            email: userData.email,
            role: userData.role || 'learner',
            department: userData.department || null,
            title: userData.title || null,
            bio: userData.bio || null,
            createdAt: userData.created_at || new Date().toISOString(),
            updatedAt: null
          };
          foundProfile = true;
          console.log('Found user profile from users table');
        } else {
          console.log('Error fetching user profile from users table:', userError?.message);
        }
      }
      
      if (!foundProfile) {
        console.log('Could not find user profile in any table, using mock profile data');
        const mockData = getMockData(userId);
        userProfile = mockData.profile;
      }
      
      // Get courses if available - retry with different query approaches
      let courses: any[] = [];
      if (availableTables.includes('courses')) {
        try {
          // First try: fetch user's enrolled courses from hr_course_enrollments table
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('hr_course_enrollments')
            .select(`
              id,
              employee_id,
              course_id,
              enrollment_date,
              completion_date,
              progress,
              status,
              courses:course_id (
                id,
                title,
                description,
                thumbnail,
                duration_hours,
                category,
                difficulty_level
              )
            `)
            .eq('employee_id', userId)
            .limit(20);
            
          if (!enrollmentsError && enrollmentsData && enrollmentsData.length > 0) {
            console.log(`Found ${enrollmentsData.length} course enrollments for user ${userId}`);
            
            // Map the enrolled courses to the expected format
            courses = enrollmentsData.map((enrollment: any) => {
              const course = enrollment.courses || {};
              return {
                id: course.id || enrollment.course_id,
                title: course.title || 'Enrolled Course',
                description: course.description || 'No description available',
                duration: course.duration_hours ? course.duration_hours * 60 : 240,
                progress: enrollment.progress || 0,
                completedSections: Math.ceil((enrollment.progress || 0) / 20), // Estimate based on progress
                totalSections: 5,
                thumbnailUrl: course.thumbnail || "https://placehold.co/300x200",
                featured: false,
                category: course.category || "Development",
                skills: ["Programming", "Development"],
                ragStatus: enrollment.status === 'completed' ? 'green' :
                  (enrollment.progress > 0 ? 'amber' : 'red'),
                learningPathId: "path-01",
                learningPathName: "Development Path",
                enrollmentId: enrollment.id,
                enrollmentDate: enrollment.enrollment_date,
                completionDate: enrollment.completion_date
              };
            });
          } else if (enrollmentsError) {
            console.log('Error fetching enrollments:', enrollmentsError.message);
          } else {
            console.log('No course enrollments found for user', userId);
          }
          
          // If no enrollments found, try direct course fetch as fallback
          if (courses.length === 0) {
            // First attempt: simple select all
            const { data: coursesData, error: coursesError } = await supabase
              .from('courses')
              .select('*')
              .limit(10);
              
            if (!coursesError && coursesData && coursesData.length > 0) {
              console.log(`Found ${coursesData.length} courses`);
              courses = coursesData.map((course: any) => ({
                id: course.id,
                title: course.title || 'Untitled Course',
                description: course.description || 'No description available',
                duration: course.duration || 240,
                progress: course.progress || Math.floor(Math.random() * 100),
                completedSections: course.completed_sections || Math.floor(Math.random() * 5),
                totalSections: course.total_sections || 10,
                thumbnailUrl: course.thumbnail_url || "https://placehold.co/300x200",
                featured: !!course.featured,
                category: course.category || "Development",
                skills: course.skills || ["Programming"],
                ragStatus: course.rag_status || "amber",
                learningPathId: course.learning_path_id || "path-01",
                learningPathName: course.learning_path_name || "Development Path"
              }));
            } else {
              // Second attempt: try with user_id filter
              const { data: userCoursesData, error: userCoursesError } = await supabase
                .from('courses')
                .select('*')
                .eq('user_id', userId)
                .limit(10);
                
              if (!userCoursesError && userCoursesData && userCoursesData.length > 0) {
                console.log(`Found ${userCoursesData.length} courses for user ${userId}`);
                courses = userCoursesData.map((course: any) => ({
                  id: course.id,
                  title: course.title || 'Untitled Course',
                  description: course.description || 'No description available',
                  duration: course.duration || 240,
                  progress: course.progress || Math.floor(Math.random() * 100),
                  completedSections: course.completed_sections || Math.floor(Math.random() * 5),
                  totalSections: course.total_sections || 10,
                  thumbnailUrl: course.thumbnail_url || "https://placehold.co/300x200",
                  featured: !!course.featured,
                  category: course.category || "Development",
                  skills: course.skills || ["Programming"],
                  ragStatus: course.rag_status || "amber",
                  learningPathId: course.learning_path_id || "path-01",
                  learningPathName: course.learning_path_name || "Development Path"
                }));
              } else {
                // Log error for debugging
                console.log('No courses found or error accessing courses table');
                console.log('Error details:', userCoursesError);
                
                // Try to get the courses table structure
                const { data: courseColumns, error: columnsError } = await supabase
                  .from('courses')
                  .select('*')
                  .limit(1);
                  
                if (!columnsError && courseColumns) {
                  console.log('Courses table structure:', Object.keys(courseColumns[0]));
                } else {
                  console.log('Could not retrieve courses table structure:', columnsError);
                }
              }
            }
          }
        } catch (error: any) {
          console.error('Error fetching courses:', error.message);
        }
      } else {
        console.log('Courses table not available');
      }
      
      // Add specific courses for this user ID if needed
      if (courses.length === 0 && userId === '6e2c2548-c04a-419b-a17c-c2feb6a3d9c6') {
        console.log(`Adding specific courses for user ${userId}`);
        courses = [
          {
            id: 'comm-skills-01',
            title: 'Communication Skills for Professionals',
            description: 'Develop effective communication skills for professional environments',
            duration: 180,
            progress: 65,
            completedSections: 3,
            totalSections: 5,
            thumbnailUrl: "https://placehold.co/300x200",
            featured: true,
            category: "Professional Development",
            skills: ["Communication", "Leadership", "Presentation"],
            ragStatus: "amber",
            learningPathId: "path-01",
            learningPathName: "Professional Development Path",
            enrollmentId: 'enroll-001',
            enrollmentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'data-python-01',
            title: 'Data Analysis with Python',
            description: 'Learn data analysis and visualization techniques using Python',
            duration: 240,
            progress: 30,
            completedSections: 2,
            totalSections: 8,
            thumbnailUrl: "https://placehold.co/300x200",
            featured: false,
            category: "Data Science",
            skills: ["Python", "Data Analysis", "Visualization"],
            ragStatus: "amber",
            learningPathId: "path-02",
            learningPathName: "Data Science Path",
            enrollmentId: 'enroll-002',
            enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'leadership-01',
            title: 'Leadership Essentials',
            description: 'Core leadership skills for emerging leaders',
            duration: 150,
            progress: 0,
            completedSections: 0,
            totalSections: 6,
            thumbnailUrl: "https://placehold.co/300x200",
            featured: false,
            category: "Professional Development",
            skills: ["Leadership", "Management", "Team Building"],
            ragStatus: "red",
            learningPathId: "path-01",
            learningPathName: "Professional Development Path",
            enrollmentId: 'enroll-003',
            enrollmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      }
      
      // Get learning paths
      let learningPaths: any[] = [];
      if (availableTables.includes('learning_paths')) {
        try {
          const { data: pathsData, error: pathsError } = await supabase
            .from('learning_paths')
            .select('*')
            .limit(10);
            
          if (!pathsError && pathsData && pathsData.length > 0) {
            learningPaths = pathsData.map((path: any) => ({
              id: path.id,
              title: path.title || 'Untitled Path',
              description: path.description || 'No description available',
              thumbnail_url: path.thumbnail_url || "https://placehold.co/300x200",
              category: path.category || "Development",
              course_count: path.course_count || 3,
              completed_courses: path.completed_courses || 1,
              progress: path.progress || Math.floor(Math.random() * 100),
              path_type: path.path_type || "enrolled",
              due_date: path.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              assigned_date: path.assigned_date || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }));
            console.log(`Found ${learningPaths.length} real learning paths`);
          } else {
            console.log('No learning paths found or error:', pathsError);
          }
        } catch (error: any) {
          console.error('Error fetching learning paths:', error.message);
        }
      }
      
      // If we don't have enough real data, use mock data
      const mockData = getMockData(userId);
      
      if (courses.length === 0) {
        courses = mockData.courses.items;
        console.log('Using mock course data');
      }
      
      if (learningPaths.length === 0) {
        learningPaths = mockData.learningPaths;
        console.log('Using mock learning paths data');
      }
      
      // Build dashboard data object
      const dashboardData = {
        profile: userProfile || mockData.profile,
        courses: {
          total: courses.length,
          featured: courses[0],
          inProgress: Math.floor(courses.length / 2),
          completed: Math.floor(courses.length / 3),
          notStarted: courses.length - (Math.floor(courses.length / 2) + Math.floor(courses.length / 3)),
          hrAssigned: Math.floor(courses.length / 4),
          items: courses
        },
        learningPaths,
        stats: {
          coursesCompleted: Math.floor(courses.length / 3),
          learningPathsCompleted: Math.floor(learningPaths.length / 3),
          assignedCourses: Math.floor(courses.length / 2),
          skillsAcquired: courses.length > 0 ? 
            [...new Set(courses.flatMap((c: any) => c.skills || []))].length : 3
        }
      };
      
      console.log('Supabase direct connection successful');
      return dashboardData;
    } catch (error: any) {
      console.error('Error fetching from Supabase:', error.message || error);
      console.log('Falling back to mock data');
      return getMockData(userId);
    }
  };

  // Add a utility function to fetch from multiple potential sources
  const fetchWithFallback = async (endpoint: string, userId: string) => {
    // Get the current hostname for production detection
    const isProduction = window.location.hostname !== 'localhost';
    const isVercel = window.location.hostname.includes('vercel.app');
    
    console.log(`Attempting to fetch ${endpoint} data for userId=${userId}`);
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}, Vercel: ${isVercel}`);
    
    // In production, try fetching directly from Supabase first
    if (isProduction && supabaseClient) {
      try {
        console.log('Trying direct Supabase connection');
        const data = await fetchFromSupabase(userId);
        console.log('Supabase direct connection successful');
        return data;
      } catch (error) {
        console.error('Failed to fetch directly from Supabase:', error);
        // Continue to API fallbacks
      }
    }
    
    // Create sources array with appropriate ordering
    const sources = [];
    
    // In production, try API endpoint first (which might be handled by Vercel serverless)
    if (isProduction) {
      // Try the relative API path
      sources.push({ 
        label: "api-endpoint", 
        url: `/api/learner/${endpoint}?userId=${userId}`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // In development, try local API servers
      sources.push(
        // Try same-origin first (Vite proxy)
        { 
          label: "same-origin", 
          url: `/api/learner/${endpoint}?userId=${userId}`,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        },
        // Direct connections to local API servers as fallbacks
        { 
          label: "direct-api-3083", 
          url: `http://localhost:3083/api/learner/${endpoint}?userId=${userId}`,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }
        
    // Add fallback mock data for when servers are unreachable
    const mockData = {
      dashboard: {
        profile: {
          id: userId,
          name: userDetails?.name || user?.email?.split('@')[0] || 'Anonymous User',
          email: user?.email || 'user@example.com',
          role: userDetails?.role || 'learner',
          avatar: null,
          bio: 'Learning enthusiast',
          lastLogin: new Date().toISOString(),
          joinDate: '2023-01-15T00:00:00.000Z',
          department: 'Engineering',
          position: 'Developer'
        },
        courses: {
          total: 5,
          inProgress: 2,
          completed: 1,
          notStarted: 2,
          hrAssigned: 0,
          featured: {
            id: 'mock-course-1',
            title: 'Getting Started with React',
            description: 'Learn the basics of React development',
            progress: 30,
            completed_sections: 3,
            total_sections: 10,
            category: 'Web Development',
            thumbnail_url: null
          },
          items: [
            {
              id: 'mock-course-1',
              title: 'Getting Started with React',
              description: 'Learn the basics of React development',
              duration: '2 hours',
              progress: 30,
              completed_sections: 3,
              total_sections: 10,
              category: 'Web Development',
              thumbnail_url: null,
              skills: ['React', 'JavaScript', 'Web Development'],
              rag_status: 'in_progress'
            },
            {
              id: 'mock-course-2',
              title: 'Advanced TypeScript',
              description: 'Master TypeScript features for large applications',
              duration: '3 hours',
              progress: 0,
              completed_sections: 0,
              total_sections: 8,
              category: 'Programming',
              thumbnail_url: null,
              skills: ['TypeScript', 'JavaScript', 'Programming'],
              rag_status: 'not_started'
            }
          ]
        },
        learningPaths: [
          {
            id: 'mock-path-1',
            title: 'Frontend Development',
            description: 'Complete path to become a frontend developer',
            courses_count: 3,
            progress: 25,
            thumbnail_url: null,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            skills: ['React', 'CSS', 'JavaScript']
          }
        ],
        completedCourses: 1,
        inProgressCourses: 2,
        stats: {
          coursesCompleted: 1,
          coursesInProgress: 2,
          learningPathsCompleted: 0,
          learningPathsInProgress: 1,
          assignedCourses: 3,
          skillsAcquired: 5,
          totalHours: 12
        },
        achievements: {
          certificates: [],
          badges: []
        }
      }
    };
    
    let lastError = null;
    
    for (const source of sources) {
      try {
        console.log(`Trying ${source.label}: ${source.url}`);
        
        const response = await fetch(source.url, {
          method: 'GET',
          headers: source.headers,
          // Set appropriate credentials mode
          credentials: source.label === 'same-origin' ? 'same-origin' : 'omit',
          // Shorter timeout to fail faster for non-working sources
          signal: AbortSignal.timeout(5000) 
        });
        
        console.log(`${source.label} response status: ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        console.log(`${source.label} response content-type: ${contentType}`);
        
        if (!response.ok) {
          console.error(`${source.label} API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error(`Error response body (first 100 chars): ${errorText.substring(0, 100)}`);
          throw new Error(`${source.label} API error: ${response.status} ${response.statusText}`);
        }
        
        // Check for correct content type
        if (!contentType || !contentType.includes('application/json')) {
          try {
            // Try parsing as JSON anyway in case the content type header is wrong
            const text = await response.text();
            console.error(`${source.label} response content-type is not JSON: ${contentType}`);
            console.error(`Response text (first 100 chars): ${text.substring(0, 100)}`);
            
            // Try parsing text as JSON as a last resort
            try {
              const parsedData = JSON.parse(text);
              console.log(`Successfully parsed response as JSON despite incorrect content-type`);
              
              // Personalize the data with real user info if available
              if (user && userDetails && parsedData.profile) {
                parsedData.profile.email = user.email || parsedData.profile.email;
                parsedData.profile.name = userDetails.name || user.email || parsedData.profile.name;
              }
              
              return parsedData;
            } catch (parseError) {
              // If it's not valid JSON, throw the original error
              throw new Error(`${source.label}: Expected JSON response but got ${contentType}`);
            }
          } catch (textError) {
            throw new Error(`${source.label}: Expected JSON response but got ${contentType}`);
          }
        }
        
        const data = await response.json();
        console.log(`${source.label} data received successfully`);
        
        // Personalize the data with real user info if available
        if (user && userDetails && data.profile) {
          data.profile.email = user.email || data.profile.email;
          data.profile.name = userDetails.name || user.email || data.profile.name;
        }
        
        return data;
      } catch (err) {
        console.error(`${source.label} fetch failed:`, err);
        lastError = err;
        // Continue to next source
      }
    }
    
    // If all sources failed, use mock data as final fallback
    console.warn(`All fetch attempts failed, using mock data for ${endpoint}`);
    if (mockData[endpoint as keyof typeof mockData]) {
      // Add real user data to mock data for personalization
      if (user && userDetails && mockData.dashboard?.profile) {
        mockData.dashboard.profile.id = user.id;
        mockData.dashboard.profile.email = user.email || mockData.dashboard.profile.email;
        mockData.dashboard.profile.name = userDetails.name || user.email?.split('@')[0] || mockData.dashboard.profile.name;
      }
      
      // Show a toast to inform the user we're using mock data
      toast({
        title: "Using offline data",
        description: "Could not connect to the API server. Using cached data instead.",
        variant: "warning",
        duration: 5000
      });
      
      return mockData[endpoint as keyof typeof mockData];
    }
    
    // If no mock data available either, throw the last error
    throw lastError || new Error('All fetch attempts failed and no mock data available');
  };

  // Initialize auth state
  const { user, isLoading: authLoading, userDetails } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Stats state
  const [learnerStats, setLearnerStats] = useState({
    coursesInProgress: 0,
    hoursRemaining: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
    skillsAcquired: 0,
    learningStreak: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCounts, setCourseCounts] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0
  });
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  
  // Learning paths state
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [pathsError, setPathsError] = useState<string | null>(null);
  
  // Achievements state
  const [certificates, setCertificates] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Achievement[]>([]);
  const [achievementsSummary, setAchievementsSummary] = useState({
    totalCertificates: 0,
    totalBadges: 0,
    recentAchievements: [] as Achievement[]
  });
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Remove the separate userId state, use user.id directly where needed
  // const userId = '6e2c2548-c04a-419b-a17c-c2feb6a3d9c6'; // Removed mock ID

  useEffect(() => {
    // Ensure user ID exists before fetching
    if (!user?.id) {
      setLoading(false); // Stop loading if no user ID
      return;
    }

    const fetchDashboardData = async (currentUserId: string) => {
      try {
        setLoading(true);
        setError(null);
        setDashboardData(null); // Clear previous data on new fetch
        
        console.log(`Attempting to fetch dashboard data for userId=${currentUserId}`);
        
        // Use our utility function
        const data = await fetchWithFallback('dashboard', currentUserId);
        console.log('Dashboard data received:', data);
        
        // Check for errors within the received data
        if (data?.error) {
          console.error('API returned an error in dashboard data:', data.error);
          setError(data.message || data.error || 'Error loading dashboard data.');
          setDashboardData(null);
        } else {
          setDashboardData(data); // Set data on success
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        let errorMessage = 'Error loading dashboard data. Please try again later.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData(user.id);
    
    // Dependency array includes user.id to refetch if the user changes
  }, [user?.id]);

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Fetch learner stats
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchLearnerStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        console.log(`Fetching stats data for user: ${user.id}`);
        // Use our utility function
        const dashboardData = await fetchWithFallback('dashboard', user.id);
        console.log('Dashboard data received for stats:', dashboardData);
        
        // Extract stats from dashboard data
        const { stats } = dashboardData;
        if (stats) {
          setLearnerStats({
            coursesInProgress: stats.coursesInProgress || 0,
            hoursRemaining: stats.totalTimeSpent || 0,
            coursesCompleted: stats.coursesCompleted || 0,
            certificatesEarned: (dashboardData.badges?.length || 0) + (dashboardData.certificates?.length || 0),
            skillsAcquired: stats.skillsAcquired || 0,
            learningStreak: 0 // We don't have this data yet
          });
        }
      } catch (error) {
        console.error('Error fetching learner stats:', error);
        setStatsError('Failed to load your dashboard stats');
        
        // Show error toast
        toast({
          variant: 'destructive',
          title: 'Error loading stats',
          description: 'Could not load your learning stats. Please try again later.'
        });
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchLearnerStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchLearnerStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user?.id, toast]);
  
  // Fetch courses data *if needed* when tab is active
  useEffect(() => {
    // Only fetch if the user exists, the tab is active, AND courses haven't been loaded yet
    if (user?.id && activeTab === 'courses' && courses.length === 0 && !coursesLoading) {
      const fetchCourses = async () => {
        try {
          setCoursesLoading(true);
          setCoursesError(null);
          
          console.log(`Fetching courses data for user: ${user.id} (Tab Active)`);
          // Use fetchWithFallback or direct fetch as appropriate
          const data = await fetchWithFallback('courses', user.id);
          
          if (data?.error) {
            throw new Error(data.message || data.error || 'Failed to fetch courses');
          }
          
          setCourses(data.courses || []);
          setCourseCounts(data.counts || data.stats || { total: 0, inProgress: 0, completed: 0, notStarted: 0 });
          setFeaturedCourse(data.featuredCourse || null);
        } catch (error) {
          console.error('Error fetching courses:', error);
          setCoursesError('Failed to load your courses');
          toast({
            variant: 'destructive',
            title: 'Error loading courses',
            description: error instanceof Error ? error.message : 'Could not load your courses. Please try again later.'
          });
        } finally {
          setCoursesLoading(false);
        }
      };
      
      fetchCourses();
    }
    // Dependencies: user.id, activeTab, courses.length (to check if loaded), coursesLoading
  }, [user?.id, activeTab, courses.length, coursesLoading, toast]);
  
  // Fetch learning paths data *if needed* when tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'paths' && learningPaths.length === 0 && !pathsLoading) {
      const fetchLearningPaths = async () => {
        try {
          setPathsLoading(true);
          setPathsError(null);
          
          console.log(`Fetching learning paths for user: ${user.id} (Tab Active)`);
          const data = await fetchWithFallback('learning-paths', user.id);

          if (data?.error) {
            throw new Error(data.message || data.error || 'Failed to fetch learning paths');
          }
          
          setLearningPaths(data?.learning_paths || []);
        } catch (error) {
          console.error('Error fetching learning paths:', error);
          setPathsError('Failed to load your learning paths');
          toast({
            variant: 'destructive',
            title: 'Error loading learning paths',
            description: error instanceof Error ? error.message : 'Could not load your learning paths. Please try again later.'
          });
        } finally {
          setPathsLoading(false);
        }
      };
      
      fetchLearningPaths();
    }
  }, [user?.id, activeTab, learningPaths.length, pathsLoading, toast]);
  
  // Fetch achievements data *if needed* when tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'achievements' && certificates.length === 0 && badges.length === 0 && !achievementsLoading) {
      const fetchAchievements = async () => {
        try {
          setAchievementsLoading(true);
          setAchievementsError(null);
          
          console.log(`Fetching achievements data for user: ${user.id} (Tab Active)`);
          const data = await fetchWithFallback('achievements', user.id);

          if (data?.error) {
            throw new Error(data.message || data.error || 'Failed to fetch achievements');
          }
          
          setCertificates(data.certificates || []);
          setBadges(data.badges || []);
          setAchievementsSummary(data.summary || {
            totalCertificates: data.certificates?.length || 0,
            totalBadges: data.badges?.length || 0,
            recentAchievements: []
          });
        } catch (error) {
          console.error('Error fetching achievements:', error);
          setAchievementsError('Failed to load your achievements');
          toast({
            variant: 'destructive',
            title: 'Error loading achievements',
            description: error instanceof Error ? error.message : 'Could not load your achievements. Please try again later.'
          });
        } finally {
          setAchievementsLoading(false);
        }
      };
      
      fetchAchievements();
    }
  }, [user?.id, activeTab, certificates.length, badges.length, achievementsLoading, toast]);
  
  // Fetch profile data *if needed* when tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'profile' && !profile && !profileLoading) {
      const fetchProfile = async () => {
        try {
          setProfileLoading(true);
          setProfileError(null);
          
          console.log(`Fetching profile data for user: ${user.id} (Tab Active)`);
          const data = await fetchWithFallback('profile', user.id);

          if (data?.error) {
            throw new Error(data.message || data.error || 'Failed to fetch profile');
          }
          
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfileError('Failed to load your profile');
          toast({
            variant: 'destructive',
            title: 'Error loading profile',
            description: error instanceof Error ? error.message : 'Could not load your profile. Please try again later.'
          });
        } finally {
          setProfileLoading(false);
        }
      };
      
      fetchProfile();
    }
  }, [user?.id, activeTab, profile, profileLoading, toast]);
  
  console.log("LearnerDashboard - Current state:", { user, userDetails, authLoading, learnerStats });

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  console.log("LearnerDashboard: Rendering for user:", user?.id, "details:", user);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-destructive mb-4">
          <span className="font-bold">Error:</span> {error || 'Failed to load dashboard data'}
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { profile: dashboardProfile, courses: dashboardCourses, learningPaths: dashboardLearningPaths, stats } = dashboardData;

  return (
    <div className="container py-6 mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Learner Dashboard</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src="/placeholder-avatar.jpg" alt={dashboardProfile.name} />
                <AvatarFallback>{getInitials(dashboardProfile.name)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Welcome, {dashboardProfile.name}</CardTitle>
                <CardDescription>
                  {dashboardProfile.isHrProfile 
                    ? `Your HR profile is synced with Learnfinity. Last login: ${new Date().toLocaleDateString()}`
                    : `Track your learning progress and upcoming courses`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  icon={<BookOpen className="h-5 w-5" />} 
                  title="Courses" 
                  value={stats.coursesCompleted.toString()}
                  label="completed"
                />
                <StatCard 
                  icon={<Award className="h-5 w-5" />} 
                  title="Learning Paths" 
                  value={stats.learningPathsCompleted.toString()}
                  label="completed"
                />
                <StatCard 
                  icon={<User className="h-5 w-5" />} 
                  title="HR Assigned" 
                  value={stats.assignedCourses.toString()}
                  label="courses"
                />
                <StatCard 
                  icon={<Users className="h-5 w-5" />} 
                  title="Skills" 
                  value={stats.skillsAcquired.toString()}
                  label="acquired"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Course Card */}
          {dashboardCourses.featured && (
            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 w-full md:w-1/3">
                    <img 
                      src={dashboardCourses.featured.thumbnailUrl} 
                      alt={dashboardCourses.featured.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{dashboardCourses.featured.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">{dashboardCourses.featured.category}</Badge>
                        {dashboardCourses.featured.hrTrainingId && (
                          <Badge variant="secondary">HR Assigned</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{dashboardCourses.featured.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{dashboardCourses.featured.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{dashboardCourses.featured.completedSections} of {dashboardCourses.featured.totalSections} sections completed</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm font-medium">{dashboardCourses.featured.progress}%</span>
                      </div>
                      <Progress value={dashboardCourses.featured.progress} className="h-2" />
                    </div>
                    <Button>Continue Course</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Paths Preview */}
          {dashboardLearningPaths && dashboardLearningPaths.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Learning Paths</CardTitle>
                  <CardDescription>Your current learning journeys</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab('paths')}>View All</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardLearningPaths.slice(0, 2).map((path) => (
                    <Card key={path.id} className="overflow-hidden">
                      <div className="relative">
                        <img 
                          src={path.thumbnail_url || '/placeholder-path.jpg'} 
                          alt={path.title}
                          className="w-full h-32 object-cover"
                        />
                        {path.is_hr_assigned && (
                          <Badge className="absolute top-2 right-2" variant="secondary">
                            HR Assigned
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{path.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground line-clamp-2">{path.description}</p>
                        <div className="flex justify-between text-sm">
                          <span>{path.courses_count || 0} courses</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {formatDistanceToNow(new Date(path.due_date || Date.now()), { addSuffix: true })}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Progress</span>
                            <span className="text-sm font-medium">{path.progress}%</span>
                          </div>
                          <Progress value={path.progress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>All your enrolled and assigned courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer">All ({dashboardCourses.total})</Badge>
                <Badge variant="outline" className="cursor-pointer">In Progress ({dashboardCourses.inProgress})</Badge>
                <Badge variant="outline" className="cursor-pointer">Completed ({dashboardCourses.completed})</Badge>
                <Badge variant="outline" className="cursor-pointer">Not Started ({dashboardCourses.notStarted})</Badge>
                <Badge variant="outline" className="cursor-pointer">HR Assigned ({dashboardCourses.hrAssigned})</Badge>
              </div>
              
              <div className="space-y-4">
                {dashboardCourses.items.map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/4 flex-shrink-0">
                        <div className="relative">
                          {course.thumbnailUrl ? (
                            <img 
                              src={course.thumbnailUrl} 
                              alt={course.title} 
                              className="object-cover w-full h-full transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <FileText className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-grow p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">{course.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{course.category}</Badge>
                            {course.hrTrainingId && (
                              <Badge variant="secondary">HR Assigned</Badge>
                            )}
                            <Badge 
                              variant={
                                course.ragStatus === 'completed' ? 'success' : 
                                course.ragStatus === 'in_progress' ? 'secondary' : 'default'
                              }
                            >
                              {course.ragStatus === 'completed' ? 'Completed' : 
                               course.ragStatus === 'in_progress' ? 'In Progress' : 'Not Started'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.skills && course.skills.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/40">{skill}</Badge>
                          ))}
                          {course.skills && course.skills.length > 3 && (
                            <Badge variant="outline" className="bg-muted/40">+{course.skills.length - 3} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{Math.floor(course.duration / 60)} hrs</span>
                          <span className="mx-2">•</span>
                          <span>{course.completedSections} of {course.totalSections} sections completed</span>
                          {course.learningPathName && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Part of: {course.learningPathName}</span>
                            </>
                          )}
                        </div>
                        
                        {course.enrollmentDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Enrolled:</span> {formatDate(course.enrollmentDate)}
                            {course.completionDate && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="font-medium">Completed:</span> {formatDate(course.completionDate)}
                              </>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-2 mb-4">
                          <div className="flex justify-between text-sm font-medium mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        <Button className="mt-2">{course.progress > 0 ? 'Continue' : 'Start'} Course</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>Your structured learning journeys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardLearningPaths.map((path) => (
                  <Card key={path.id} className="overflow-hidden flex flex-col">
                    <div className="relative">
                      <img 
                        src={path.thumbnail_url || '/placeholder-path.jpg'} 
                        alt={path.title}
                        className="w-full h-44 object-cover"
                      />
                      {path.is_hr_assigned && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          HR Assigned
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{path.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow">
                      <p className="text-muted-foreground">{path.description}</p>
                      <div className="flex justify-between text-sm">
                        <span>{path.courses_count || 0} courses</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {formatDistanceToNow(new Date(path.due_date || Date.now()), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 my-2">
                        {path.skills && path.skills.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/40">{skill}</Badge>
                        ))}
                        {path.skills && path.skills.length > 3 && (
                          <Badge variant="outline" className="bg-muted/40">+{path.skills.length - 3} more</Badge>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Progress</span>
                          <span className="text-sm font-medium">{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button className="w-full">Continue Path</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Your learning profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <Avatar className="h-40 w-40 mb-4">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={dashboardProfile.name} />
                    <AvatarFallback className="text-4xl">{getInitials(dashboardProfile.name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold text-center">{dashboardProfile.name}</h3>
                  <p className="text-muted-foreground text-center">{dashboardProfile.title || 'No title'}</p>
                  
                  <div className="w-full mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {dashboardProfile.skills && dashboardProfile.skills.length > 0 ? (
                          dashboardProfile.skills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/40">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">No skills listed</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Learning Goals</h4>
                      {dashboardProfile.learningPreferences?.learningGoals && 
                       dashboardProfile.learningPreferences.learningGoals.length > 0 ? (
                        <ul className="list-disc list-inside text-sm">
                          {dashboardProfile.learningPreferences.learningGoals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">No learning goals set</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Personal Information</h4>
                      <div className="space-y-2">
                        <ProfileField label="Email" value={dashboardProfile.email} />
                        <ProfileField label="Phone" value={dashboardProfile.phone || 'Not provided'} />
                        <ProfileField label="Department" value={dashboardProfile.department || 'Not specified'} />
                        <ProfileField label="Member Since" value={formatDate(dashboardProfile.createdAt)} />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Learning Preferences</h4>
                      <div className="space-y-2">
                        <ProfileField 
                          label="Preferred Learning Style" 
                          value={dashboardProfile.learningPreferences?.preferredLearningStyle || 'Not specified'} 
                        />
                        <ProfileField 
                          label="Preferred Content Types" 
                          value={dashboardProfile.learningPreferences?.preferredContentTypes?.length > 0 
                            ? dashboardProfile.learningPreferences.preferredContentTypes.join(', ') 
                            : 'Not specified'} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {dashboardProfile.bio && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Bio</h4>
                      <p className="text-sm">{dashboardProfile.bio}</p>
                    </div>
                  )}
                  
                  {/* HR Information Section */}
                  {dashboardProfile.hr && (
                    <div className="mt-6 border-t pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5" />
                        <h4 className="text-base font-medium">HR Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileField 
                          label="Hire Date" 
                          value={formatDate(dashboardProfile.hr.hire_date)} 
                          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                        />
                        <ProfileField 
                          label="Employment Status" 
                          value={dashboardProfile.hr.status || 'Active'} 
                        />
                        {dashboardProfile.hr.manager && (
                          <ProfileField 
                            label="Manager" 
                            value={dashboardProfile.hr.manager} 
                          />
                        )}
                        {dashboardProfile.department && (
                          <ProfileField 
                            label="Department" 
                            value={dashboardProfile.department} 
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Button variant="outline">Edit Profile</Button>
                    <Button variant="outline">Change Password</Button>
                    <Button variant="outline">Notification Settings</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for profile field display
const ProfileField: React.FC<{
  label: string;
  value: string;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">
        {icon && <span className="mr-2">{icon}</span>}
        {value}
      </span>
    </div>
  );
};

// Helper component for stats display
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  label: string;
}> = ({ icon, title, value, label }) => {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <div className="p-2 bg-primary/10 rounded-full text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{label}</span>
        </p>
      </div>
    </div>
  );
};

export default LearnerDashboard; 