
import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  FileBadge, 
  LayoutDashboard, 
  Library, 
  BarChart, 
  BookOpen, 
  ChevronRight, 
  Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CourseCard from "@/components/CourseCard";
import LearningPathCard from "@/components/LearningPathCard";
import ProgressIndicator from "@/components/ProgressIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockActiveCourses = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    description: "Learn the fundamentals of machine learning algorithms and applications.",
    category: "Data Science",
    duration: "8 hours",
    level: "Beginner" as const,
    enrolled: 4500,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
    progress: 65,
  },
  {
    id: "2",
    title: "Advanced React Development",
    description: "Master advanced concepts in React including hooks, context, and Redux.",
    category: "Web Development",
    duration: "12 hours",
    level: "Intermediate" as const,
    enrolled: 3200,
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=1600&auto=format&fit=crop",
    progress: 30,
  },
];

const mockLearningPaths = [
  {
    id: "1",
    title: "Full-Stack Developer Path",
    description: "Comprehensive curriculum to become a professional full-stack developer.",
    courseCount: 8,
    estimatedTime: "120 hours",
    progress: 42,
    recommended: true,
    tags: ["Web Development", "JavaScript", "React", "Node.js"],
  },
  {
    id: "2",
    title: "Data Science Career Path",
    description: "From statistics fundamentals to advanced machine learning models.",
    courseCount: 12,
    estimatedTime: "160 hours",
    progress: 28,
    recommended: false,
    tags: ["Data Science", "Python", "ML", "Statistics"],
  },
];

const mockStats = [
  {
    title: "Hours Learned",
    value: "24.5",
    icon: <Clock className="h-4 w-4" />,
    change: "+2.5 this week",
    trend: "up",
  },
  {
    title: "Courses Completed",
    value: "3",
    icon: <FileBadge className="h-4 w-4" />,
    change: "+1 this month",
    trend: "up",
  },
  {
    title: "Current Streak",
    value: "5 days",
    icon: <Calendar className="h-4 w-4" />,
    change: "Best: 12 days",
    trend: "neutral",
  },
  {
    title: "Skills Mastered",
    value: "8",
    icon: <BarChart className="h-4 w-4" />,
    change: "4 in progress",
    trend: "neutral",
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Welcome back, Alex</h1>
              <p className="text-muted-foreground mt-1 animate-fade-in opacity-0" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                Your learning journey continues
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button size="sm" className="gap-1.5 animate-fade-in opacity-0" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <Sparkles size={16} />
                AI Recommendations
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-white border shadow-sm animate-fade-in opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:shadow-sm">
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-1.5 data-[state=active]:shadow-sm">
                <BookOpen size={16} />
                <span>My Courses</span>
              </TabsTrigger>
              <TabsTrigger value="paths" className="gap-1.5 data-[state=active]:shadow-sm">
                <Library size={16} />
                <span>Learning Paths</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-fade-in">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockStats.map((stat, i) => (
                  <Card key={i} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 100 + 400}ms`, animationFillMode: "forwards" }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        {stat.icon}
                        {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className={`text-xs mt-1 ${
                        stat.trend === "up" 
                          ? "text-green-600" 
                          : stat.trend === "down" 
                          ? "text-red-600" 
                          : "text-muted-foreground"
                      }`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Continue Learning Section */}
              <section className="animate-fade-in opacity-0" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Continue Learning</h2>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
                    <a href="/courses">
                      View all
                      <ChevronRight size={16} />
                    </a>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockActiveCourses.map((course) => (
                    <CourseCard key={course.id} {...course} />
                  ))}
                </div>
              </section>

              {/* Learning Paths Section */}
              <section className="animate-fade-in opacity-0" style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Your Learning Paths</h2>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
                    <a href="/learning-paths">
                      View all
                      <ChevronRight size={16} />
                    </a>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockLearningPaths.map((path) => (
                    <LearningPathCard key={path.id} {...path} />
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="courses" className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...mockActiveCourses, ...mockActiveCourses].map((course, index) => (
                  <CourseCard 
                    key={`${course.id}-${index}`} 
                    {...course} 
                    progress={index > 1 ? 100 : course.progress} 
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paths" className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...mockLearningPaths, ...mockLearningPaths].map((path, index) => (
                  <LearningPathCard 
                    key={`${path.id}-${index}`} 
                    {...path} 
                    recommended={index === 1} 
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
