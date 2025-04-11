
import React from 'react';
import { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonalizedContentService } from '@/services/personalized-content-service';

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
  const [personalizedCourses, setPersonalizedCourses] = useState<Set<string>>(new Set());
  
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
        .select('course_id, personalized_content_id')
        .eq('employee_id', employeeId);
      
      if (enrollmentError) {
        throw enrollmentError;
      }
      
      if (!enrollments || enrollments.length === 0) {
        setEnrolledCourses([]);
        return;
      }
      
      // Track which courses already have personalized content
      const personalizedCourseIds = new Set<string>();
      enrollments.forEach(enrollment => {
        if (enrollment.personalized_content_id) {
          personalizedCourseIds.add(enrollment.course_id);
        }
      });
      
      setPersonalizedCourses(personalizedCourseIds);
      
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
      console.log(`Fetched ${courses.length} enrolled courses`);
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
      // First fetch employee profile data to check if CV data is available
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          id,
          name,
          cv_extracted_data,
          department_id,
          position_id
        `)
        .eq('id', employeeId)
        .single();
      
      if (employeeError) {
        throw new Error(`Failed to fetch employee data: ${employeeError.message}`);
      }
      
      if (!employeeData.cv_extracted_data) {
        throw new Error("Employee does not have any CV data. Please upload and extract CV data first.");
      }
      
      console.log('Enhancing course content with employee profile:', {
        employeeId,
        courseId,
        hasExtractedData: !!employeeData.cv_extracted_data
      });

      // Use the universal enhance endpoint for content personalization
      console.log('Enhancing course content...');
      const enhanceResponse = await fetch('/api/hr/courses/universal-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeId,
          courseId,
          debug: true // Request verbose logs for debugging
        }),
      });

      // Check if response is OK
      if (!enhanceResponse.ok) {
        // Try to get error details
        let errorMessage = 'Failed to enhance course content';
        try {
          const errorData = await enhanceResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('Server returned error:', errorData);
        } catch {
          errorMessage = `Server error (${enhanceResponse.status}): ${await enhanceResponse.text() || 'Could not process response'}`;
        }
        throw new Error(errorMessage);
      }

      // Parse the JSON response
      const data = await enhanceResponse.json();
      console.log('Content enhancement response:', data);
      
      if (data.success) {
        // Add this course to personalized courses set
        setPersonalizedCourses(prev => new Set([...prev, courseId]));
        
        toast({
          title: 'Success!',
          description: `Personalized content created for "${data.course?.title || courseTitle}". The content has been tailored to your profile.`,
          variant: 'default',
        });
        
        // Refresh the list of courses to show updated personalization status
        fetchEnrolledCourses();
        return;
      } else {
        throw new Error(data.error || 'Unknown error occurred during enhancement');
      }
    } catch (error) {
      console.error('Error enhancing course content:', error);
      
      toast({
        title: 'Failed to enhance course content',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setEnhancingCourseId(null);
    }
  };

  const isPersonalized = (courseId: string) => {
    return personalizedCourses.has(courseId);
  };

  // Don't render if no employee ID
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
      <DropdownMenuContent align="end" className="w-64">
        {enrolledCourses.map((course) => (
          <DropdownMenuItem
            key={course.id}
            onClick={() => enhanceCourseContent(course.id, course.title)}
            disabled={isLoading}
            className="flex items-center justify-between"
          >
            <span className="truncate mr-2">{course.title}</span>
            {isLoading && enhancingCourseId === course.id ? (
              <Loader2 className="h-4 w-4 animate-spin ml-auto" />
            ) : isPersonalized(course.id) ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-auto">
                Personalized
              </span>
            ) : (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-auto">
                Standard
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem 
          className="border-t mt-2 pt-2 text-xs text-center flex justify-center"
          onClick={() => fetchEnrolledCourses()}
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh courses
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhanceCourseContentButton;
