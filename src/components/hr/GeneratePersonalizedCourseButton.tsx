import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface GeneratePersonalizedCourseButtonProps {
  employeeId: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Button to generate a personalized course for an employee
 * Uses the employee's CV extracted data to generate a course relevant to their profile
 */
const GeneratePersonalizedCourseButton: React.FC<GeneratePersonalizedCourseButtonProps> = ({
  employeeId,
  disabled = false,
  className = '',
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateCourse = async () => {
    if (!employeeId || isGenerating) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/hr/courses/generate-for-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate course');
      }

      toast({
        title: 'Success!',
        description: `Personalized course "${data.title}" has been generated and the employee has been enrolled.`,
        variant: 'default',
      });

      // Optionally redirect to the course page
      // window.location.href = `/hr-dashboard/courses/${data.courseId}`;
    } catch (error: any) {
      console.error('Error generating course:', error);
      
      toast({
        title: 'Failed to generate course',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateCourse}
      disabled={disabled || isGenerating || !employeeId}
      className={className}
      variant="default"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating course...
        </>
      ) : (
        'Generate Personalized Course'
      )}
    </Button>
  );
};

export default GeneratePersonalizedCourseButton; 