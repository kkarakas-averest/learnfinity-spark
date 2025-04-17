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

      // Get the current deployment URL to avoid hardcoded domains
      const baseDomain = window.location.origin;
      console.log(`🌐 Using base domain: ${baseDomain}`);

      // Add cache-busting timestamp for all requests
      const timestamp = Date.now();
      const apiParams = `job_id=${jobId}&_t=${timestamp}`;
      
      // Define a function to handle API errors with comprehensive logging
      const handleApiError = (endpoint: string, method: string, error: any, response?: Response) => {
        console.error(`❌ Error with ${method} to ${endpoint}:`, error);
        
        if (response) {
          console.warn(`Response status: ${response.status} ${response.statusText}`);
          console.warn(`Response headers:`, Object.fromEntries([...response.headers.entries()]));
        }
        
        // Return false to indicate failure
        return false;
      };
      
      // Define all endpoints to try with detailed logging
      const endpoints = [
        {
          name: 'Proxy POST',
          method: 'POST',
          url: `/api/proxy-process-job`,
          body: { job_id: jobId, timestamp }
        },
        {
          name: 'Proxy GET', 
          method: 'GET',
          url: `/api/proxy-process-job?${apiParams}`
        },
        {
          name: 'Direct API POST',
          method: 'POST',
          url: `${baseDomain}/api/hr/courses/personalize-content/process`,
          body: { job_id: jobId, timestamp }
        },
        {
          name: 'Direct API GET',
          method: 'GET',
          url: `${baseDomain}/api/hr/courses/personalize-content/process?${apiParams}`
        },
        {
          name: 'App Router API POST',
          method: 'POST',
          url: `${baseDomain}/api/hr/courses/personalize-content/process/route`,
          body: { job_id: jobId, timestamp }
        },
        {
          name: 'Legacy API POST',
          method: 'POST',
          url: `${baseDomain}/api/hr/process-job`,
          body: { job_id: jobId, timestamp }
        }
      ];
      
      // Try each endpoint until one succeeds
      for (const endpoint of endpoints) {
        try {
          console.log(`📡 Trying ${endpoint.name} endpoint: ${endpoint.url}`);
          
          const options: RequestInit = {
            method: endpoint.method,
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          };
          
          // Add body for POST requests
          if (endpoint.method === 'POST' && endpoint.body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(endpoint.body);
          }
          
          // Make the request
          const response = await fetch(endpoint.url, options);
          
          // Check for non-JSON response (like HTML)
          const contentType = response.headers.get('content-type');
          if (contentType && !contentType.includes('application/json')) {
            console.warn(`⚠️ ${endpoint.name} returned non-JSON content type: ${contentType}`);
            continue; // Skip to next endpoint
          }
          
          if (!response.ok) {
            console.warn(`⚠️ ${endpoint.name} failed with status ${response.status}`);
            continue; // Skip to next endpoint
          }
          
          // Try to parse JSON response
          const result = await response.json();
          console.log(`✅ ${endpoint.name} succeeded:`, result);
          setIsProcessing(false);
          return true; // Success!
        } catch (error) {
          // Log error and continue to next endpoint
          handleApiError(endpoint.url, endpoint.method, error);
          continue;
        }
      }
      
      // If we reach here, all endpoints failed
      console.error('❌ All API endpoints failed to process the job');
      throw new Error('Failed to process job via any API endpoint');
    } catch (error) {
      console.error('❌ Error processing job:', error);
      toast({
        title: "Error",
        description: `Failed to process job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [supabase, toast]);

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
      
      // Check for existing pending or in-progress jobs first
      try {
        console.log(`[${requestId}] 🔍 Checking for existing jobs for this course`);
        
        // Get current user info to find employee ID
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (userId) {
          // First try to get employee ID from user_employee_mappings
          const { data: employeeMapping } = await supabase
            .from('user_employee_mappings')
            .select('employee_id')
            .eq('user_id', userId)
            .maybeSingle();
            
          const employeeId = employeeMapping?.employee_id || userId;
          
          // Check for existing pending or in-progress jobs
          const { data: existingJobs, error: jobCheckError } = await supabase
            .from('content_generation_jobs')
            .select('*')
            .eq('course_id', courseId)
            .eq('employee_id', employeeId)
            .in('status', ['pending', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (jobCheckError) {
            console.warn(`[${requestId}] ⚠️ Error checking existing jobs:`, jobCheckError);
          } else if (existingJobs && existingJobs.length > 0) {
            const existingJob = existingJobs[0];
            console.log(`[${requestId}] ✅ Found existing ${existingJob.status} job: ${existingJob.id}`);
            
            // Show progress dialog for existing job
            setJobId(existingJob.id);
            setShowProgressDialog(true);
            
            // Trigger job processing to ensure it continues
            setTimeout(async () => {
              await triggerJobProcessing(existingJob.id);
            }, 500);
            
            toast({
              title: 'Resuming Content Generation',
              description: 'Found an existing job in progress. Resuming from where it left off.',
            });
            
            setIsLoading(false);
            return; // Exit early - no need to create a new job
          }
        }
      } catch (checkError) {
        console.warn(`[${requestId}] ⚠️ Error checking for existing jobs:`, checkError);
        // Continue with job creation anyway if check fails
      }
      
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
      
      // Add cache-busting to prevent cached responses
      const requestBody = {
        courseId,
        forceRegenerate: true,
        access_token: authToken,  // Include in body as fallback
        _t: Date.now() // Add timestamp to prevent caching
      };
      
      const response = await fetch(legacyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
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
          const fallbackUrl = `/api/hr/courses/regenerate-content?access_token=${encodeURIComponent(freshToken)}&_t=${Date.now()}`;
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
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify({
              courseId,
              forceRegenerate: true,
              _t: Date.now()
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