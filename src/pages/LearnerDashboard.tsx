import React from "@/lib/react-helpers";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Home, BookOpen, Trophy, User, ArrowRight } from "lucide-react";
import DashboardHeader from "@/components/learner/DashboardHeader";
import TestNotificationButton from "@/components/learner/TestNotificationButton";

const LearnerDashboard: React.FC = () => {
  const { user, userDetails, isLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState("overview");
  
  console.log("LearnerDashboard - Current state:", { user, userDetails, isLoading });

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
      
      {/* Temporary User ID Display - Remove after testing */}
      <div className="bg-blue-100 p-2 text-sm text-center">
        <p>Your User ID: <strong>{user?.id}</strong> (Copy this for your test notifications)</p>
        <TestNotificationButton />
      </div>
      
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Courses Enrolled
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Courses
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Learning Hours
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28.5</div>
                  <p className="text-xs text-muted-foreground">
                    +7.2 from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Certificates
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Continue Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">Modern JavaScript</div>
                        <div className="text-sm text-muted-foreground">65%</div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">React Essentials</div>
                        <div className="text-sm text-muted-foreground">28%</div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "28%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">Intro to Machine Learning</div>
                        <div className="text-sm text-muted-foreground">12%</div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "12%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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