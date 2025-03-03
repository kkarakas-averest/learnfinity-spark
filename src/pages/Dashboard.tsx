import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  Target, 
  Trophy, 
  Star, 
  Sparkles, 
  CalendarDays 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLearningData } from "@/hooks/useLearningData";
import AgentGeneratedCourses from "@/components/learner/AgentGeneratedCourses";

const Dashboard = () => {
  const { user, userDetails, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("overview");
  const { getActiveCourses, getLearningPaths, coursesLoading, learnerCourses } = useLearningData();
  const [dashboardError, setDashboardError] = React.useState(null);

  // Log the auth and learning state for debugging
  React.useEffect(() => {
    console.log("Dashboard - Auth State:", { user, userDetails, authLoading });
    console.log("Dashboard - Learning Data:", { 
      courses: getActiveCourses(), 
      paths: getLearningPaths(),
      rawCourses: learnerCourses
    });
  }, [user, userDetails, authLoading, learnerCourses]);

  // If there's an error loading data, capture it
  React.useEffect(() => {
    try {
      // Try to access data to catch any potential errors
      const courses = getActiveCourses();
      console.log("Successfully loaded courses:", courses.length);
    } catch (error) {
      console.error("Error in Dashboard data loading:", error);
      setDashboardError(error);
    }
  }, [learnerCourses]);

  // Mock data (would come from the backend in a real app)
  const recentActivities = [
    { id: 1, type: "course_progress", title: "Completed 'Introduction to React' module", time: "2 hours ago", icon: BookOpen },
    { id: 2, type: "achievement", title: "Earned 'Quick Learner' badge", time: "Yesterday", icon: Trophy },
    { id: 3, type: "assessment", title: "Scored 92% on JavaScript Quiz", time: "2 days ago", icon: Target },
    { id: 4, type: "recommendation", title: "New course recommended: Advanced TypeScript", time: "3 days ago", icon: Sparkles },
  ];

  const upcomingEvents = [
    { id: 1, title: "Group Project Discussion", date: "Tomorrow, 3:00 PM", duration: "1 hour" },
    { id: 2, title: "Mentor Session: Career Planning", date: "Friday, 11:00 AM", duration: "45 min" },
    { id: 3, title: "Workshop: Design Thinking", date: "Next Monday, 2:00 PM", duration: "2 hours" },
  ];

  const recommendedSkills = [
    { id: 1, name: "React", level: "Intermediate", progress: 65 },
    { id: 2, name: "TypeScript", level: "Beginner", progress: 32 },
    { id: 3, name: "Node.js", level: "Advanced", progress: 78 },
  ];

  const learningStreak = {
    current: 5,
    best: 12,
    thisWeek: 4,
    total: 120,
  };

  // Adding a timeout to prevent infinite loading
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  
  React.useEffect(() => {
    // If regular auth loading finishes, or after 3 seconds, stop showing loading state
    if (!authLoading || user) {
      setIsInitialLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
        console.log("Dashboard loading timeout reached - forcing display");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Check if user is authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      console.log("No user detected, redirecting to login");
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Replace the isInitialLoading check with this enhanced version
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Add error handling
  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto p-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold">Dashboard Error</h2>
          <p className="text-muted-foreground">We encountered an error loading your dashboard.</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Get active courses - ensure we have data even if API fails
  const activeCourses = (() => {
    try {
      return getActiveCourses();
    } catch (error) {
      console.error("Error getting active courses:", error);
      return [];
    }
  })();
  console.log("Active courses:", activeCourses);

  // Fallback to rendering the dashboard even if auth is still technically loading
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <WelcomeHeader userName={userDetails?.name || "Learner"} />
        
        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="ai-generated">AI Generated</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="opacity-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Learning Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.5</div>
                  <p className="text-xs mt-1 text-green-600">+2.5 this week</p>
                </CardContent>
              </Card>
              
              <Card className="opacity-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3/12</div>
                  <p className="text-xs mt-1 text-muted-foreground">Completed courses</p>
                </CardContent>
              </Card>
              
              <Card className="opacity-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Skill Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs mt-1 text-muted-foreground">Skills developing</p>
                </CardContent>
              </Card>
              
              <Card className="opacity-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs mt-1 text-muted-foreground">4 new this month</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Continue Learning */}
              <Card className="lg:col-span-2 opacity-100">
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coursesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : activeCourses.length > 0 ? (
                    activeCourses.slice(0, 2).map((course, index) => (
                      <div key={course.id} className="flex items-start gap-4 p-4 rounded-md border hover:bg-muted/50 transition-colors">
                        <div className="h-16 w-16 rounded-md overflow-hidden shrink-0">
                          <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-medium truncate">{course.title}</h4>
                          <div className="text-sm text-muted-foreground">{course.progress}% complete</div>
                          <Progress value={course.progress} className="h-2 mt-1" />
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/courses/${course.id}`)}>
                          Resume
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No courses found. Start your learning journey!</p>
                      <Button className="mt-4" onClick={() => navigate('/courses')}>
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Learning Streak */}
              <Card className="opacity-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-amber-500" />
                    Learning Streak
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-500">{learningStreak.current}</div>
                    <div className="text-muted-foreground text-sm mt-1">days in a row</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best streak</span>
                      <span className="font-medium">{learningStreak.best} days</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">This week</span>
                      <span className="font-medium">{learningStreak.thisWeek}/7 days</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total study days</span>
                      <span className="font-medium">{learningStreak.total} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2 opacity-100">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your learning activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-primary/10 text-primary">
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Upcoming Events */}
              <Card className="opacity-100">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Schedule and deadlines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex flex-col space-y-2 p-3 rounded-md border">
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{event.duration}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses">
          <DashboardTabs />
          </TabsContent>
          
          {/* Learning Paths Tab */}
          <TabsContent value="paths">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getLearningPaths().map((path) => (
                <Card key={path.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{path.title}</h3>
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {path.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {path.recommended && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {path.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-muted-foreground">{path.courseCount} courses</span>
                      <span className="text-muted-foreground">{path.estimatedTime}</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span>{Math.round(path.progress)}%</span>
                      </div>
                      <Progress value={path.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Add new AI Generated tab */}
          <TabsContent value="ai-generated">
            <React.Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            }>
              <AgentGeneratedCourses />
            </React.Suspense>
          </TabsContent>
          
          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Recommended Skills
                  </CardTitle>
                  <CardDescription>Based on your learning progress and career goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {recommendedSkills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Badge variant="outline" className="text-xs">{skill.level}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Learning Suggestions</CardTitle>
                  <CardDescription>Personalized recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=1" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">Practice TypeScript with Mini-Projects</h4>
                      <p className="text-sm text-muted-foreground">Hands-on experience to improve your TypeScript skills</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=2" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">Advanced React State Management</h4>
                      <p className="text-sm text-muted-foreground">Learn Context API, useReducer, and Redux</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=3" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">Introduction to Node.js Backend</h4>
                      <p className="text-sm text-muted-foreground">Build your first RESTful API with Express</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
