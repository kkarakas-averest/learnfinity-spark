import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Check, Clock, BookOpen, FileText, Award, ArrowLeft, PlayCircle, Star } from 'lucide-react';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useLearningData } from '@/hooks/useLearningData';
import { AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialog, AlertDialogAction } from '@/components/ui/alert-dialog';

// Create local constants for React hooks
const { useState, useEffect } = React;

// Local utility functions
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0m";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
  }
  
  return `${minutes}m`;
};

const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Types
interface Module {
  id: string;
  title: string;
  description: string;
  order_number: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: 'video' | 'document' | 'quiz';
  content_url: string;
  duration: number;
  order_number: number;
  is_completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration: number;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
  modules: Module[];
}

// Create a mock representation of enrollment data
// Since the actual enrollment data isn't available in the hook
interface EnrollmentData {
  id: string;
  course_id: string;
  created_at: string;
}

// Create a mock representation of lesson completion data
// Since the actual lesson completion data isn't available in the hook
interface LessonCompletionData {
  id: string;
  lesson_id: string;
  completed_at: string;
}

// Type declaration for a course that has modules
interface CourseWithModules extends Course {
  modules: Module[];
}

// Header Component
const CourseHeader = ({ course, onBack }: { course: Course; onBack: () => void }) => (
  <div className="flex flex-col space-y-4 px-4 md:px-8 py-6 bg-card rounded-lg shadow-sm mb-6">
    <div className="flex items-center gap-2 mb-2">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Badge variant="outline" className="ml-2">{course.category}</Badge>
      <Badge variant="secondary">{course.level}</Badge>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 lg:col-span-2">
        <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
        <p className="mt-2 text-muted-foreground">{course.description}</p>
      </div>
      <div className="col-span-1 flex flex-col justify-end gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDuration(course.duration)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Enrollment Section Component
const EnrollmentSection = ({ 
  course, 
  isEnrolled, 
  isLoading, 
  onEnroll 
}: { 
  course: Course; 
  isEnrolled: boolean; 
  isLoading: boolean; 
  onEnroll: () => void 
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Course Enrollment</CardTitle>
      <CardDescription>
        {isEnrolled
          ? "You're enrolled in this course. Continue your learning journey."
          : "Enroll to track your progress and unlock all course content."}
      </CardDescription>
    </CardHeader>
    <CardFooter>
      {isEnrolled ? (
        <Link to="#course-content">
          <Button variant="default">Continue Learning</Button>
        </Link>
      ) : (
        <Button onClick={onEnroll} disabled={isLoading}>
          {isLoading ? "Processing..." : "Enroll in Course"}
        </Button>
      )}
    </CardFooter>
  </Card>
);

// Progress Card Component
const ProgressCard = ({ completedCount, totalCount }: { completedCount: number; totalCount: number }) => {
  const progressPercentage = calculateProgress(completedCount, totalCount);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Track your journey through this course</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{completedCount} of {totalCount} lessons completed</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Award className="h-4 w-4" />
          {progressPercentage === 100 ? (
            <span className="text-green-600 font-medium">Course Completed!</span>
          ) : (
            <span>Complete the course to earn your certificate</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Content Type Icon Component
const ContentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'video':
      return <PlayCircle className="h-4 w-4" />;
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'quiz':
      return <Award className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

// Lesson Item Component
const LessonItem = ({ 
  lesson, 
  isEnrolled, 
  isCompleted, 
  onSelectLesson 
}: { 
  lesson: Lesson; 
  isEnrolled: boolean; 
  isCompleted: boolean; 
  onSelectLesson: (lesson: Lesson) => void 
}) => (
  <div
    className={`p-4 flex items-center justify-between cursor-pointer rounded-md ${
      isCompleted ? "bg-muted" : "hover:bg-muted/50"
    }`}
    onClick={() => isEnrolled && onSelectLesson(lesson)}
  >
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        {isCompleted ? (
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-border flex items-center justify-center">
            <ContentTypeIcon type={lesson.content_type} />
          </div>
        )}
      </div>
      <div>
        <h4 className={`text-sm font-medium ${!isEnrolled ? "text-muted-foreground" : ""}`}>
          {lesson.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDuration(lesson.duration)}
          </span>
        </div>
      </div>
    </div>
    {isEnrolled && (
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <PlayCircle className="h-4 w-4" />
      </Button>
    )}
  </div>
);

// Module Card Component
const ModuleCard = ({ 
  module, 
  isExpanded, 
  toggleExpand, 
  isEnrolled, 
  completedLessons,
  onSelectLesson
}: { 
  module: Module; 
  isExpanded: boolean; 
  toggleExpand: () => void; 
  isEnrolled: boolean;
  completedLessons: string[];
  onSelectLesson: (lesson: Lesson) => void;
}) => {
  const completedCount = module.lessons.filter(lesson => 
    completedLessons.includes(lesson.id)
  ).length;
  const progressPercentage = calculateProgress(completedCount, module.lessons.length);

  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer" 
        onClick={toggleExpand}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{module.title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {completedCount}/{module.lessons.length} lessons
            </span>
            <Progress value={progressPercentage} className="w-16 h-2" />
          </div>
        </div>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-2">
            {module.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isEnrolled={isEnrolled}
                isCompleted={completedLessons.includes(lesson.id)}
                onSelectLesson={onSelectLesson}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Lesson Content Viewer Component
const LessonContentViewer = ({ 
  lesson, 
  onMarkComplete 
}: { 
  lesson: Lesson; 
  onMarkComplete: (lessonId: string) => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);

  const markAsComplete = async () => {
    if (loading || lesson.is_completed) return;
    
    setLoading(true);
    await onMarkComplete(lesson.id);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lesson.title}</CardTitle>
        <CardDescription>{lesson.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-md overflow-hidden bg-muted mb-4">
          {lesson.content_type === 'video' ? (
            <iframe
              src={lesson.content_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <a 
                href={lesson.content_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-2"
              >
                View Document
              </a>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={markAsComplete}
          disabled={loading || lesson.is_completed}
          className="w-full"
        >
          {lesson.is_completed 
            ? <><Check className="mr-2 h-4 w-4" /> Completed</> 
            : (loading ? "Processing..." : "Mark as Complete")}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Course Detail Component
const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, coursesLoading, coursesError } = useCoursesData();
  const { 
    learnerCourses, 
    coursesLoading: learningDataLoading, 
    updateProgress, 
    isUpdatingProgress 
  } = useLearningData();

  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  // Mock data for enrollments since they aren't available in the hook
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<LessonCompletionData[]>([]);

  // Load course data
  useEffect(() => {
    if (!coursesLoading && !coursesError && courses.length > 0 && id) {
      const foundCourse = courses.find(c => c.id === id);
      
      if (foundCourse) {
        // Sort modules and lessons by order number
        // We need to cast foundCourse to CourseWithModules to satisfy TypeScript
        const courseWithModules = foundCourse as unknown as CourseWithModules;
        const sortedModules = [...courseWithModules.modules].sort((a, b) => a.order_number - b.order_number);
        const modulesWithSortedLessons = sortedModules.map(module => ({
          ...module,
          lessons: [...module.lessons].sort((a, b) => a.order_number - b.order_number)
        }));
        
        setCourse({
          ...courseWithModules,
          modules: modulesWithSortedLessons
        });
        
        // Expand the first module by default if there are modules
        if (modulesWithSortedLessons.length > 0) {
          setExpandedModules([modulesWithSortedLessons[0].id]);
        }
      } else {
        toast({
          title: "Course not found",
          description: "The requested course could not be found.",
          variant: "destructive"
        });
        navigate('/courses');
      }
    }
  }, [id, courses, coursesLoading, coursesError, navigate]);

  // Check enrollment status based on mock data
  useEffect(() => {
    if (course && user) {
      // Check if user is enrolled in this course
      const userEnrollment = enrollments.find(e => e.course_id === course.id);
      setIsEnrolled(!!userEnrollment);
      
      // Get completed lessons for this course from mock data
      const completedLessonIds = lessonCompletions.map(lc => lc.lesson_id);
      setCompletedLessons(completedLessonIds);
    }
  }, [course, user, enrollments, lessonCompletions]);

  const handleEnrollInCourse = async () => {
    if (!user || !course) return;
    
    setEnrollmentLoading(true);
    try {
      // Create a mock enrollment
      const newEnrollment: EnrollmentData = {
        id: `enroll-${Date.now()}`,
        course_id: course.id,
        created_at: new Date().toISOString()
      };
      
      // Add to mock enrollments
      setEnrollments(prev => [...prev, newEnrollment]);
      setIsEnrolled(true);
      
      toast({
        title: "Successfully enrolled!",
        description: "You're now enrolled in this course.",
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Enrollment failed",
        description: "There was an issue with your enrollment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleToggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleSelectLesson = (lesson: Lesson) => {
    // Add completed status to the lesson
    const lessonWithCompletion = {
      ...lesson,
      is_completed: completedLessons.includes(lesson.id)
    };
    setSelectedLesson(lessonWithCompletion);
    setActiveTab("lesson");
  };

  const handleMarkLessonComplete = async (lessonId: string) => {
    if (!user || !course) return;
    
    try {
      // Find the module for this lesson
      const moduleForLesson = course.modules.find(module => 
        module.lessons.some(lesson => lesson.id === lessonId)
      );
      
      if (!moduleForLesson) {
        throw new Error("Module not found for this lesson");
      }
      
      // In a real implementation, you would use updateProgress to update module progress
      // Here we're just using mock data
      
      // Add to mock lesson completions
      const newCompletion: LessonCompletionData = {
        id: `completion-${Date.now()}`,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      };
      
      setLessonCompletions(prev => [...prev, newCompletion]);
      
      // Mark the lesson as completed locally
      setCompletedLessons(prev => [...prev, lessonId]);
      
      // Update the selected lesson if it's the one being marked
      if (selectedLesson && selectedLesson.id === lessonId) {
        setSelectedLesson({ ...selectedLesson, is_completed: true });
      }
      
      toast({
        title: "Progress updated",
        description: "Lesson marked as complete!",
      });
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      toast({
        title: "Update failed",
        description: "There was an issue updating your progress.",
        variant: "destructive"
      });
    }
  };

  const handleGoBack = () => navigate(-1);

  if (coursesLoading || !course) {
    return (
      <div className="container py-12">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading course...</p>
        </div>
      </div>
    );
  }

  // Calculate total completion stats
  const totalLessons = course?.modules.reduce(
    (total, module) => total + module.lessons.length, 
    0
  ) || 0;
  const totalCompletedLessons = completedLessons.length;

  return (
    <div className="container py-6 md:py-12">
      <CourseHeader course={course} onBack={handleGoBack} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="col-span-1 space-y-6">
          {user ? (
            <>
              {!isEnrolled ? (
                <EnrollmentSection 
                  course={course} 
                  isEnrolled={isEnrolled}
                  isLoading={enrollmentLoading}
                  onEnroll={handleEnrollInCourse}
                />
              ) : (
                <ProgressCard 
                  completedCount={totalCompletedLessons} 
                  totalCount={totalLessons} 
                />
              )}
            </>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Please sign in to enroll in this course and track your progress.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link to="/login">
                  <Button>Sign In</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-1 lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="content">Course Content</TabsTrigger>
              {selectedLesson && isEnrolled && (
                <TabsTrigger value="lesson">Current Lesson</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="content" id="course-content">
              <h2 className="text-xl font-bold mb-4">Course Content</h2>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-4 pr-4">
                  {course.modules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      isExpanded={expandedModules.includes(module.id)}
                      toggleExpand={() => handleToggleModule(module.id)}
                      isEnrolled={isEnrolled}
                      completedLessons={completedLessons}
                      onSelectLesson={handleSelectLesson}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="lesson">
              {selectedLesson && (
                <LessonContentViewer 
                  lesson={selectedLesson} 
                  onMarkComplete={handleMarkLessonComplete} 
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
