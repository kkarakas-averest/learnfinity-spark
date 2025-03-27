import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen,
  CheckCircle
} from 'lucide-react';
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
  lastAccessed?: string;
}

const LearnerCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<'all' | 'inProgress' | 'completed'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }
        
        // Fetch course enrollments for the current user
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
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
            created_at,
            last_accessed,
            status
          `)
          .eq('user_id', session.user.id);
          
        if (enrollmentsError) throw enrollmentsError;
        
        if (enrollmentsData) {
          // Map the enrollments data to the Course interface
          const coursesData = enrollmentsData.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            progress: enrollment.progress || 0,
            ragStatus: (enrollment.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
            dueDate: enrollment.due_date,
            moduleCount: enrollment.course.module_count || 0,
            completedModules: enrollment.completed_modules || 0,
            estimatedTimeToComplete: `${enrollment.course.estimated_duration || 1}h`,
            lastAccessed: enrollment.last_accessed,
            status: enrollment.status
          }));
          
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [navigate]);
  
  const filteredCourses = courses.filter(course => {
    if (filter === 'inProgress') return course.progress > 0 && course.progress < 100;
    if (filter === 'completed') return course.progress === 100;
    return true; // for 'all' filter
  });
  
  const handleContinueCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  const renderCourseCard = (course: Course) => (
    <Card key={course.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{course.title}</CardTitle>
            <CardDescription className="mt-1">{course.description}</CardDescription>
          </div>
          <RAGStatusBadge status={course.ragStatus} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              <span>{course.completedModules} / {course.moduleCount} modules</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{course.estimatedTimeToComplete}</span>
            </div>
            {course.dueDate && (
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>Due: {new Date(course.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
          
          {course.lastAccessed && (
            <div className="text-sm text-muted-foreground">
              Last accessed: {new Date(course.lastAccessed).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => handleContinueCourse(course.id)}
          variant={course.progress === 100 ? "outline" : "default"}
        >
          {course.progress === 100 ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Review Course
            </>
          ) : (
            <>
              {course.progress > 0 ? 'Continue Course' : 'Start Course'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
  
  const renderSkeletonCard = () => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'inProgress' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('inProgress')}
          >
            In Progress
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index}>{renderSkeletonCard()}</div>
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map(course => renderCourseCard(course))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? "You haven't been enrolled in any courses yet."
                  : filter === 'inProgress'
                    ? "You don't have any courses in progress."
                    : "You haven't completed any courses yet."}
              </p>
              {filter !== 'all' && (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  View all courses
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LearnerCoursesPage;
