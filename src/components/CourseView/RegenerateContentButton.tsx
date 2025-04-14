import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RegenerateContentButtonProps {
  courseId: string;
  onSuccess?: (course: any) => void;
}

export function RegenerateContentButton({ courseId, onSuccess }: RegenerateContentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Get auth token on component mount
  useEffect(() => {
    async function getToken() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          setToken(data.session.access_token);
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    
    getToken();
  }, []);
  
  const handleRegenerate = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to regenerate content
      // Use the new App Router API endpoint
      const response = await fetch(`/api/hr/courses/regenerate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
      
      // Alternative approach using URL parameter if CORS is an issue
      if (!response.ok && response.status === 401) {
        console.log('Trying alternative authentication method with URL parameter');
        
        // Try again with token as URL parameter
        const responseWithUrlParam = await fetch(`/api/hr/courses/regenerate-content?access_token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
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
        
        if (!responseWithUrlParam.ok) {
          const errorData = await responseWithUrlParam.json().catch(() => ({}));
          console.error('Failed after retry:', errorData.error || responseWithUrlParam.statusText);
          throw new Error(errorData.error || errorData.details || 'Failed to regenerate content');
        }
        
        const data = await responseWithUrlParam.json();
        handleSuccess(data);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to regenerate content:', errorData.error || response.statusText);
        throw new Error(errorData.error || errorData.details || 'Failed to regenerate content');
      }
      
      const data = await response.json();
      handleSuccess(data);
      
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
  
  const handleSuccess = (data: any) => {
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