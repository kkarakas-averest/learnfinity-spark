'use client';

import React, { useState, useEffect, useCallback } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PersonalizedContentGenerationStatus from '@/components/courses/PersonalizedContentGenerationStatus';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSupabase } from '@/components/providers/supabase-provider';

// Determine the correct base URL for API calls
const getApiBaseUrl = () => {
  // In browser environments
  if (typeof window !== 'undefined') {
    // For production Vercel deployments
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://learnfinity-spark.vercel.app';
    }
    // For preview Vercel deployments
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      return process.env.NEXT_PUBLIC_VERCEL_URL ? 
        `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
        window.location.origin;
    }
    // Default to current origin (works for local dev and other cases)
    return window.location.origin;
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_API_BASE_URL || '';
};

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
      
      // Get Supabase token
      console.log(`[${requestId}] 🔐 Retrieving Supabase auth session`);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[${requestId}] ❌ Auth Error: Failed to get Supabase session:`, sessionError);
        throw new Error('Authentication error: Could not retrieve session. Please sign in again.');
      }
      
      const authToken = sessionData?.session?.access_token;
      
      if (!authToken) {
        console.error(`[${requestId}] ❌ Auth Error: No authentication token available`);
        throw new Error('Authentication error: No valid session found. Please sign in again.');
      }
      
      console.log(`[${requestId}] ✅ Authentication token retrieved successfully`);
      
      // Check for existing jobs first
      try {
        console.log(`[${requestId}] 🔍 Checking for existing jobs for this course`);
        
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (userId) {
          // Try to get employee ID from user_employee_mappings
          let employeeId = userId; // Default to userId if mapping fails
          
          // Get employee mapping if available
          const { data: employeeMapping } = await supabase
            .from('employee_user_mapping')
            .select('employee_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (employeeMapping?.employee_id) {
            employeeId = employeeMapping.employee_id;
            console.log(`[${requestId}] ✅ Found employee mapping: ${employeeId}`);
          }

          // Check for existing pending/in-progress jobs
          const { data: existingJobs } = await supabase
            .from('content_generation_jobs')
            .select('*')
            .eq('course_id', courseId)
            .eq('employee_id', employeeId)
            .in('status', ['pending', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (existingJobs && existingJobs.length > 0) {
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
      
      // Get the correct API base URL
      const apiBase = getApiBaseUrl();
      console.log(`[${requestId}] 🌐 Using API base URL: ${apiBase}`);
      
      // Call the primary endpoint
      const endpoint = `${apiBase}/api/hr/courses/regenerate-content`;
      console.log(`[${requestId}] 🚀 Calling endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            courseId,
            forceRegenerate: true
          }),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[${requestId}] ❌ API Error (${response.status}):`, {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorBody
          });
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log(`[${requestId}] ✅ Content regeneration successful:`, responseData);
        
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
      } catch (apiError) {
        console.error(`[${requestId}] 💥 API call error:`, apiError);
        throw new Error(`Failed to regenerate content: ${apiError.message || 'Unknown API error'}`);
      }
    } catch (error) {
      console.error(`[${requestId}] 💥 Error regenerating course content:`, error);
      
      toast({
        title: 'Regeneration Error',
        description: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.',
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