import React from "@/lib/react-helpers";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Home, BookOpen, Trophy, User, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import DashboardHeader from "@/components/learner/DashboardHeader";
import TestNotificationButton from "@/components/learner/TestNotificationButton";
import AICourseRecommendations from "@/components/learner/AICourseRecommendations";
import PersonalizedPathDisplay from "@/components/learner/PersonalizedPathDisplay";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const LearnerDashboard: React.FC = () => {
  const { user, userDetails, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("overview");
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
  
  // Fetch learner stats
  React.useEffect(() => {
    if (!user?.id) return;
    
    const fetchLearnerStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        const response = await fetch(`/api/learner/stats?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch learner stats');
        }
        
        const data = await response.json();
        setLearnerStats(data);
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
              </CardHeader>
              <CardContent>
                <p>You are currently enrolled in 4 courses.</p>
                <div className="mt-4 space-y-4">
                  <Button variant="outline" className="w-full">View all courses</Button>
                  
                  {/* Demo course link */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-2">Featured Course</h3>
                    <Card className="bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-md overflow-hidden bg-slate-200 w-20 h-20 flex-shrink-0 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-slate-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-medium">Introduction to Machine Learning</h4>
                            <p className="text-sm text-muted-foreground mb-3">Learn the fundamentals of machine learning algorithms.</p>
                            <Link to="/learning/course/demo-ml-101">
                              <Button size="sm" className="flex items-center">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Start Learning
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <p>You have earned 2 certificates and 5 badges.</p>
                <div className="mt-4 space-y-4">
                  <Button variant="outline" className="w-full">View all achievements</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="font-medium">Name</div>
                    <div>{userDetails?.name || "Not set"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Email</div>
                    <div>{user?.email || userDetails?.email || "Not set"}</div>
                  </div>
                  <div>
                    <div className="font-medium">Role</div>
                    <div className="capitalize">{userDetails?.role || "learner"}</div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LearnerDashboard; 