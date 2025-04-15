import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PersonalizedContentGenerationStatus from '@/components/courses/PersonalizedContentGenerationStatus';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface RegenerateContentButtonProps {
  courseId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function RegenerateContentButton({ courseId, onSuccess, onError }: RegenerateContentButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // Function to manually trigger job processing
  const triggerJobProcessing = async (jobId: string) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_VERCEL_URL || '';
      const apiUrl = `${baseUrl}/api/hr/courses/personalize-content/process`;
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const authToken = session?.access_token;
      if (!authToken) throw new Error('No valid session found');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${await response.text()}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Job processing error:', error);
      throw error;
    }
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    const requestId = `regen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      console.log(`[${requestId}] 🔄 Starting content regeneration for course:`, courseId);
      
      // Get Supabase token directly - first approach
      console.log(`[${requestId}] 🔐 Retrieving Supabase auth session`);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[${requestId}] ❌ Auth Error: Failed to get Supabase session:`, {
          error: sessionError,
          errorCode: sessionError.code,
          errorMessage: sessionError.message,
          stack: sessionError.stack
        });
      }
      
      // Authentication with multiple fallbacks
      const authToken = 
        sessionData?.session?.access_token || 
        localStorage.getItem('supabase.auth.token');
      
      if (!authToken) {
        console.error(`[${requestId}] ❌ Auth Error: No authentication token available`, {
          sessionExists: !!sessionData?.session,
          localStorageTokenExists: !!localStorage.getItem('supabase.auth.token'),
          courseId
        });
        throw new Error('Authentication error: No valid session found. Please sign in again.');
      }
      
      console.log(`[${requestId}] ✅ Authentication token retrieved successfully`);
      
      // Try the legacy API endpoint first - more reliable in production
      const legacyEndpoint = '/api/hr/courses/regenerate-content';
      console.log(`[${requestId}] 🚀 Calling ${legacyEndpoint} with auth token`, {
        method: 'POST',
        courseId,
        endpoint: legacyEndpoint,
        authTokenLength: authToken.length,
        authTokenPrefix: authToken.substring(0, 10) + '...'
      });
      
      const requestStartTime = Date.now();
      const response = await fetch(legacyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          courseId,
          forceRegenerate: true,
          access_token: authToken,  // Include in body as fallback
        }),
        credentials: 'include',
      });
      const requestDuration = Date.now() - requestStartTime;
      
      // Detailed error logging
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`[${requestId}] ❌ API Error (${response.status}):`, {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorDetails,
          endpoint: legacyEndpoint,
          courseId,
          requestDuration: `${requestDuration}ms`,
          headers: Object.fromEntries([...response.headers.entries()].map(([k, v]) => 
            [k, k.toLowerCase().includes('auth') ? '***' : v]
          )),
          contentType: response.headers.get('content-type')
        });
        
        // For 401 errors, try alternative auth method
        if (response.status === 401) {
          console.log(`[${requestId}] 🔄 Authentication failed (401), trying alternative approach...`);
          
          // Get a fresh token if available
          console.log(`[${requestId}] 🔐 Requesting fresh auth token`);
          const { data: tokenData, error: freshTokenError } = await supabase.auth.getSession();
          
          if (freshTokenError) {
            console.error(`[${requestId}] ❌ Fresh token retrieval failed:`, {
              error: freshTokenError,
              errorCode: freshTokenError.code,
              errorMessage: freshTokenError.message,
              stack: freshTokenError.stack
            });
          }
          
          const freshToken = tokenData?.session?.access_token || authToken;
          
          // Try the API with token in query parameter as fallback
          const fallbackUrl = `/api/hr/courses/regenerate-content?access_token=${encodeURIComponent(freshToken)}`;
          console.log(`[${requestId}] 🚀 Attempting fallback request to:`, {
            endpoint: fallbackUrl,
            method: 'POST',
            courseId,
            usingFreshToken: !!tokenData?.session?.access_token,
            tokenLength: freshToken.length,
            tokenPrefix: freshToken.substring(0, 10) + '...'
          });
          
          const fallbackStartTime = Date.now();
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              courseId,
              forceRegenerate: true,
            }),
            credentials: 'include',
          });
          const fallbackDuration = Date.now() - fallbackStartTime;
          
          if (!fallbackResponse.ok) {
            const routerErrorDetails = await fallbackResponse.text();
            console.error(`[${requestId}] ❌ Fallback API Error (${fallbackResponse.status}):`, {
              status: fallbackResponse.status,
              statusText: fallbackResponse.statusText,
              responseBody: routerErrorDetails,
              endpoint: fallbackUrl,
              courseId,
              requestDuration: `${fallbackDuration}ms`,
              headers: Object.fromEntries([...fallbackResponse.headers.entries()].map(([k, v]) => 
                [k, k.toLowerCase().includes('auth') ? '***' : v]
              )),
              contentType: fallbackResponse.headers.get('content-type')
            });
            throw new Error(`Failed to regenerate content: ${fallbackResponse.statusText}`);
          }
          
          const responseData = await fallbackResponse.json();
          console.log(`[${requestId}] ✅ Content regeneration successful via fallback approach:`, {
            response: responseData,
            endpoint: fallbackUrl,
            requestDuration: `${fallbackDuration}ms`,
            courseId
          });
          
          // Show progress tracking
          if (responseData.job_id) {
            setJobId(responseData.job_id);
            setShowProgressDialog(true);
            
            // Manually trigger job processing
            setTimeout(async () => {
              await triggerJobProcessing(responseData.job_id);
            }, 500);
          }
          
          toast({
            title: 'Course content regenerating',
            description: 'Your personalized course content is being generated. This may take a moment.',
          });
          
          if (onSuccess) {
            onSuccess();
          }
          
          return;
        }
        
        throw new Error(`Failed to regenerate content: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[${requestId}] ✅ Content regeneration successful:`, {
        response: responseData,
        endpoint: legacyEndpoint,
        requestDuration: `${requestDuration}ms`,
        courseId
      });
      
      // Show progress tracking
      if (responseData.job_id) {
        setJobId(responseData.job_id);
        setShowProgressDialog(true);
        
        // Manually trigger job processing
        setTimeout(async () => {
          await triggerJobProcessing(responseData.job_id);
        }, 500);
      }
      
      toast({
        title: 'Course content regenerating',
        description: 'Your personalized course content is being generated. This may take a moment.',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`[${requestId}] ❌ Error regenerating course content:`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        courseId,
        timestamp: new Date().toISOString(),
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
        }
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to regenerate course content. Please try again.',
        variant: 'destructive',
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      console.log(`[${requestId}] 🏁 Content regeneration process completed`);
      setIsLoading(false);
    }
  };

  const handleGenerationComplete = () => {
    setShowProgressDialog(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRegenerate}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {isLoading ? 'Regenerating...' : 'Regenerate Content'}
      </Button>

      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="p-2">
            <h2 className="text-xl font-semibold mb-4">Regenerating Course Content</h2>
            <PersonalizedContentGenerationStatus 
              initialIsGenerating={true}
              jobId={jobId}
              courseId={courseId}
              onGenerationComplete={handleGenerationComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 