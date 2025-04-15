'use client';

import React, { useState, useEffect, useCallback } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PersonalizedContentGenerationStatus from '@/components/courses/PersonalizedContentGenerationStatus';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSupabase } from '@/components/providers/supabase-provider';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { supabase } = useSupabase();

  const triggerJobProcessing = useCallback(async (jobId: string) => {
    console.log(`🔄 Attempting to trigger job processing for: ${jobId}`);
    setIsProcessing(true);

    try {
      // Get Supabase session for auth token
      const session = await supabase.auth.getSession();
      const authToken = session?.data?.session?.access_token;

      if (!authToken) {
        console.error('❌ No authentication token available');
        throw new Error('Authentication required');
      }

      // First try the proxy endpoint
      try {
        console.log(`📡 Calling proxy endpoint for job ${jobId}`);
        const proxyResponse = await fetch(`/api/proxy-process-job?job_id=${jobId}`, {
          method: 'GET', // Use GET as the primary method
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (proxyResponse.ok) {
          const result = await proxyResponse.json();
          console.log(`✅ Proxy endpoint response:`, result);
          setIsProcessing(false);
          return;
        }
        
        console.warn(`⚠️ Proxy endpoint failed with status ${proxyResponse.status}. Trying POST method...`);
        
        // If GET fails, try with POST to the proxy
        const proxyPostResponse = await fetch(`/api/proxy-process-job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ job_id: jobId })
        });
        
        if (proxyPostResponse.ok) {
          const result = await proxyPostResponse.json();
          console.log(`✅ Proxy POST endpoint response:`, result);
          setIsProcessing(false);
          return;
        }
        
        console.warn(`⚠️ Proxy POST endpoint failed with status ${proxyPostResponse.status}. Trying direct API...`);
      } catch (proxyError) {
        console.error(`❌ Error with proxy endpoint:`, proxyError);
        // Continue to try the direct endpoint
      }

      // Fallback to the direct API endpoint
      console.log(`📡 Calling direct API endpoint for job ${jobId}`);
      
      // First attempt with POST (the correct method per route.ts)
      const directResponse = await fetch('/api/hr/courses/personalize-content/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ job_id: jobId })
      });

      if (!directResponse.ok) {
        console.warn(`⚠️ Direct API endpoint failed with status ${directResponse.status}: ${directResponse.statusText}`);
        
        // Try one more time with GET in case the endpoint supports both methods
        const directGetResponse = await fetch(`/api/hr/courses/personalize-content/process?job_id=${jobId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!directGetResponse.ok) {
          throw new Error(`Failed to process job: ${directGetResponse.status} ${directGetResponse.statusText}`);
        }
        
        const result = await directGetResponse.json();
        console.log(`✅ Direct GET API response:`, result);
      } else {
        const result = await directResponse.json();
        console.log(`✅ Direct POST API response:`, result);
      }

    } catch (error) {
      console.error('❌ Error processing job:', error);
      toast({
        title: "Error",
        description: `Failed to process job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [courseId, supabase]);

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
          <DialogTitle>Regenerating Course Content</DialogTitle>
          <DialogDescription>
            Your personalized course content is being generated. This may take a few moments.
          </DialogDescription>
          <div className="p-2">
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