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
      // First fetch employee profile data to include in request
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
      
      // Fetch department and position data separately
      let departmentName = '';
      let positionTitle = '';
      
      if (employeeData.department_id) {
        const { data: departmentData } = await supabase
          .from('hr_departments')
          .select('name')
          .eq('id', employeeData.department_id)
          .single();
          
        if (departmentData) {
          departmentName = departmentData.name;
        }
      }
      
      if (employeeData.position_id) {
        const { data: positionData } = await supabase
          .from('hr_positions')
          .select('title')
          .eq('id', employeeData.position_id)
          .single();
          
        if (positionData) {
          positionTitle = positionData.title;
        }
      }
      
      // Prepare employee profile data
      const employeeProfile = {
        name: employeeData.name,
        role: positionTitle,
        department: departmentName,
        cv_extracted_data: employeeData.cv_extracted_data || null
      };
      
      console.log('Enhancing course content with employee profile:', {
        employeeId,
        courseId,
        profileDataAvailable: !!employeeData.cv_extracted_data
      });

      // STEP 1: Mirror the HR course to the main courses table first
      console.log('Mirroring HR course to main courses table...');
      const mirrorResponse = await fetch('/api/hr/courses/mirror-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          courseId
        }),
      });
      
      if (!mirrorResponse.ok) {
        const errorText = await mirrorResponse.text();
        let errorMessage = 'Failed to mirror HR course';
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, create a readable error message from the text
          console.error('Non-JSON error response from mirror endpoint:', errorText);
          errorMessage = `Error (${mirrorResponse.status}): ${errorText.substring(0, 100)}...`;
        }
        
        throw new Error(errorMessage);
      }
      
      const mirrorData = await mirrorResponse.json();
      console.log('Mirror result:', mirrorData);
      
      // Check if the course was successfully mirrored or already existed
      // Add debugging to verify the structure of the response
      console.log('Mirror data structure:', {
        mirrored: mirrorData.results.mirrored,
        skipped: mirrorData.results.skipped,
        courseId
      });
      
      // Fix the verification check to handle empty arrays properly
      let courseMirrored = false;
      
      // Check if course was mirrored successfully
      if (mirrorData.results.mirrored && mirrorData.results.mirrored.length > 0) {
        courseMirrored = mirrorData.results.mirrored.some((c) => c.courseId === courseId);
      }
      
      // Check if course was skipped (already exists)
      if (!courseMirrored && mirrorData.results.skipped && mirrorData.results.skipped.length > 0) {
        courseMirrored = mirrorData.results.skipped.some((c) => c.courseId === courseId);
      }
      
      // If neither mirrored nor skipped, check if hrCourses was empty
      if (!courseMirrored && mirrorData.summary && mirrorData.summary.total === 0) {
        console.warn('No HR courses found to mirror');
        // If the endpoint found no courses to mirror, it might mean the course doesn't exist
        // Let's continue anyway and let the universal endpoint handle it
        courseMirrored = true;
      }
        
      if (!courseMirrored) {
        console.error('Course mirroring verification failed:', {
          courseId,
          mirrorData
        });
        throw new Error('Failed to mirror course. Please check the course data.');
      }

      // STEP 2: Now enhance the course content using the universal endpoint
      console.log('Enhancing course content...');
      const enhanceResponse = await fetch('/api/hr/courses/universal-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          employeeId,
          courseId 
        }),
      });

      // First check if response is OK
      if (!enhanceResponse.ok) {
        const errorText = await enhanceResponse.text();
        let errorMessage = 'Failed to enhance course content';
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If not JSON, create a readable error message from the text
          console.error('Non-JSON error response from enhance endpoint:', errorText);
          errorMessage = `Error (${enhanceResponse.status}): ${errorText.substring(0, 100)}...`;
        }
        
        throw new Error(errorMessage);
      }

      // If response is OK, proceed with JSON parsing
      const data = await enhanceResponse.json();
      
      // For our universal endpoint, the response format is different
      if (data.success) {
        toast({
          title: 'Success!',
          description: `Personalized content created for "${data.course.title}" with your profile details.`,
          variant: 'default',
        });
        return;
      }

      toast({
        title: 'Success!',
        description: `Personalized content created for "${courseTitle}". The content has been tailored to your profile.`,
        variant: 'default',
      });
    } catch (error) {
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