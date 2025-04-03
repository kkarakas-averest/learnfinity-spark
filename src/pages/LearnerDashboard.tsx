import React from 'react';
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
  Users, Award
} from "lucide-react";
import DashboardHeader from "@/components/learner/DashboardHeader";
import TestNotificationButton from "@/components/learner/TestNotificationButton";
import AICourseRecommendations from "@/components/learner/AICourseRecommendations";
import PersonalizedPathDisplay from "@/components/learner/PersonalizedPathDisplay";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

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
  ragStatus: 'green' | 'amber' | 'red';
  learningPathId: string;
  learningPathName: string;
  hrTrainingId?: string;
  hrTrainingTitle?: string;
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

const LearnerDashboard: React.FC = () => {
  console.log("LearnerDashboard - Current state:", {
    loading: "State not initialized yet",
    user: "State not initialized yet"
  });

  // Add a utility function to fetch from multiple potential sources
  const fetchWithFallback = async (endpoint: string, userId: string) => {
    // Get the current hostname for production detection
    const isProduction = window.location.hostname !== 'localhost';
    
    console.log(`Attempting to fetch ${endpoint} data for userId=${userId}`);
    
    // List of fetch sources to try, in order of preference
    const sources = isProduction 
      ? [
          // In production, only use the same-origin endpoint
          { 
            label: "same-origin", 
            url: `/api/learner/${endpoint}?userId=${userId}`,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        ]
      : [
          // In development, try direct connection to API server first (most reliable)
          { 
            label: "direct-api", 
            url: `http://localhost:3083/api/learner/${endpoint}?userId=${userId}`,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          },
          // Then try same-origin which should be proxied by Vite
          { 
            label: "same-origin", 
            url: `/api/learner/${endpoint}?userId=${userId}`,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Requested-With': 'XMLHttpRequest' // Helps some servers detect AJAX requests
            }
          }
        ];
        
    // Add fallback mock data for when servers are unreachable
    const mockData = {
      dashboard: {
        profile: {
          id: userId,
          name: user?.email?.split('@')[0] || 'Anonymous User',
          email: user?.email || 'user@example.com',
          role: 'learner',
          avatar: null,
          bio: 'Learning enthusiast',
          lastLogin: new Date().toISOString(),
          joinDate: '2023-01-15T00:00:00.000Z'
        },
        courses: {
          total: 5,
          inProgress: 2,
          completed: 1,
          notStarted: 2,
          featured: {
            id: 'mock-course-1',
            title: 'Getting Started with React',
            description: 'Learn the basics of React development',
            progress: 30,
            completed_sections: 3,
            total_sections: 10
          },
          items: []
        },
        stats: {
          coursesCompleted: 1,
          coursesInProgress: 2,
          learningPathsCompleted: 0,
          learningPathsInProgress: 1,
          assignedCourses: 3,
          skillsAcquired: 5,
          totalHours: 12
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
          // Include credentials for same-origin requests
          credentials: source.label === 'same-origin' ? 'same-origin' : 'omit',
          // Add timeout to avoid hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
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
        
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error(`${source.label} response is not JSON. First 100 chars: ${responseText.substring(0, 100)}`);
          throw new Error(`${source.label}: Expected JSON response but got ${contentType}`);
        }
        
        const data = await response.json();
        console.log(`${source.label} data received successfully`);
        
        // If we're returning mock data, add the user's real email and name if available
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
    
    // If all sources failed and we have mock data for this endpoint, use it as final fallback
    if (mockData[endpoint as keyof typeof mockData]) {
      console.warn(`All fetch attempts failed, using mock data for ${endpoint}`);
      return mockData[endpoint as keyof typeof mockData];
    }
    
    // If we've tried all sources and all failed, throw the last error
    throw lastError || new Error('All fetch attempts failed');
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
                      src={dashboardCourses.featured.thumbnail_url || '/placeholder-course.jpg'} 
                      alt={dashboardCourses.featured.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{dashboardCourses.featured.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">{dashboardCourses.featured.category}</Badge>
                        {dashboardCourses.featured.hr_training_id && (
                          <Badge variant="secondary">HR Assigned</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{dashboardCourses.featured.description}</p>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{dashboardCourses.featured.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{dashboardCourses.featured.completed_sections} of {dashboardCourses.featured.total_sections} sections completed</span>
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
                            <Calendar className="h-3 w-3" />
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
                        <img 
                          src={course.thumbnail_url || '/placeholder-course.jpg'} 
                          alt={course.title}
                          className="w-full h-40 md:h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">{course.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{course.category}</Badge>
                            {course.hr_training_id && (
                              <Badge variant="secondary">HR Assigned</Badge>
                            )}
                            <Badge 
                              variant={
                                course.rag_status === 'completed' ? 'success' : 
                                course.rag_status === 'in_progress' ? 'secondary' : 'default'
                              }
                            >
                              {course.rag_status === 'completed' ? 'Completed' : 
                               course.rag_status === 'in_progress' ? 'In Progress' : 'Not Started'}
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
                          <span>{course.duration}</span>
                          <span className="mx-2">•</span>
                          <span>{course.completed_sections} of {course.total_sections} sections completed</span>
                          {course.learning_path_name && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Part of: {course.learning_path_name}</span>
                            </>
                          )}
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Progress</span>
                            <span className="text-sm font-medium">{course.progress}%</span>
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
                          <Calendar className="h-3 w-3" />
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
                          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
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