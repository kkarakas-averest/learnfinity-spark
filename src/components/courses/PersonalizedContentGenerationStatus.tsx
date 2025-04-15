'use client';

import React from 'react';
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
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import HtmlContentRenderer from './HtmlContentRenderer';

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
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(initialIsGenerating);
  const [currentStep, setCurrentStep] = React.useState(initialCurrentStep);
  const [steps, setSteps] = React.useState<StepType[]>(initialSteps);
  const [jobId, setJobId] = React.useState<string | undefined>(initialJobId);
  const [jobDetails, setJobDetails] = React.useState<any>(null);
  const [errorMessage, setErrorMessage] = React.useState(error);
  const [pollInterval, setPollInterval] = React.useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [generationStatus, setGenerationStatus] = React.useState<'idle' | 'started' | 'in_progress' | 'completed' | 'failed'>('idle');
  const [totalSteps, setTotalSteps] = React.useState(10);
  const [progressPercentage, setProgressPercentage] = React.useState(0);
  const [stepDescription, setStepDescription] = React.useState('');
  const [retryCount, setRetryCount] = React.useState(0);
  const MAX_RETRIES = 3;
  const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

  // Load job status on component mount
  React.useEffect(() => {
    if (jobId) {
      checkJobStatus();
    }
  }, [jobId]);

  // Clear poll interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const checkJobStatus = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase
        .from('content_generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setJobDetails(data);
        
        // Update the UI based on job status
        // For example, update steps, current step, etc.
        // This depends on what data structure you're using in your database
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

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
          
          // Call the process endpoint directly with relative URL
          const processResponse = await fetch('/api/hr/courses/personalize-content/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ job_id: data.job_id }),
          });
          
          if (!processResponse.ok) {
            console.warn(`⚠️ Process API returned status ${processResponse.status}: ${processResponse.statusText}`);
            // Continue even if processing API fails - the polling will still work
          } else {
            const processResult = await processResponse.json();
            console.log(`✅ Process job response:`, processResult);
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

  // Function to check job status
  const checkJobStatusCallback = React.useCallback(async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('content_generation_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching job status:', fetchError);
        // Only increment retry count for network/server errors, not for "not found"
        if (fetchError.code !== 'PGRST116') {
          setRetryCount(prevCount => prevCount + 1);
        }
        return null;
      }

      setRetryCount(0); // Reset retry count on successful fetch
      return data;
    } catch (err) {
      console.error('Exception when fetching job status:', err);
      setRetryCount(prevCount => prevCount + 1);
      return null;
    }
  }, []);

  // Function to poll job status periodically
  const pollJobStatusCallback = React.useCallback(async () => {
    if (!jobId) return;
    
    // Check if we've exceeded max retries
    if (retryCount >= MAX_RETRIES) {
      clearInterval(pollInterval!);
      setPollInterval(null);
      setGenerationStatus('failed');
      setErrorMessage('Failed to connect to the server after multiple attempts. Please try again later.');
      return;
    }

    const jobData = await checkJobStatusCallback(jobId);
    
    if (!jobData) {
      return; // retryCount is already updated in checkJobStatusCallback
    }

    // Update UI based on job status
    setJobDetails(jobData);
    setCurrentStep(jobData.current_step || 1);
    setTotalSteps(jobData.total_steps || 10);
    setProgressPercentage(jobData.progress || 0);
    setStepDescription(jobData.step_description || '');

    // Update generation status based on job status
    if (jobData.status === 'completed') {
      clearInterval(pollInterval!);
      setPollInterval(null);
      setGenerationStatus('completed');
      toast({
        title: "Content Generation Complete",
        description: "Your personalized content has been generated successfully.",
      });
      
      // Trigger callback if provided
      if (onGenerationComplete) {
        onGenerationComplete();
      }
      
      // Safely refresh the page to show new content - use setTimeout to allow other state updates to complete
      setTimeout(() => {
        try {
          // Only refresh if window is available
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } catch (error) {
          console.error('Error refreshing page:', error);
        }
      }, 1000);
    } else if (jobData.status === 'failed') {
      clearInterval(pollInterval!);
      setPollInterval(null);
      setGenerationStatus('failed');
      setErrorMessage(jobData.error_message || 'An unknown error occurred during content generation.');
    } else if (jobData.status === 'in_progress') {
      setGenerationStatus('in_progress');
    }
  }, [jobId, retryCount, pollInterval, onGenerationComplete, toast, checkJobStatusCallback]);

  // Start polling when jobId changes
  React.useEffect(() => {
    if (jobId && !pollInterval) {
      const interval = window.setInterval(pollJobStatusCallback, POLL_INTERVAL_MS);
      setPollInterval(interval);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [jobId, pollInterval, pollJobStatusCallback]);

  // Check for existing generation job on component mount
  React.useEffect(() => {
    async function checkExistingJob() {
      try {
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
