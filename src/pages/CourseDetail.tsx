import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, BarChart2, Users, FileText, Sparkles, User, LogOut, Settings, GraduationCap, Book, RefreshCw } from "lucide-react";
import NavbarMigrated from "@/components/NavbarMigrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/state';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import RegenerateContentButtonVite from "@/components/CourseView/RegenerateContentButtonVite";

// Mock data (replace with actual data fetching)
const mockCourse = {
  id: "1",
  title: "Introduction to Machine Learning",
  description: "Learn the fundamentals of machine learning algorithms and applications.",
  category: "Data Science",
  duration: "8 hours",
  level: "Beginner" as const,
  enrolled: 4500,
  image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
  content: [
    { title: "Module 1: Introduction", duration: "1 hour" },
    { title: "Module 2: Supervised Learning", duration: "2 hours" },
    { title: "Module 3: Unsupervised Learning", duration: "2 hours" },
    { title: "Module 4: Model Evaluation", duration: "1.5 hours" },
    { title: "Module 5: Case Studies", duration: "1.5 hours" },
  ],
};

// User avatar component
const UserAvatar = ({ name }: { name?: string }) => {
  const getInitials = (name: string) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase()
      : "";
  };

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} />
      <AvatarFallback>{name ? getInitials(name) : <User size={14} />}</AvatarFallback>
    </Avatar>
  );
};

// MenuItem component for dropdown menu
const NavMenuItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <DropdownMenuItem asChild>
    <Link to={to} className="flex items-center">
      {icon}
      <span>{label}</span>
    </Link>
  </DropdownMenuItem>
);

// User menu component
const UserMenu = ({ user }: { user: any }) => {
  if (!user) return null;
  
  const userData = { 
    name: user.email?.split('@')[0] || "User", 
    email: user.email || "", 
    role: "learner" as const 
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar name={userData.name} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
            {userData.role && (
              <Badge className="mt-1 w-fit">
                {userData.role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <NavMenuItem to="/profile" icon={<User className="mr-2 h-4 w-4" />} label="Profile" />
        <NavMenuItem to="/dashboard" icon={<GraduationCap className="mr-2 h-4 w-4" />} label="Dashboard" />
        <NavMenuItem to="/courses" icon={<Book className="mr-2 h-4 w-4" />} label="Courses" />
        <NavMenuItem to="/settings" icon={<Settings className="mr-2 h-4 w-4" />} label="Settings" />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-500 focus:text-red-500"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CourseDetail = () => {
  const { courseId } = useParams();
  // In a real app, you would fetch the course data based on courseId
  const course = mockCourse;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-blue-100 text-blue-800";
      case "Advanced":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // New state and function for enrollment
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  
  // Check if user is enrolled
  React.useEffect(() => {
    if (user?.id && courseId) {
      checkEnrollmentStatus();
    }
  }, [user?.id, courseId]);

  const checkEnrollmentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', user?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user?.id) {
      toast({
        title: 'Login Required',
        description: 'Please login to enroll in this course.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsEnrolling(true);
    try {
      const { error } = await supabase
        .from('hr_course_enrollments')
        .insert({
          course_id: courseId,
          employee_id: user.id,
          status: 'enrolled',
          progress: 0,
          enrollment_date: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      setIsEnrolled(true);
      toast({
        title: 'Successfully Enrolled',
        description: 'You have been enrolled in this course. Start learning now!',
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Enrollment Failed',
        description: 'Unable to enroll in this course. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 fixed top-0 left-0 right-0">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex gap-6 md:gap-10">
            <Link to="/" className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight">Learnfinity</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </div>

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course Overview */}
            <div className="md:col-span-2">
              <div className="relative aspect-video overflow-hidden rounded-xl mb-6">
                <img
                  src={course.image}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
                <Badge className="absolute top-3 left-3">{course.category}</Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {course.title}
              </h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={14} />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BarChart2 size={14} />
                  <span className={`px-2 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={14} />
                  <span>{course.enrolled.toLocaleString()} enrolled</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {isEnrolled ? (
                  <>
                    <Button asChild>
                      <Link to={`/courses/${courseId}/learn`}>Continue Learning</Link>
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" asChild>
                            <Link to={`/courses/${courseId}/learn-ai`} className="flex items-center">
                              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                              AI-Enhanced Learning
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Experience this course with AI-powered personalized learning path and insights</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <RegenerateContentButtonVite 
                      courseId={courseId || ""}
                      className="bg-green-600 text-white hover:bg-green-700"
                    />
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleEnroll} 
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
                    </Button>
                    <RegenerateContentButtonVite 
                      courseId={courseId || ""}
                      className="bg-green-600 text-white hover:bg-green-700"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Course Content */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Course Content</h2>
                  <ul className="space-y-2">
                    {course.content.map((module, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span>{module.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{module.duration}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
