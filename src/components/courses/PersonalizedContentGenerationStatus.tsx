'use client';

import React, { useState, useEffect, useRef, useCallback } from '@/lib/react-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  BookOpen,
  Zap,
  Sparkles,
  AlertTriangle,
  RefreshCw, 
  X
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import HtmlContentRenderer from './HtmlContentRenderer';
import { useSupabase } from '@/components/providers/supabase-provider';

interface StepType {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  icon: any;
}

interface PersonalizedContentGenerationStatusProps {
  initialIsGenerating?: boolean;
  initialCurrentStep?: number;
  initialSteps?: StepType[];
  jobId?: string;
  onGenerateContent?: () => Promise<void>;
  error?: string;
  courseId?: string;
  employeeId?: string;
  onGenerationComplete?: () => void;
  enrollmentId?: string;
}

interface JobStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  current_step?: number;
  total_steps?: number;
  step_description?: string;
  progress?: number;
  error_message?: string;
}

// Define a simple type for the expected API response
interface JobStatusResponse {
  job?: any; // Adjust based on actual job data structure
  error?: string;
}

// Default steps for the generation process
const defaultSteps: StepType[] = [
  {
    id: 1,
    name: 'Analyzing Learning Style',
    description: 'Evaluating your learning preferences and patterns',
    status: 'pending',
    icon: Sparkles,
  },
  {
    id: 2,
    name: 'Processing Course Content',
    description: 'Organizing course materials based on your profile',
    status: 'pending',
    icon: BookOpen,
  },
  {
    id: 3,
    name: 'Generating Custom Content',
    description: 'Creating personalized content modules tailored to you',
    status: 'pending',
    icon: Zap,
  },
];

// Simplified error handler for this component
const handleError = (errorMessage: string, setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>) => {
  console.error("Job Status Error:", errorMessage);
  setErrorMessage(errorMessage);
  // Optionally, add toast notification here
};

export default function PersonalizedContentGenerationStatus({
  initialIsGenerating = false,
  initialCurrentStep = -1,
  initialSteps = defaultSteps,
  jobId: initialJobId,
  onGenerateContent = async () => {},
  error,
  courseId,
  employeeId,
  onGenerationComplete,
  enrollmentId,
}: PersonalizedContentGenerationStatusProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(initialIsGenerating);
  const [currentStep, setCurrentStep] = useState(initialCurrentStep);
  const [steps, setSteps] = useState<StepType[]>(initialSteps);
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(error);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'started' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [totalSteps, setTotalSteps] = useState(10);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [stepDescription, setStepDescription] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
  const STUCK_THRESHOLD_MS = 20000; // 20 seconds
  const MAX_POLL_ATTEMPTS = 60; // Maximum number of polling attempts (2 minutes total)
  
  // Add state to track "stuck" steps
  const lastStepChangeTimeRef = useRef<number | null>(null);
  const sameStepCountRef = useRef<number>(0);
  const lastStepRef = useRef<number>(-1);
  const STUCK_STEP_THRESHOLD = 15; // Consider a step stuck if it hasn't changed in 15 seconds
  const MAX_SAME_STEP_COUNT = 5; // Maximum number of polls to see the same step before considering it stuck

  // Add state for tracking polling attempts
  const [pollAttempts, setPollAttempts] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(Date.now());
  const [forceProgressUpdate, setForceProgressUpdate] = useState(false);

  // Add state for tracking job processing
  const [processing, setProcessing] = useState(false);
  const [stepStuckCount, setStepStuckCount] = useState(0);

  // Extract job status update logic to reuse in different places
  const updateJobStatusState = useCallback((job: any) => {
    console.log(`✅ Job status: ${job.status}, step: ${job.current_step} of ${job.total_steps}, progress: ${job.progress}%`);
    
    setJobDetails(job);
      
    // Update progress immediately when received
    if (typeof job.progress === 'number') {
      setProgressPercentage(job.progress);
    }
    
    if (job.status === 'completed') {
      setIsGenerating(false);
      setCurrentStep(steps.length - 1);
      setProgressPercentage(100);
      setGenerationStatus('completed');
      
      // Reload page after short delay to show new content
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 1000);
      
      if (onGenerationComplete) {
        onGenerationComplete();
      }
    } else if (job.status === 'failed') {
      setIsGenerating(false);
      setErrorMessage(job.error_message || 'Job failed without specific error details');
      setGenerationStatus('failed');
      
      if (onGenerationComplete) {
        onGenerationComplete();
      }
    } else if (job.status === 'in_progress' || job.status === 'processing') {
      setIsGenerating(true);
      const stepIndex = steps.findIndex(step => step.id === job.current_step);
      setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
      setGenerationStatus('in_progress');
      
      // Check if step has changed since last check
      const now = Date.now();
      
      if (lastStepRef.current !== job.current_step) {
        // Step has changed, reset counters
        console.log(`🔄 Step changed from ${lastStepRef.current} to ${job.current_step}`);
        lastStepRef.current = job.current_step;
        sameStepCountRef.current = 0;
        lastStepChangeTimeRef.current = now;
      } else {
        // Step is the same, increment counter
        sameStepCountRef.current += 1;
        
        // If we've been at the same step for too many checks, it might be stuck
        if (sameStepCountRef.current >= STUCK_STEP_THRESHOLD || 
            (lastStepChangeTimeRef.current && now - lastStepChangeTimeRef.current > STUCK_THRESHOLD_MS)) {
          console.log(`⚠️ Job appears stuck at step ${job.current_step} for too long (${sameStepCountRef.current} checks)`);
          
          // Only try unsticking if we haven't tried recently (5 seconds)
          if (!lastStepChangeTimeRef.current || now - lastStepChangeTimeRef.current > 5000) {
            console.log(`🔄 Attempting to unstick job ${job.id} from step ${job.current_step}`);
            triggerJobProcessing();
            lastStepChangeTimeRef.current = now;
            // Reset the counter to avoid constant retries
            sameStepCountRef.current = 0;
          }
        }
      }
      
      // If progress hasn't updated in a while, try to trigger job processing
      if (now - lastStepChangeTimeRef.current > STUCK_THRESHOLD_MS) {
        console.warn(`⚠️ Job appears stuck on step ${job.current_step} for over ${STUCK_THRESHOLD_MS/1000} seconds`);
        
        // Manually advance progress to avoid appearing stuck
        if (forceProgressUpdate) {
          const forcedProgress = Math.min(95, progressPercentage + 5);
          setProgressPercentage(forcedProgress);
          console.log(`🔄 Force advancing progress to ${forcedProgress}% to avoid appearance of being stuck`);
        }
        
        // Only try to unstick if we haven't tried recently
        if (now - lastStepChangeTimeRef.current > STUCK_THRESHOLD_MS + 5000) {
          triggerJobProcessing();
          lastStepChangeTimeRef.current = now;
        }
      }
      
      // If we get genuine progress update, clear force progress flag
      if (job.progress !== progressPercentage) {
        setForceProgressUpdate(false);
      }
      
      // Update step description if available
      if (job.step_description) {
        setStepDescription(job.step_description);
      }
    }
  }, [steps, progressPercentage, onGenerationComplete]);

  // Function to check the job status
  const checkJobStatus = useCallback(async () => {
    if (!jobId) return;
    
    try {
      console.log(`📊 [${new Date().toISOString()}] Checking job status for ${jobId} (attempt ${pollAttempts + 1}/${MAX_POLL_ATTEMPTS})`);
      
      // Increment poll attempts
      setPollAttempts(prev => prev + 1);
      
      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        console.error("❌ No auth token available for job status check");
        setErrorMessage("Authentication required to check job status");
        return;
      }
      
      const authToken = sessionData.session.access_token;
      
      // Try direct status endpoint first
      const directStatusUrl = `/api/hr/courses/personalize-content/status?job_id=${jobId}`;
      console.log(`📡 Calling direct status endpoint: ${directStatusUrl}`);
      
      try {
        const response = await fetch(directStatusUrl, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store', // Prevent caching
            'Pragma': 'no-cache'
          }
        });
        console.log(`📡 Direct status response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️ Direct status endpoint failed with status ${response.status}: ${errorText}. Falling back to DB check.`);
          // Fall through to database check if API fails
        } else {
          const data: JobStatusResponse = await response.json();
          console.log(`✅ Direct status API response OK:`, data);
          
          if (data.error) {
            console.error(`❌ Error from status API:`, data.error);
            handleError(data.error, setErrorMessage);
            return; // Stop polling on API error
          }
          
          updateJobStatusState(data.job);
          return; // Stop polling cycle if successful
        }
      } catch (error) {
        console.error(`❌ Error fetching direct status:`, error);
        // Fall through to database check if API call fails completely
      }

      // Fallback: Direct database query if API fails or returns error
      console.log(` fallback: Querying database directly for job status: ${jobId}`);
      try {
        const { data: job, error: jobError } = await supabase
          .from('content_generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (jobError) {
          console.error(`❌ Error querying job directly:`, jobError);
          throw new Error(`Failed to get job status: ${jobError.message}`);
        }
        
        if (job) {
          console.log(`✅ Retrieved job status directly from database for job ${jobId}`);
          updateJobStatusState(job);
          return;
        }
        
        throw new Error('No job data found');
      } catch (error) {
        console.error('❌ Error checking job status:', error);
        setRetryCount(prev => prev + 1);
        
        // If we've exceeded retry count but still have valid job ID, try force-advancing progress
        if (retryCount >= MAX_RETRIES && jobId) {
          console.log(`⚠️ Retry count exceeded. Force advancing progress to unstick job ${jobId}`);
          triggerJobProcessing();
          setForceProgressUpdate(true);
        }
        
        if (retryCount >= MAX_RETRIES * 2) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to check job status after multiple attempts');
          
          if (onGenerationComplete) {
            onGenerationComplete();
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking job status:', error);
      setRetryCount(prev => prev + 1);
      
      // If we've exceeded retry count but still have valid job ID, try force-advancing progress
      if (retryCount >= MAX_RETRIES && jobId) {
        console.log(`⚠️ Retry count exceeded. Force advancing progress to unstick job ${jobId}`);
        triggerJobProcessing();
        setForceProgressUpdate(true);
      }
      
      if (retryCount >= MAX_RETRIES * 2) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to check job status after multiple attempts');
        
        if (onGenerationComplete) {
          onGenerationComplete();
        }
      }
    }
  }, [jobId, retryCount, pollAttempts, onGenerationComplete, updateJobStatusState]);

  // Function to trigger job processing when it appears stuck
  const triggerJobProcessing = useCallback(async () => {
    if (!jobId || processing) return;
    
    setProcessing(true);
    const triggerRequestId = `unstick_${Date.now()}`;
    console.log(`🔄 [${triggerRequestId}] Triggering job processing for ${jobId} (stuck count: ${stepStuckCount})`);
    
    try {
      // Determine if we should force advancement or process multiple steps
      // NOTE: The /process endpoint currently doesn't support these flags, 
      // but keeping the logic here in case it's added later.
      const forceAdvancement = stepStuckCount > 5;
      const processMultipleSteps = stepStuckCount > 2 && stepStuckCount <= 5;
      
      console.log(`[${triggerRequestId}] ⚙️ Processing strategy: ${forceAdvancement ? 'Force advancement' : (processMultipleSteps ? 'Multiple steps' : 'Standard processing')}`);
      
      let response;
      const processEndpoint = '/api/hr/courses/personalize-content/process';
      console.log(`[${triggerRequestId}] 📡 Attempting to call ${processEndpoint} (POST)`);
      
      try {
        // Try the main process job API endpoint (POST)
        response = await fetch(processEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add Authorization header if needed (using token from localStorage as example)
            ...(typeof window !== 'undefined' && localStorage.getItem('supabase.auth.token') ? {
              'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` 
            } : {})
          },
          body: JSON.stringify({
            job_id: jobId,
            // Include flags even if backend doesn't use them yet
            force_advancement: forceAdvancement, 
            process_multiple_steps: processMultipleSteps
          }),
        });
        
        console.log(`[${triggerRequestId}] 📡 ${processEndpoint} POST response status: ${response.status}`);

        // Check for HTML response (indicating routing issue)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('text/html') !== -1) {
          console.error(`[${triggerRequestId}] ❌ Received HTML response from ${processEndpoint} - possible routing issue.`);
          throw new Error('Received HTML response - possible routing issue');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[${triggerRequestId}] ⚠️ ${processEndpoint} POST failed with status ${response.status}: ${errorText}. Trying GET.`);
          
          // Try GET as fallback
          const processGetEndpoint = `${processEndpoint}?job_id=${jobId}&_t=${Date.now()}`;
          console.log(`[${triggerRequestId}] 📡 Attempting to call ${processGetEndpoint} (GET)`);
          response = await fetch(processGetEndpoint, {
            method: 'GET',
             headers: {
              // Add Authorization header if needed
              ...(typeof window !== 'undefined' && localStorage.getItem('supabase.auth.token') ? {
                'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` 
              } : {})
            }
          });
          console.log(`[${triggerRequestId}] 📡 ${processGetEndpoint} GET response status: ${response.status}`);
          if (!response.ok) {
             const getErrorText = await response.text();
             console.error(`[${triggerRequestId}] ❌ ${processGetEndpoint} GET also failed with status ${response.status}: ${getErrorText}`);
             throw new Error(`Failed to trigger job processing via POST or GET: ${response.statusText}`);
          }
        }

      } catch (error) {
        console.error(`[${triggerRequestId}] 💥 Error calling ${processEndpoint}:`, error);
        console.log(`[${triggerRequestId}] ⚠️ Falling back to direct database update for job ${jobId}...`);
        
        // Fall back to direct database access if API methods fail
        try {
          const { data, error: dbError } = await supabase
          .from('content_generation_jobs')
          .update({
              last_error: 'Job processing triggered manually due to API failure',
              updated_at: new Date().toISOString()
          })
            .eq('id', jobId)
            .select();
            
          if (dbError) {
            console.error(`[${triggerRequestId}] ❌ Failed to update job ${jobId} directly in database:`, dbError);
            throw dbError; // Re-throw DB error
          }
          
          console.log(`[${triggerRequestId}] ✅ Job ${jobId} updated directly in database:`, data);
          // Even if DB update works, the actual processing might not have been triggered
          // Consider adding a different state or message for this scenario
          setProcessing(false);
          return; // Exit after DB fallback attempt
        } catch (finalFallbackError) {
           console.error(`[${triggerRequestId}] 💥 Final fallback DB update also failed for job ${jobId}:`, finalFallbackError);
           throw finalFallbackError; // Re-throw final error
        }
      }

      // If fetch was successful (either POST or GET)
      const data = await response.json();
      console.log(`[${triggerRequestId}] ✅ Job processing trigger response from ${response.url}:`, data);
      
      // Check job status again after processing attempt
      // Use a slight delay to allow backend potentially start processing
      setTimeout(() => checkJobStatus(), 500);
      
    } catch (error) {
      console.error(`[${triggerRequestId}] 💥 Error in triggerJobProcessing for ${jobId}:`, error);
      // Potentially set an error state specific to the trigger failure
    } finally {
      setProcessing(false);
    }
  }, [jobId, processing, stepStuckCount, checkJobStatus, supabase]); // Added supabase dependency

  // Load job status on component mount
  useEffect(() => {
    if (jobId) {
      checkJobStatus();
    }
  }, [jobId]);

  // Clear poll interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Enhanced job status check function
  React.useEffect(() => {
    // Clear existing interval if any
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    
    // Only start new polling if we have a valid job ID and haven't exceeded poll attempts
    if (jobId && pollAttempts < MAX_POLL_ATTEMPTS) {
      // Initial check when setting up polling
      checkJobStatus();
      
      // Set up interval for subsequent checks
      const interval = window.setInterval(() => {
        // If we've exceeded poll attempts, clear interval
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval);
          setPollInterval(null);
        
          // If we still don't have completion or failure at this point,
          // assume the job completed but failed to notify us
          if (generationStatus !== 'completed' && generationStatus !== 'failed') {
            console.log('⏱️ Maximum polling attempts reached. Assuming completion.');
      setGenerationStatus('completed');
            setProgressPercentage(100);
            
      setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
        }
      }, 1000);
            
            if (onGenerationComplete) {
              onGenerationComplete();
            }
          }
          return;
        }
        
        // Otherwise, check job status again
        checkJobStatus();
      }, POLL_INTERVAL_MS);
      
      setPollInterval(interval);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, pollAttempts, checkJobStatus, pollInterval, generationStatus, onGenerationComplete]);

  // Check for existing generation job on component mount
  React.useEffect(() => {
    async function checkExistingJob() {
      try {
        // Skip the check if courseId or employeeId is missing
        if (!courseId || !employeeId) {
          console.log('Skipping enrollment check - missing courseId or employeeId');
          return;
        }

        // First, check if there's an active job in the course enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('hr_course_enrollments')
          .select('personalized_content_generation_job_id, personalized_content_generation_status')
          .eq('course_id', courseId)
          .eq('employee_id', employeeId)
          .single();

        if (enrollmentError) {
          console.error('Error checking enrollment:', enrollmentError);
          return;
        }

        if (
          enrollmentData?.personalized_content_generation_job_id && 
          enrollmentData?.personalized_content_generation_status !== 'completed' &&
          enrollmentData?.personalized_content_generation_status !== 'failed'
        ) {
          // We have an existing job that's not completed or failed
          setJobId(enrollmentData.personalized_content_generation_job_id);
          setGenerationStatus(
            enrollmentData.personalized_content_generation_status === 'in_progress' 
              ? 'in_progress' 
              : 'started'
          );
        }
      } catch (error) {
        console.error('Error checking existing generation job:', error);
      }
    }

    checkExistingJob();
  }, [courseId, employeeId]);

  // Render status message and UI based on generation status
  const renderStatusMessage = () => {
    switch (generationStatus) {
      case 'idle':
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={16} />
            <span>Personalized content not yet generated</span>
          </div>
        );
      case 'started':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader2 size={16} className="animate-spin" />
            <span>Starting content generation...</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-blue-500">
              <RefreshCw size={16} className="animate-spin" />
              <span>Generating personalized content: {Math.round(progressPercentage)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {stepDescription ? (
                <HtmlContentRenderer 
                  content={stepDescription} 
                  className="prose max-w-none dark:prose-invert text-sm" 
                />
              ) : (
                `Step ${currentStep} of ${totalSteps}`
              )}
            </p>
            <Progress value={progressPercentage} className="h-2 mt-2" />
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle size={16} />
            <span>Personalized content has been generated successfully!</span>
          </div>
        );
      case 'failed':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <X size={16} />
              <span>Content generation failed</span>
            </div>
            {errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Function to start the content generation process
  const handleStartGeneration = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setGenerationStatus('started');

      // Make the API call to start the generation process
      const response = await fetch('/api/hr/courses/personalize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          employeeId,
          enrollmentId,
          personalizationOptions: {
            adaptToLearningStyle: true,
            includeEmployeeExperience: true,
            useSimplifiedLanguage: false,
            includeExtraChallenges: true
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start content generation');
      }

      // Set the job ID from the response
      if (data.job_id) {
        setJobId(data.job_id);
        setGenerationStatus('in_progress');
        
        // Manually trigger job processing
        try {
          console.log(`🔄 Manually triggering job processing for job ID: ${data.job_id}`);
          
          // Use relative URL to avoid cross-domain issues
          const processResponse = await fetch('/api/hr/courses/personalize-content/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add Authorization header if needed
              ...(typeof window !== 'undefined' && localStorage.getItem('supabase.auth.token') ? {
                'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` 
              } : {})
            },
            body: JSON.stringify({ job_id: data.job_id }),
          });
          
          if (processResponse.ok) {
            const processResult = await processResponse.json();
            console.log(`✅ Process job response:`, processResult);
          } else {
            console.warn(`⚠️ Process API returned status ${processResponse.status}: ${processResponse.statusText}`);
            // Continue even if processing API fails - the polling will still work
          }
        } catch (processError) {
          console.error(`❌ Error manually triggering job processing:`, processError);
          // Continue even if processing fails - the polling will still work
        }
      } else {
        throw new Error('No job ID returned from server');
      }

      toast({
        title: "Content Generation Started",
        description: "Your personalized content is being generated. This may take a few minutes.",
      });
    } catch (error) {
      console.error('Error starting content generation:', error);
      setGenerationStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start content generation',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Display error message if present */}
      {errorMessage && !isGenerating && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Personalized Content Generation</h3>
              {isGenerating && (
                <span className="text-sm text-blue-500 animate-pulse flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Processing...
                </span>
              )}
            </div>

            {/* Render the appropriate status message */}
            {renderStatusMessage()}
            
            {/* Main content */}
            <div className="space-y-4">
              {isGenerating && (
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        step.status === 'complete' 
                          ? 'bg-green-100 text-green-600' 
                          : step.status === 'loading' 
                            ? 'bg-blue-100 text-blue-600' 
                            : step.status === 'error' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-gray-100 text-gray-600'
                      } mr-3`}>
                        {step.status === 'loading' ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          step.status === 'complete' 
                            ? 'text-green-900' 
                            : step.status === 'loading' 
                              ? 'text-blue-900' 
                              : step.status === 'error' 
                                ? 'text-red-900' 
                                : 'text-gray-900'
                        }`}>
                          {step.name}
                        </h4>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!isGenerating && generationStatus === 'idle' && (
                <Button 
                  onClick={handleStartGeneration} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Starting...
                    </>
                  ) : "Generate Personalized Content"}
                </Button>
              )}
              
              {generationStatus === 'failed' && (
                <Button 
                  onClick={handleStartGeneration}
                  disabled={loading}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Retry Generation
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


