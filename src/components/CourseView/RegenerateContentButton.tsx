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
    const requestId = `trigger_${Date.now()}`;
    console.log(`[${requestId}] 🔄 Attempting to trigger job processing for: ${jobId}`);
    setIsProcessing(true);

    try {
      // Get Supabase session for auth token
      console.log(`[${requestId}] 🔐 Getting auth session for triggerJobProcessing`);
      const session = await supabase.auth.getSession();
      const authToken = session?.data?.session?.access_token;

      if (!authToken) {
        console.error(`[${requestId}] ❌ No authentication token available`);
        throw new Error('Authentication required');
      }
      console.log(`[${requestId}] ✅ Auth token retrieved`);

      // Get the current deployment URL to avoid hardcoded domains
      const baseDomain = window.location.origin;
      console.log(`[${requestId}] 🌐 Using base domain: ${baseDomain}`);

      // Try the direct API endpoint - try POST method first
      const directApiEndpoint = `${baseDomain}/api/hr/courses/personalize-content/process`;
      console.log(`[${requestId}] 📡 Calling direct API endpoint (POST) ${directApiEndpoint} for job ${jobId}`);
      
      try {
        const directResponse = await fetch(directApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({ 
            job_id: jobId,
            timestamp: Date.now() // Add timestamp to prevent caching issues
          })
        });

        console.log(`[${requestId}] 📡 Direct POST API response status: ${directResponse.status}`);
        if (directResponse.ok) {
          const result = await directResponse.json();
          console.log(`[${requestId}] ✅ Direct POST API response OK:`, result);
          setIsProcessing(false);
          return;
        }
        
        console.warn(`[${requestId}] ⚠️ Direct POST API endpoint failed with status ${directResponse.status}. Trying GET method...`);
  
        // Final attempt - try GET method with direct API
        const directGetEndpoint = `${directApiEndpoint}?job_id=${jobId}&_t=${Date.now()}`;
        console.log(`[${requestId}] 📡 Calling direct API endpoint (GET) ${directGetEndpoint} for job ${jobId}`);
        const directGetResponse = await fetch(directGetEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        console.log(`[${requestId}] 📡 Direct GET API response status: ${directGetResponse.status}`);
        if (directGetResponse.ok) {
          const result = await directGetResponse.json();
          console.log(`[${requestId}] ✅ Direct GET API response OK:`, result);
          setIsProcessing(false);
          return;
        }
        
        // If all attempts fail, throw an error
        const errorText = await directGetResponse.text();
        console.error(`[${requestId}] ❌ All direct API attempts failed. Final status: ${directGetResponse.status}, Response: ${errorText}`);
        throw new Error(`Failed to process job via any method: ${directGetResponse.status} ${directGetResponse.statusText}`);
      } catch (directError) {
        console.error(`[${requestId}] ❌ Error with direct API calls:`, directError);
        throw directError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error(`[${requestId}] ❌ Error processing job:`, error);
      toast({
        title: "Error",
        description: `Failed to process job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
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
          let employeeId = userId; // Default to userId if mapping fails or doesn't exist
          try {
            console.log(`[${requestId}] 🔗 Attempting to fetch employee mapping for user: ${userId}`);
            const { data: employeeMapping, error: mappingError } = await supabase
              .from('employee_user_mapping')
              .select('employee_id')
              .eq('user_id', userId)
              .maybeSingle();

            if (mappingError) {
              console.error(`[${requestId}] ❌ Supabase Error fetching employee_user_mapping:`, {
                message: mappingError.message,
                details: mappingError.details,
                hint: mappingError.hint,
                code: mappingError.code,
              });
              // Log specific toast for 404 potentially due to RLS or missing table
              if (mappingError.code === 'PGRST116' || mappingError.message.includes('404')) { 
                toast({
                  title: "Configuration Issue?",
                  description: "Could not retrieve employee mapping (employee_user_mapping). Please check table existence and RLS policies in Supabase.",
                  variant: "warning", // Use warning variant
                });
              }
              // Do not throw an error here, proceed using userId as employeeId fallback
            } else if (employeeMapping?.employee_id) {
              employeeId = employeeMapping.employee_id;
              console.log(`[${requestId}] ✅ Successfully mapped user ${userId} to employee ${employeeId}`);
            } else {
              console.log(`[${requestId}] ℹ️ No employee mapping found for user ${userId}, using user ID as employee ID.`);
            }
          } catch (mappingCatchError) {
              console.error(`[${requestId}] 💥 Exception during employee mapping fetch:`, mappingCatchError);
              // Proceed using userId as employeeId fallback
          }

          // Check for existing pending or in-progress jobs using the determined employeeId
          console.log(`[${requestId}] 🔍 Checking for existing jobs for course ${courseId} and employee ${employeeId}`);
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
        const errorBody = await response.text();
        let errorJson: any = {};
        try { errorJson = JSON.parse(errorBody); } catch { /* ignore json parse error */ }

        console.error(`[${requestId}] ❌ API Error (${response.status}) calling ${legacyEndpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorBody,
          endpoint: legacyEndpoint,
          courseId,
          requestDuration: `${requestDuration}ms`,
        });

        // Use toast for user feedback
        toast({
          title: `API Error (${response.status})`,
          description: errorJson?.error || errorJson?.message || `Failed to start regeneration. Status: ${response.statusText || response.status}`,
          variant: "destructive",
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
            let fallbackErrorJson: any = {};
            try { fallbackErrorJson = JSON.parse(routerErrorDetails); } catch { /* ignore */ }

            console.error(`[${requestId}] ❌ Fallback API Error (${fallbackResponse.status}):`, {
              status: fallbackResponse.status,
              statusText: fallbackResponse.statusText,
              responseBody: routerErrorDetails,
              endpoint: fallbackUrl,
              courseId,
              requestDuration: `${fallbackDuration}ms`,
            });

            // Use toast for fallback error
            toast({
              title: `Fallback API Error (${fallbackResponse.status})`,
              description: fallbackErrorJson?.error || fallbackErrorJson?.message || `Failed to regenerate content via fallback. Status: ${fallbackResponse.statusText || fallbackResponse.status}`,
              variant: "destructive",
            });

            throw new Error(`Failed to regenerate content: ${fallbackResponse.statusText || fallbackResponse.status}`);
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
      console.error(`[${requestId}] 💥 Catch-all Error regenerating course content:`, {
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
      
      // Ensure a user-friendly toast is shown even for caught errors
      // (unless it was already shown by specific handlers above)
      if (!(error instanceof Error && error.message.includes("Failed to regenerate content"))) { // Avoid double-toast
        toast({
          title: 'Regeneration Error',
          description: error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
      
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