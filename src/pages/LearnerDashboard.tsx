import React from "@/lib/react-helpers";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Home, BookOpen, Trophy, User, ArrowRight, Sparkles, AlertCircle, Calendar, Clock, Check, Users } from "lucide-react";
import DashboardHeader from "@/components/learner/DashboardHeader";
import TestNotificationButton from "@/components/learner/TestNotificationButton";
import AICourseRecommendations from "@/components/learner/AICourseRecommendations";
import PersonalizedPathDisplay from "@/components/learner/PersonalizedPathDisplay";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

// Achievements interface
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

// Profile interface
interface LearnerProfile {
  id: string | null;
  userId: string;
  email: string | null;
  name: string | null;
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
  createdAt: string;
  updatedAt: string | null;
  exists: boolean;
  hr?: {
    id: string;
    hire_date?: string;
    status?: string;
    phone?: string;
    manager?: string;
    manager_id?: string;
    department_id?: string;
    position_id?: string;
  };
}

const LearnerDashboard: React.FC = () => {
  const { user, userDetails, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("overview");
  
  // Stats state
  const [learnerStats, setLearnerStats] = React.useState({
    coursesInProgress: 0,
    hoursRemaining: 0,
    overallCompletion: 0,
    completionChange: 0,
    achievements: 0,
    newAchievements: 0,
    learningStreak: 0
  });
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  
  // Courses state
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [courseCounts, setCourseCounts] = React.useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0
  });
  const [featuredCourse, setFeaturedCourse] = React.useState<Course | null>(null);
  const [coursesLoading, setCoursesLoading] = React.useState(true);
  const [coursesError, setCoursesError] = React.useState<string | null>(null);
  
  // Learning paths state
  const [learningPaths, setLearningPaths] = React.useState<LearningPath[]>([]);
  const [pathsLoading, setPathsLoading] = React.useState(true);
  const [pathsError, setPathsError] = React.useState<string | null>(null);
  
  // Achievements state
  const [certificates, setCertificates] = React.useState<Achievement[]>([]);
  const [badges, setBadges] = React.useState<Achievement[]>([]);
  const [achievementsSummary, setAchievementsSummary] = React.useState({
    totalCertificates: 0,
    totalBadges: 0,
    recentAchievements: [] as Achievement[]
  });
  const [achievementsLoading, setAchievementsLoading] = React.useState(true);
  const [achievementsError, setAchievementsError] = React.useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = React.useState<LearnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  
  // Fetch learner stats
  React.useEffect(() => {
    if (!user?.id) return;
    
    const fetchLearnerStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        console.log(`Fetching stats data for user: ${user.id}`);
        const response = await fetch(`/api/learner/dashboard?userId=${user.id}`);
        
        // Debug the response
        console.log(`Dashboard API response status: ${response.status}`);
        
        if (!response.ok) {
          // Try to get error details if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch learner stats');
          } catch (jsonError) {
            throw new Error(`Failed to fetch learner stats: ${response.statusText}`);
          }
        }
        
        // Parse the response
        let dashboardData;
        try {
          dashboardData = await response.json();
          console.log('Dashboard data received:', dashboardData);
        } catch (parseError) {
          console.error('Error parsing dashboard response:', parseError);
          throw new Error('Failed to parse dashboard data');
        }
        
        // Extract stats from dashboard data
        const { stats } = dashboardData;
        if (stats) {
          setLearnerStats({
            coursesInProgress: stats.coursesInProgress || 0,
            hoursRemaining: stats.totalTimeSpent || 0,
            overallCompletion: Math.round(dashboardData.courses?.reduce((acc, c) => acc + c.progress, 0) / 
              Math.max(dashboardData.courses?.length || 1, 1)) || 0,
            completionChange: 0, // We don't have this data yet
            achievements: (dashboardData.badges?.length || 0) + (dashboardData.certificates?.length || 0),
            newAchievements: 0, // We don't have this data yet
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
  
  // Fetch courses when tab is activated or user changes
  React.useEffect(() => {
    if (!user?.id || activeTab !== 'courses') return;
    
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError(null);
        
        console.log(`Fetching courses data for user: ${user.id}`);
        const response = await fetch(`/api/learner/courses?userId=${user.id}`);
        
        // Debug the response
        console.log(`Courses API response status: ${response.status}`);
        
        if (!response.ok) {
          // Try to get error details if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch courses');
          } catch (jsonError) {
            throw new Error(`Failed to fetch courses: ${response.statusText}`);
          }
        }
        
        // Parse the response
        let coursesData;
        try {
          coursesData = await response.json();
          console.log('Courses data received:', coursesData);
        } catch (parseError) {
          console.error('Error parsing courses response:', parseError);
          throw new Error('Failed to parse courses data');
        }
        
        setCourses(coursesData.courses);
        setCourseCounts(coursesData.counts || coursesData.stats);
        setFeaturedCourse(coursesData.featuredCourse);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCoursesError('Failed to load your courses');
        
        toast({
          variant: 'destructive',
          title: 'Error loading courses',
          description: 'Could not load your courses. Please try again later.'
        });
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchCourses();
  }, [user?.id, activeTab, toast]);
  
  // Fetch learning paths when tab is activated or user changes
  React.useEffect(() => {
    if (!user?.id || activeTab !== 'paths') return;
    
    const fetchLearningPaths = async () => {
      try {
        setPathsLoading(true);
        setPathsError(null);
        
        console.log(`Fetching learning paths for user: ${user.id}`);
        const response = await fetch(`/api/learner/learning-paths?userId=${user.id}`);
        
        // Debug the response
        console.log(`Learning paths API response status: ${response.status}`);
        
        if (!response.ok) {
          // Try to get error details if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch learning paths');
          } catch (jsonError) {
            throw new Error(`Failed to fetch learning paths: ${response.statusText}`);
          }
        }
        
        // Parse the response
        let pathsData;
        try {
          pathsData = await response.json();
          console.log('Learning paths data received:', pathsData);
        } catch (parseError) {
          console.error('Error parsing learning paths response:', parseError);
          throw new Error('Failed to parse learning paths data');
        }
        
        if (pathsData && pathsData.learning_paths) {
          setLearningPaths(pathsData.learning_paths);
        } else {
          setLearningPaths([]);
        }
      } catch (error) {
        console.error('Error fetching learning paths:', error);
        setPathsError('Failed to load your learning paths');
        
        toast({
          variant: 'destructive',
          title: 'Error loading learning paths',
          description: 'Could not load your learning paths. Please try again later.'
        });
      } finally {
        setPathsLoading(false);
      }
    };
    
    fetchLearningPaths();
  }, [user?.id, activeTab, toast]);
  
  // Fetch achievements when tab is activated or user changes
  React.useEffect(() => {
    if (!user?.id || activeTab !== 'achievements') return;
    
    const fetchAchievements = async () => {
      try {
        setAchievementsLoading(true);
        setAchievementsError(null);
        
        console.log(`Fetching achievements data for user: ${user.id}`);
        const response = await fetch(`/api/learner/achievements?userId=${user.id}`);
        
        // Debug the response
        console.log(`Achievements API response status: ${response.status}`);
        
        if (!response.ok) {
          // Try to get error details if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch achievements');
          } catch (jsonError) {
            throw new Error(`Failed to fetch achievements: ${response.statusText}`);
          }
        }
        
        // Parse the response
        let achievementsData;
        try {
          achievementsData = await response.json();
          console.log('Achievements data received:', achievementsData);
        } catch (parseError) {
          console.error('Error parsing achievements response:', parseError);
          throw new Error('Failed to parse achievements data');
        }
        
        setCertificates(achievementsData.certificates || []);
        setBadges(achievementsData.badges || []);
        setAchievementsSummary(achievementsData.summary || {
          totalCertificates: achievementsData.certificates?.length || 0,
          totalBadges: achievementsData.badges?.length || 0,
          recentAchievements: []
        });
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setAchievementsError('Failed to load your achievements');
        
        toast({
          variant: 'destructive',
          title: 'Error loading achievements',
          description: 'Could not load your achievements. Please try again later.'
        });
      } finally {
        setAchievementsLoading(false);
      }
    };
    
    fetchAchievements();
  }, [user?.id, activeTab, toast]);
  
  // Fetch profile when tab is activated or user changes
  React.useEffect(() => {
    if (!user?.id || activeTab !== 'profile') return;
    
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        
        console.log(`Fetching profile data for user: ${user.id}`);
        const response = await fetch(`/api/learner/profile?userId=${user.id}`);
        
        // Debug the response
        console.log(`Profile API response status: ${response.status}`);
        
        if (!response.ok) {
          // Try to get error details if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch profile');
          } catch (jsonError) {
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
          }
        }
        
        // Parse the response
        let profileData;
        try {
          profileData = await response.json();
          console.log('Profile data received:', profileData);
        } catch (parseError) {
          console.error('Error parsing profile response:', parseError);
          throw new Error('Failed to parse profile data');
        }
        
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileError('Failed to load your profile');
        
        toast({
          variant: 'destructive',
          title: 'Error loading profile',
          description: 'Could not load your profile. Please try again later.'
        });
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchProfile();
  }, [user?.id, activeTab, toast]);
  
  console.log("LearnerDashboard - Current state:", { user, userDetails, isLoading, learnerStats });

  // Redirect if not authenticated
  if (!isLoading && !user) {
    console.log("LearnerDashboard: No user found, redirecting to login");
    return <Navigate to="/login" />;
  }

  // Show loading state
  if (isLoading) {
    console.log("LearnerDashboard: Auth is loading, showing spinner");
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  console.log("LearnerDashboard: Rendering for user:", user?.id, "details:", userDetails);
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Development User ID Display - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
      <div className="bg-blue-100 p-2 text-sm text-center">
          <p>Your User ID: <strong>{user?.id}</strong> (Development mode)</p>
        <TestNotificationButton />
      </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Learning Paths
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {statsError && (
              <Card className="border-red-200 bg-red-50 mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p>{statsError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Courses In Progress
                  </CardTitle>
                  <div className="h-4 w-4 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs">
                    {statsLoading ? (
                      <LoadingSpinner size="xs" />
                    ) : (
                      learnerStats.coursesInProgress
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `${learnerStats.hoursRemaining} hours remaining`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last activity: Yesterday
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overall Completion
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `${learnerStats.overallCompletion}%`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `+${learnerStats.completionChange}% from last week`
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Achievements
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      learnerStats.achievements
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsLoading ? (
                      <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `${learnerStats.newAchievements} new this month`
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Learning Streak
                  </CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      `${learnerStats.learningStreak} days`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep it up!
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
              {/* Personalized Learning Path - Takes 4/7 columns on larger screens */}
              <div className="lg:col-span-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Your Learning Path</h2>
                    <p className="text-sm text-muted-foreground">
                    Personalized courses curated by AI based on your preferences and goals
                    </p>
                  </div>
                <PersonalizedPathDisplay />
                  </div>
              
              {/* AI Course Recommendations - Takes 3/7 columns on larger screens */}
              <div className="lg:col-span-3">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Recommended For You</h2>
                    <p className="text-sm text-muted-foreground">
                    Additional courses that match your interests
                    </p>
                </div>
              <AICourseRecommendations />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>
                  Track your progress across all enrolled courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coursesError && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <p>{coursesError}</p>
                    </div>
                  </div>
                )}
                
                {coursesLoading ? (
                  <div className="flex flex-col items-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Loading your courses...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
                    <Button>Browse Courses</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-blue-700">{courseCounts.total}</div>
                          <p className="text-sm text-blue-600">Total Courses</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-amber-50 border-amber-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-amber-700">{courseCounts.inProgress}</div>
                          <p className="text-sm text-amber-600">In Progress</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-700">{courseCounts.completed}</div>
                          <p className="text-sm text-green-600">Completed</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50 border-slate-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-slate-700">{courseCounts.notStarted}</div>
                          <p className="text-sm text-slate-600">Not Started</p>
                        </CardContent>
                      </Card>
                    </div>
                  
                    <div className="space-y-4">
                      {courses.slice(0, 3).map(course => (
                        <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/4 bg-slate-100 p-4 flex items-center justify-center">
                              {course.thumbnailUrl ? (
                                <img 
                                  src={course.thumbnailUrl} 
                                  alt={course.title} 
                                  className="object-cover h-32 w-full md:h-full md:w-auto"
                                />
                              ) : (
                                <div className="bg-slate-200 h-32 w-full md:h-full md:w-auto flex items-center justify-center">
                                  <BookOpen className="h-10 w-10 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 md:p-6 md:w-3/4">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                  {course.category}
                                </Badge>
                                {course.ragStatus === 'green' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                    On Track
                                  </Badge>
                                )}
                                {course.ragStatus === 'amber' && (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                    Needs Attention
                                  </Badge>
                                )}
                                {course.ragStatus === 'red' && (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                                    Falling Behind
                                  </Badge>
                                )}
                                {course.hrTrainingId && (
                                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                    HR Assigned
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="text-lg font-medium mb-1">{course.title}</h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {course.description}
                              </p>
                              
                              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{course.duration} hours</span>
                                </div>
                                <div>
                                  <span>{course.completedSections}/{course.totalSections} sections</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-xs">
                                  <span>Progress</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                              </div>
                              
                              <div className="flex justify-end">
                                <Link to={`/course/${course.id}`}>
                                  <Button size="sm">
                                    {course.progress > 0 ? 'Continue' : 'Start'} Learning
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {courses.length > 3 && (
                      <Button variant="outline" className="w-full mt-4">
                        View All {courses.length} Courses
                      </Button>
                    )}
                  </>
                )}
                
                {featuredCourse && !coursesLoading && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Featured Course</h3>
                    <Card className="bg-slate-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-md overflow-hidden bg-slate-200 w-20 h-20 flex-shrink-0 flex items-center justify-center">
                            {featuredCourse.thumbnailUrl ? (
                              <img 
                                src={featuredCourse.thumbnailUrl} 
                                alt={featuredCourse.title} 
                                className="object-cover h-full w-full"
                              />
                            ) : (
                            <BookOpen className="h-8 w-8 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-medium">{featuredCourse.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{featuredCourse.description}</p>
                            <Link to={`/course/${featuredCourse.id}`}>
                              <Button size="sm" className="flex items-center">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                {featuredCourse.progress > 0 ? 'Continue' : 'Start'} Learning
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths">
            <h2 className="text-2xl font-bold mb-4">My Learning Paths</h2>
            {pathsLoading ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="md" />
              </div>
            ) : pathsError ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
                <p className="text-lg font-medium text-red-500">Error loading learning paths</p>
                <p className="text-muted-foreground">{pathsError}</p>
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium mb-1">No learning paths yet</p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You don't have any learning paths assigned or enrolled. Explore learning paths or check with your manager.
                </p>
                <Button asChild>
                  <Link to="/catalog/paths">Browse Learning Paths</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {learningPaths.map((path) => (
                  <Card key={path.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 bg-muted p-6 flex items-center justify-center">
                        {path.thumbnail_url ? (
                          <div 
                            className="h-40 w-full bg-center bg-cover rounded-lg"
                            style={{ backgroundImage: `url(${path.thumbnail_url})` }}
                          ></div>
                        ) : (
                          <Sparkles className="h-20 w-20 text-primary/20" />
                        )}
                      </div>
                      <div className="p-6 md:w-3/4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {path.path_type === 'hr_assigned' && (
                            <Badge variant="secondary">HR Assigned</Badge>
                          )}
                          {path.path_type === 'assigned' && (
                            <Badge>Assigned</Badge>
                          )}
                          {path.category && (
                            <Badge variant="outline">{path.category}</Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-medium mb-2">{path.title}</h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">{path.description}</p>
                        
                        {path.hr_plan_title && (
                          <div className="mb-4">
                            <Badge variant="outline" className="font-normal">
                              Part of: {path.hr_plan_title}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="mb-4 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{path.progress}%</span>
                          </div>
                          <Progress value={path.progress} />
                        </div>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>{path.course_count} {path.course_count === 1 ? 'course' : 'courses'}</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            <span>{path.completed_courses} completed</span>
                          </div>
                          {path.assigned_date && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Assigned: {new Date(path.assigned_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {path.due_date && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Due: {new Date(path.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button asChild>
                          <Link to={`/learning-path/${path.id}`}>
                            {path.progress > 0 ? 'Continue' : 'Start'} Learning Path
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Achievements</CardTitle>
                <CardDescription>
                  Certificates, badges, and recognitions you've earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {achievementsError && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <p>{achievementsError}</p>
                    </div>
                  </div>
                )}
                
                {achievementsLoading ? (
                  <div className="flex flex-col items-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Loading your achievements...</p>
                  </div>
                ) : certificates.length === 0 && badges.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't earned any achievements yet.</p>
                    <p className="text-sm mb-4">Complete courses and quizzes to earn certificates and badges.</p>
                    <Button>Browse Courses</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-blue-700">{achievementsSummary.totalCertificates}</div>
                          <p className="text-sm text-blue-600">Certificates</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-purple-700">{achievementsSummary.totalBadges}</div>
                          <p className="text-sm text-purple-600">Badges</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {certificates.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-3">Certificates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {certificates.slice(0, 4).map(certificate => (
                            <Card key={certificate.id} className="overflow-hidden hover:shadow-md transition-shadow">
                              <div className="flex p-4 gap-3">
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <img 
                                    src={certificate.imageUrl || '/images/certificate-default.png'} 
                                    alt="Certificate" 
                                    className="h-10 w-10 object-contain"
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium">{certificate.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {certificate.description}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Awarded on {new Date(certificate.awardedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {certificates.length > 4 && (
                          <Button variant="outline" size="sm" className="mt-3">
                            View All {certificates.length} Certificates
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {badges.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Badges</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {badges.slice(0, 8).map(badge => (
                            <Card key={badge.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                              <div className="p-4 text-center">
                                <div className="h-16 w-16 mx-auto mb-2 bg-slate-100 rounded-full flex items-center justify-center">
                                  <img 
                                    src={badge.imageUrl || '/images/badge-default.png'} 
                                    alt={badge.title} 
                                    className="h-10 w-10 object-contain"
                                  />
                                </div>
                                <h4 className="font-medium text-sm truncate">{badge.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {badge.type}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {badges.length > 8 && (
                          <Button variant="outline" size="sm" className="mt-3">
                            View All {badges.length} Badges
                          </Button>
                        )}
                  </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  View and manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileError && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <p>{profileError}</p>
                    </div>
                  </div>
                )}
                
                {profileLoading ? (
                  <div className="flex flex-col items-center py-8">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">Loading your profile...</p>
                  </div>
                ) : !profile ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Profile information not found.</p>
                    <Button>Create Profile</Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
                      <div>
                        <div className="bg-slate-100 rounded-lg p-6 mb-4">
                          <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <User className="h-12 w-12 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-center mb-1">
                            {profile.name || user?.email?.split('@')[0] || "Your Name"}
                          </h3>
                          <p className="text-sm text-muted-foreground text-center">
                            {profile.title || "No title set"}
                          </p>
                          {profile.department && (
                            <p className="text-sm text-center mt-1">{profile.department}</p>
                          )}
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Skills</h4>
                            {profile.skills && profile.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No skills added yet</p>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Learning Preferences</h4>
                            {profile.learningPreferences.preferredLearningStyle ? (
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">Preferred Learning Style:</span>
                                  <p className="text-sm capitalize">
                                    {profile.learningPreferences.preferredLearningStyle}
                                  </p>
                                </div>
                                
                                {profile.learningPreferences.preferredContentTypes && 
                                 profile.learningPreferences.preferredContentTypes.length > 0 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Preferred Content Types:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {profile.learningPreferences.preferredContentTypes.map((type, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No learning preferences set</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-3">Personal Information</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="font-medium text-sm">Name</div>
                              <div className="mt-1">{profile.name || "Not set"}</div>
                            </div>
                            <div>
                              <div className="font-medium text-sm">Email</div>
                              <div className="mt-1">{profile.email || user?.email || "Not set"}</div>
                            </div>
                            <div>
                              <div className="font-medium text-sm">Bio</div>
                              <div className="mt-1">{profile.bio || "No bio provided"}</div>
                            </div>
                            {profile.phone && (
                              <div>
                                <div className="font-medium text-sm">Phone</div>
                                <div className="mt-1">{profile.phone}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Learning Goals</h3>
                          {profile.learningPreferences.learningGoals && 
                           profile.learningPreferences.learningGoals.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {profile.learningPreferences.learningGoals.map((goal, index) => (
                                <li key={index} className="text-sm">{goal}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No learning goals set</p>
                          )}
                        </div>
                        
                        {/* HR Information */}
                        {profile.hr && (
                          <div>
                            <h3 className="text-lg font-medium mb-3">HR Information</h3>
                            <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                              <div className="space-y-3">
                                {profile.hr.hire_date && (
                                  <div>
                                    <div className="font-medium text-sm">Hire Date</div>
                                    <div className="mt-1">
                                      {new Date(profile.hr.hire_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                                
                                {profile.hr.status && (
                                  <div>
                                    <div className="font-medium text-sm">Status</div>
                                    <div className="mt-1 capitalize">
                                      <Badge variant={profile.hr.status === 'active' ? 'default' : 'secondary'}>
                                        {profile.hr.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                
                                {profile.hr.manager && (
                                  <div>
                                    <div className="font-medium text-sm">Manager</div>
                                    <div className="mt-1">
                                      {profile.hr.manager}
                                    </div>
                                  </div>
                                )}

                                {profile.department && (
                                  <div>
                                    <div className="font-medium text-sm">Department</div>
                                    <div className="mt-1">
                                      {profile.department}
                                    </div>
                                  </div>
                                )}

                                {profile.title && (
                                  <div>
                                    <div className="font-medium text-sm">Position</div>
                                    <div className="mt-1">
                                      {profile.title}
                                    </div>
                                  </div>
                                )}

                                {profile.hr.phone && (
                                  <div>
                                    <div className="font-medium text-sm">Phone</div>
                                    <div className="mt-1">
                                      {profile.hr.phone}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4">
                          <Button asChild>
                            <Link to="/edit-profile">Edit Profile</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LearnerDashboard; 