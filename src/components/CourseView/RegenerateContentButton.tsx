
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
      
      // Call the App Router API endpoint instead of the older API route
      const response = await fetch(`/api/courses/${courseId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        throw new Error('Failed to regenerate content');
      }
      
      const data = await response.json();
      
      // Show success toast
      toast({
        title: 'Content Regenerated',
        description: 'Your personalized course content has been regenerated.',
        duration: 3000
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess && data.course) {
        onSuccess(data.course);
      } else {
        // Force page refresh as fallback
        window.location.reload();
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to regenerate course content. Please try again.',
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
