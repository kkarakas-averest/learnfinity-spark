import React from '@/lib/react-helpers';
import { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhanceCourseContentButtonProps {
  employeeId: string;
  disabled?: boolean;
  className?: string;
}

interface Course {
  id: string;
  title: string;
}

/**
 * Button with dropdown to select and enhance enrolled courses with personalized content
 * Uses the employee's CV extracted data to tailor course content to their profile
 */
const EnhanceCourseContentButton: React.FC<EnhanceCourseContentButtonProps> = ({
  employeeId,
  disabled = false,
  className = '',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [enhancingCourseId, setEnhancingCourseId] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  
  // Fetch enrolled courses when the component mounts
  useEffect(() => {
    if (employeeId) {
      fetchEnrolledCourses();
    }
  }, [employeeId]);

  const fetchEnrolledCourses = async () => {
    if (!employeeId) return;
    
    setIsLoadingCourses(true);
    
    try {
      // First get the course IDs from enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('hr_course_enrollments')
        .select('course_id')
        .eq('employee_id', employeeId);
      
      if (enrollmentError) {
        throw enrollmentError;
      }
      
      if (!enrollments || enrollments.length === 0) {
        setEnrolledCourses([]);
        return;
      }
      
      // Get the course details for each enrolled course
      const courseIds = enrollments.map(e => e.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('hr_courses')
        .select('id, title')
        .in('id', courseIds);
      
      if (coursesError) {
        throw coursesError;
      }
      
      // Convert to our Course interface type
      const courses: Course[] = coursesData.map(course => ({
        id: course.id,
        title: course.title
      }));
      
      setEnrolledCourses(courses);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast({
        title: 'Failed to load courses',
        description: 'Could not load enrolled courses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const enhanceCourseContent = async (courseId: string, courseTitle: string) => {
    if (!employeeId || isLoading) return;
    
    setIsLoading(true);
    setEnhancingCourseId(courseId);

    try {
      const response = await fetch('/api/hr/courses/enhance-course-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeId,
          courseId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to enhance course content');
      }

      toast({
        title: 'Success!',
        description: `Personalized content created for "${courseTitle}". The content has been tailored to the employee's profile.`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error enhancing course content:', error);
      
      toast({
        title: 'Failed to enhance course content',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setEnhancingCourseId(null);
    }
  };

  // Don't render if no employee ID or no CV data
  if (!employeeId) return null;

  // Show a simplified button if there are no enrolled courses
  if (enrolledCourses.length === 0 && !isLoadingCourses) {
    return (
      <Button
        disabled={true}
        className={className}
        variant="outline"
      >
        No courses to enhance
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={className}
          variant="default"
          disabled={disabled || isLoading || isLoadingCourses || enrolledCourses.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enhancing course...
            </>
          ) : isLoadingCourses ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading courses...
            </>
          ) : (
            'Personalize Course Content'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {enrolledCourses.map((course) => (
          <DropdownMenuItem
            key={course.id}
            onClick={() => enhanceCourseContent(course.id, course.title)}
            disabled={isLoading && enhancingCourseId === course.id}
            className="flex items-center"
          >
            {isLoading && enhancingCourseId === course.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              course.title
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhanceCourseContentButton; 