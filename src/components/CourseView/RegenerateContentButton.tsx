import React, { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';

interface RegenerateContentButtonProps {
  courseId: string;
  onSuccess?: (course: any) => void;
}

export function RegenerateContentButton({ courseId, onSuccess }: RegenerateContentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRegenerate = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to regenerate content
      // Use the new App Router API endpoint
      const response = await fetch(`/api/hr/courses/regenerate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add credentials to ensure auth cookies are sent
        credentials: 'include',
        body: JSON.stringify({
          courseId: courseId,
          forceRegenerate: true,
          personalizationOptions: {
            learning_preferences: {
              includeExamples: true,
              includeQuizzes: true,
              contentFormat: 'mixed'
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to regenerate content:', errorData.error || response.statusText);
        throw new Error(errorData.error || 'Failed to regenerate content');
      }
      
      const data = await response.json();
      
      // Show success toast
      toast({
        title: 'Content Regeneration Started',
        description: 'Your personalized course content is being regenerated. This may take a moment.',
        duration: 5000
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess && data.course) {
        onSuccess(data.course);
      } else {
        // Wait briefly, then force page refresh
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to regenerate course content. Please try again.',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={isLoading}
      className="flex items-center gap-1"
    >
      {isLoading ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
      {isLoading ? 'Generating...' : 'Regenerate Content'}
    </Button>
  );
} 