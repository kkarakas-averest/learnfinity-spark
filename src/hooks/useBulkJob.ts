import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import type { BulkGenerationJob, BulkJobStatusResponse } from '@/types/bulk-generation';
import type { BulkTaskWithEmployee } from '@/components/bulk/BulkJobStatusCard';

export interface BulkJobState {
  isLoading: boolean;
  job: BulkGenerationJob | null;
  tasks: BulkTaskWithEmployee[];
  progress: number;
  estimatedCompletionTime?: string;
  error: string | null;
  lastUpdated: Date | null;
}

export function useBulkJob(jobId: string | null) {
  const [state, setState] = React.useState<BulkJobState>({
    isLoading: false,
    job: null,
    tasks: [],
    progress: 0,
    estimatedCompletionTime: undefined,
    error: null,
    lastUpdated: null,
  });

  const fetchJobStatus = React.useCallback(async () => {
    if (!jobId) return;

    setState((prev: BulkJobState) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call the bulk status API
      const response = await fetch(`/api/courses/bulk-status?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get job status: ${errorData.error || response.statusText}`);
      }
      
      // Parse response
      const result: BulkJobStatusResponse = await response.json();
      
      if (!result.success) {
        throw new Error(`Failed to get job status: ${result.error || 'Unknown error'}`);
      }

      // Update state with the fetched data
      setState({
        isLoading: false,
        job: result.job || null,
        tasks: result.tasks || [],
        progress: result.progress || 0,
        estimatedCompletionTime: result.estimatedCompletionTime,
        error: null,
        lastUpdated: new Date(),
      });
      
      // Return a success flag and the job data
      return { success: true, job: result.job };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update error state
      setState((prev: BulkJobState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        lastUpdated: new Date(),
      }));
      
      // Show error toast
      toast({
        title: 'Error fetching job status',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, error: errorMessage };
    }
  }, [jobId]);

  // Auto-fetch job when jobId changes
  React.useEffect(() => {
    if (jobId) {
      fetchJobStatus();
    } else {
      // Reset state if jobId becomes null
      setState({
        isLoading: false,
        job: null,
        tasks: [],
        progress: 0,
        estimatedCompletionTime: undefined,
        error: null,
        lastUpdated: null,
      });
    }
  }, [jobId, fetchJobStatus]);

  // Set up polling for active jobs
  React.useEffect(() => {
    // Only poll if we have a job that is not completed or failed
    if (!jobId || !state.job || state.job.status === 'completed' || state.job.status === 'failed') {
      return;
    }

    // Poll every 10 seconds for active jobs
    const interval = setInterval(() => {
      fetchJobStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [jobId, state.job, fetchJobStatus]);

  // Function to start a new bulk generation job
  const startBulkJob = React.useCallback(async (
    groupType: 'department' | 'position',
    groupId: string,
    title: string,
    options?: {
      description?: string;
      difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
      employeeIds?: string[];
    }
  ) => {
    setState((prev: BulkJobState) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call the bulk generation API
      const response = await fetch('/api/courses/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupType,
          groupId,
          title,
          description: options?.description,
          difficultyLevel: options?.difficultyLevel || 'intermediate',
          employeeIds: options?.employeeIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to start bulk generation: ${errorData.error || response.statusText}`);
      }
      
      // Parse response
      const result = await response.json();
      
      if (!result.success || !result.jobId) {
        throw new Error(`Failed to start bulk generation: ${result.error || 'Unknown error'}`);
      }
      
      // Show success toast
      toast({
        title: 'Bulk generation job started',
        description: `Job created for ${result.totalEmployees} employees`,
      });
      
      // Return the job ID and other data
      return { 
        success: true, 
        jobId: result.jobId,
        totalEmployees: result.totalEmployees,
        estimatedTimeMinutes: result.estimatedTimeMinutes
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update error state
      setState((prev: BulkJobState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      // Show error toast
      toast({
        title: 'Error starting bulk generation',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    ...state,
    refetch: fetchJobStatus,
    startBulkJob,
  };
} 