import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Award, 
  BarChart2 
} from 'lucide-react';
import { BellIcon } from '@/components/ui/custom-icons';
import { ROUTES } from '@/lib/routes';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  ragStatus: 'red' | 'amber' | 'green';
  dueDate?: string;
  moduleCount: number;
  completedModules: number;
  estimatedTimeToComplete: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  ragStatus: 'red' | 'amber' | 'green';
  courseCount: number;
  completedCourses: number;
}

interface LearnerStats {
  coursesInProgress: number;
  coursesCompleted: number;
  totalTimeSpent: string;
  averageScore: number;
  certificatesEarned: number;
}

// Define interfaces for the enrollment data structures
interface CourseData {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  module_count: number;
  created_at: string;
}

interface CourseEnrollment {
  id: string;
  course: CourseData;
  progress: number;
  rag_status: string;
  completed_modules: number;
  due_date?: string;
  created_at: string;
}

interface LearningPathData {
  id: string;
  title: string;
  description: string;
  course_count: number;
  created_at: string;
}

interface LearningPathEnrollment {
  id: string;
  learning_path: LearningPathData;
  progress: number;
  rag_status: string;
  completed_courses: number;
  created_at: string;
}

const LearnerDashboardPage: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<LearnerStats>({
    coursesInProgress: 0,
    coursesCompleted: 0,
    totalTimeSpent: '0h',
    averageScore: 0,
    certificatesEarned: 0
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Get the current session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLearnerData = async () => {
      if (!session?.user) return;
      
      setLoading(true);
      
      try {
        // Check if onboarding is completed
        const { data: profileData } = await supabase
          .from('learner_profiles')
          .select('onboarding_completed, learning_preferences')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileData) {
          setOnboardingCompleted(profileData.onboarding_completed || false);
          setShowOnboarding(!profileData.onboarding_completed);
        } else {
          setShowOnboarding(true);
        }
        
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            course:courses (
              id,
              title,
              description,
              estimated_duration,
              module_count,
              created_at
            ),
            progress,
            rag_status,
            completed_modules,
            due_date,
            created_at
          `)
          .eq('user_id', session.user.id);
          
        if (coursesError) throw coursesError;
        
        if (coursesData) {
          // Properly type the course enrollment data
          const enrollments = coursesData as unknown as CourseEnrollment[];
          setCourses(enrollments.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            progress: enrollment.progress || 0,
            ragStatus: (enrollment.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
            dueDate: enrollment.due_date,
            moduleCount: enrollment.course.module_count || 0,
            completedModules: enrollment.completed_modules || 0,
            estimatedTimeToComplete: `${enrollment.course.estimated_duration || 1}h`
          })));
        }
        
        // Fetch learning paths
        const { data: pathsData, error: pathsError } = await supabase
          .from('learning_path_enrollments')
          .select(`
            id,
            learning_path:learning_paths (
              id,
              title,
              description,
              course_count,
              created_at
            ),
            progress,
            rag_status,
            completed_courses,
            created_at
          `)
          .eq('user_id', session.user.id);
          
        if (pathsError) throw pathsError;
        
        if (pathsData) {
          // Properly type the learning path enrollment data
          const enrollments = pathsData as unknown as LearningPathEnrollment[];
          setLearningPaths(enrollments.map(enrollment => ({
            id: enrollment.learning_path.id,
            title: enrollment.learning_path.title,
            description: enrollment.learning_path.description,
            progress: enrollment.progress || 0,
            ragStatus: (enrollment.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
            courseCount: enrollment.learning_path.course_count || 0,
            completedCourses: enrollment.completed_courses || 0
          })));
        }
        
        // Fetch learner stats
        const { data: statsData, error: statsError } = await supabase
          .from('learner_statistics')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (statsError && statsError.code !== 'PGRST116') throw statsError;
        
        if (statsData) {
          setStats({
            coursesInProgress: statsData.courses_in_progress || 0,
            coursesCompleted: statsData.courses_completed || 0,
            totalTimeSpent: `${statsData.total_time_spent || 0}h`,
            averageScore: statsData.average_score || 0,
            certificatesEarned: statsData.certificates_earned || 0
          });
        }
        
      } catch (error) {
        console.error('Error fetching learner data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLearnerData();
  }, [session]);
  
  const handleStartOnboarding = () => {
    navigate(`${ROUTES.LEARNER_DASHBOARD}/onboarding`);
  };
  
  const handleContinueCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  const handleViewLearningPath = (pathId: string) => {
    navigate(`/learning-path/${pathId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Learner Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24">
              <CardContent className="p-6">
                <Skeleton className="w-full h-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-3/4 h-8 mb-2" />
                <Skeleton className="w-full h-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (showOnboarding && !onboardingCompleted) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Welcome to Your Learning Journey</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete Your Onboarding</CardTitle>
            <CardDescription>
              Let's personalize your learning experience. Tell us about your preferences and goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              To get the most out of your learning experience, we need to understand your:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Preferred learning style (visual, auditory, reading/writing, or kinesthetic)</li>
              <li>Content format preferences (videos, articles, interactive exercises, etc.)</li>
              <li>Learning goals and objectives</li>
              <li>Time availability for learning</li>
            </ul>
            <p>
              This will help our AI system create a personalized learning path just for you.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartOnboarding}>Start Onboarding</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Learning Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">In Progress</p>
            <h3 className="text-2xl font-bold">{stats.coursesInProgress}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Award className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Completed</p>
            <h3 className="text-2xl font-bold">{stats.coursesCompleted}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Clock className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Time Spent</p>
            <h3 className="text-2xl font-bold">{stats.totalTimeSpent}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <BarChart2 className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Avg. Score</p>
            <h3 className="text-2xl font-bold">{stats.averageScore}%</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Award className="h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Certificates</p>
            <h3 className="text-2xl font-bold">{stats.certificatesEarned}</h3>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
            {courses.length === 0 ? (
              <Alert>
                <AlertTitle>No courses yet</AlertTitle>
                <AlertDescription>
                  You don't have any courses assigned. Check the recommendations tab or contact your HR department.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription className="mt-1">{course.description}</CardDescription>
                        </div>
                        <RAGStatusBadge status={course.ragStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Progress value={course.progress} className="h-2 mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{course.progress}% Complete</span>
                        <span>{course.completedModules}/{course.moduleCount} Modules</span>
                      </div>
                      <div className="flex items-center mt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{course.estimatedTimeToComplete}</span>
                        {course.dueDate && (
                          <>
                            <Calendar className="h-4 w-4 ml-4 mr-1" />
                            <span>Due: {new Date(course.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleContinueCourse(course.id)}>
                        Continue Learning
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Learning Paths Tab */}
        <TabsContent value="paths">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">My Learning Paths</h2>
            {learningPaths.length === 0 ? (
              <Alert>
                <AlertTitle>No learning paths yet</AlertTitle>
                <AlertDescription>
                  You don't have any learning paths assigned. Check with your HR department.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {learningPaths.map((path) => (
                  <Card key={path.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{path.title}</CardTitle>
                          <CardDescription className="mt-1">{path.description}</CardDescription>
                        </div>
                        <RAGStatusBadge status={path.ragStatus} />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Progress value={path.progress} className="h-2 mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{path.progress}% Complete</span>
                        <span>{path.completedCourses}/{path.courseCount} Courses</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleViewLearningPath(path.id)}>
                        View Learning Path
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Personalized Recommendations</h2>
            <Alert className="mb-4">
              <AlertTitle className="flex items-center">
                <BellIcon className="h-4 w-4 mr-2" />
                AI-Powered Recommendations
              </AlertTitle>
              <AlertDescription>
                Based on your profile, learning history, and career goals, our AI system has recommended the following courses.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* This would be populated by AI recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Communication Skills</CardTitle>
                  <CardDescription>
                    Enhance your professional communication in various workplace scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">
                    <Badge variant="outline" className="mr-2">Recommended for you</Badge>
                    <Badge variant="outline">4 hours</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This course aligns with your career goals and builds on your previous learning history.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">View Course</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Data Analysis Fundamentals</CardTitle>
                  <CardDescription>
                    Learn essential data analysis skills applicable to your department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">
                    <Badge variant="outline" className="mr-2">Trending in your role</Badge>
                    <Badge variant="outline">6 hours</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This course is popular among peers in your role and department.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">View Course</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnerDashboardPage;
