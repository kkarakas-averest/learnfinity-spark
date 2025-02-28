import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Sparkles, Star, Target, BookOpen, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLearningData } from "@/hooks/useLearningData";

const Dashboard = () => {
  const { user, userDetails, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { getActiveCourses, getLearningPaths, coursesLoading } = useLearningData();

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

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
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
              
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
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
              
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
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
              
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
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
              <Card className="lg:col-span-2 animate-fade-in opacity-0" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coursesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    getActiveCourses().slice(0, 2).map((course, index) => (
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
                  )}
                </CardContent>
              </Card>
              
              {/* Learning Streak */}
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
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
              <Card className="lg:col-span-2 animate-fade-in opacity-0" style={{ animationDelay: "700ms", animationFillMode: "forwards" }}>
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
              <Card className="animate-fade-in opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
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
                    
                    <Button variant="outline" className="w-full mt-4" onClick={() => navigate(`/learning-paths/${path.id}`)}>
                      View Path
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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
