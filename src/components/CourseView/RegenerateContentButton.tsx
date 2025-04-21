// REMOVED: 'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
// REMOVED: import { supabase } from '@/lib/supabase'; // We will initialize it here
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // ADDED import
import PersonalizedContentGenerationStatus from '@/components/courses/PersonalizedContentGenerationStatus';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// REMOVED: import { useSupabase } from '@/components/providers/supabase-provider'; // Remove Next.js specific provider

// --- ADDED: Initialize Supabase Client for Vite ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Allow session persistence in the browser
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    console.log('[RegenerateButton] Supabase client initialized for Vite.');
  } catch (error) {
      console.error('[RegenerateButton] Error initializing Supabase client:', error);
  }
} else {
    console.warn('[RegenerateButton] Missing Supabase URL or Anon Key in Vite env.');
}
// --- END: Initialize Supabase Client ---

// Determine the correct base URL for API calls (prioritize Vite env)
const getApiBaseUrl = () => {
  // Use Vite environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback logic (can be simplified or removed if VITE_API_BASE_URL is always set)
  if (typeof window !== 'undefined') {
    console.warn('[RegenerateButton] VITE_API_BASE_URL not set, falling back to window.location.origin. Ensure VITE_API_BASE_URL is set in your .env file for the Express server.');
    return window.location.origin; // Fallback for local dev if env var is missing
  }
  return ''; // Should not happen in browser
};

interface RegenerateContentButtonProps {
  courseId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function RegenerateContentButton({ courseId, onSuccess, onError }: RegenerateContentButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | undefined>(undefined);
  const [showProgressDialog, setShowProgressDialog] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  // REMOVED: const { supabase } = useSupabase(); // Use locally initialized client

  // --- Ensure Supabase client is available ---
  if (!supabase) {
      // Render a disabled button or an error message if Supabase isn't configured
      return (
          <Button variant="outline" size="sm" disabled>
              Supabase Not Configured
          </Button>
      );
  }
  // --- END: Ensure Supabase client ---

  const triggerJobProcessing = React.useCallback(async (jobId: string) => {
    const requestId = `trigger_${Date.now()}`;
    console.log(`[${requestId}] 🔄 Attempting to trigger job processing for: ${jobId}`);
    setIsProcessing(true);

    // Ensure supabase client is available inside useCallback
    if (!supabase) {
        console.error(`[${requestId}] ❌ Supabase client not available in triggerJobProcessing`);
        toast({ title: "Error", description: "Supabase client not configured.", variant: "destructive" });
        setIsProcessing(false);
        return;
    }

    try {
      // Get Supabase session for auth token
      console.log(`[${requestId}] 🔐 Getting auth session for triggerJobProcessing`);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      if (!authToken) {
        console.error(`[${requestId}] ❌ No authentication token available`);
        throw new Error('Authentication required');
      }
      console.log(`[${requestId}] ✅ Auth token retrieved`);

      // Use the configured API base URL
      const apiBase = getApiBaseUrl(); 
      // Example: Target a specific processing endpoint on the Express server
      // Adjust the path as needed based on your Express server routes
      const processEndpoint = `${apiBase}/api/hr/courses/process-job`; 
      console.log(`[${requestId}] 📡 Calling job processing endpoint (POST) ${processEndpoint} for job ${jobId}`);
      
      const response = await fetch(processEndpoint, {
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

      console.log(`[${requestId}] 📡 Job processing API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] ❌ Job processing API failed. Status: ${response.status}, Response: ${errorText}`);
        throw new Error(`Failed to process job: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[${requestId}] ✅ Job processing API response OK:`, result);
      // Further actions based on result if needed

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
  }, [toast]); // Removed supabase from dependencies as it's now module-level

  const getApiEndpoints = (baseUrl: string) => {
    // Update these URLs to point to your Express server
    // Use the full URL provided by getApiBaseUrl()
    return [
      // Standard endpoint (most likely the one migrated)
      {
        url: `${baseUrl}/api/hr/courses/regenerate-content`,
        method: 'POST',
        description: 'Standard Express endpoint'
      },
      // Simplified endpoint (if you migrate this one too)
      {
        url: `${baseUrl}/api/hr-course-regenerate`, 
        method: 'POST',
        description: 'Simplified Express endpoint'
      },
      // Alternative endpoint (if migrated)
      {
        url: `${baseUrl}/api/courses/regenerate`, 
        method: 'POST',
        description: 'Alternative Express endpoint'
      },
      // GET method for standard endpoint (if supported by your Express route)
      {
        url: `${baseUrl}/api/hr/courses/regenerate-content`, 
        method: 'GET',
        description: 'Standard Express endpoint (GET)'
      }
    ];
  };

  const tryApiEndpoint = async (endpoint, authToken, body) => {
    const requestId = `regen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[${requestId}] 🚀 Calling ${endpoint.description}: ${endpoint.url}`);
    
    try {
      const config: RequestInit = {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // credentials: 'include' // May not be needed if using Authorization header
      };
      
      // Add auth header if we have a token
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Add body for POST requests
      if (endpoint.method === 'POST') {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(body);
      }
      
      // For GET requests, append params to URL
      let url = endpoint.url;
      if (endpoint.method === 'GET') {
        const params = new URLSearchParams();
        if (courseId) params.append('courseId', courseId);
        // Pass token in query only if absolutely necessary (Bearer header is preferred)
        // if (authToken) params.append('access_token', authToken);
        params.append('_t', Date.now().toString()); // Cache buster
        url = `${url}?${params.toString()}`;
      }
      
      const response = await fetch(url, config);
      
      // Check if we got a successful response
      if (!response.ok) {
        console.log(`[${requestId}] ❌ ${endpoint.description} failed with status ${response.status}`);
        
        // Try to get error details from response
        let errorDetails = '';
        try {
            const errorData = await response.json(); // Try parsing as JSON first
            errorDetails = errorData?.message || errorData?.error || JSON.stringify(errorData);
        } catch (e) {
            errorDetails = await response.text(); // Fallback to text
        }
        console.log(`[${requestId}] ⚠️ Error details: ${errorDetails.substring(0, 200)}...`);
        throw new Error(`API returned ${response.status}: ${errorDetails}`);
      }
      
      // Explicitly check for JSON content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log(`[${requestId}] ⚠️ Response not JSON, content-type: ${contentType}, body: ${text.substring(0, 100)}...`);
        throw new Error('API returned non-JSON response');
      }
      
      // Try to parse response as JSON
      const data = await response.json();
      console.log(`[${requestId}] ✅ ${endpoint.description} succeeded:`, data);
      return { success: true, data };
    } catch (error) {
      console.log(`[${requestId}] 💥 ${endpoint.description} error:`, error);
      return { success: false, error };
    }
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    const requestId = `regen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Ensure supabase client is available inside handleRegenerate
    if (!supabase) {
        console.error(`[${requestId}] ❌ Supabase client not available in handleRegenerate`);
        toast({ title: "Error", description: "Supabase client not configured.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    try {
      console.log(`[${requestId}] 🔄 Starting content regeneration for course:`, courseId);
      
      // Get Supabase token
      console.log(`[${requestId}] 🔐 Retrieving Supabase auth session`);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[${requestId}] ❌ Auth Error:`, sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      const authToken = sessionData?.session?.access_token;
      
      if (!authToken) {
        console.error(`[${requestId}] ❌ No authentication token available`);
        throw new Error('Authentication required. Please sign in again.');
      }
      
      console.log(`[${requestId}] ✅ Authentication token retrieved successfully`);
      
      // Get API base URL for Express server
      const apiBase = getApiBaseUrl();
      if (!apiBase) {
          throw new Error('API Base URL is not configured. Set VITE_API_BASE_URL.');
      }
      console.log(`[${requestId}] 🌐 Using API base URL: ${apiBase}`);
      
      // Try multiple API endpoints in sequence until one succeeds
      const endpoints = getApiEndpoints(apiBase);
      let apiSuccess = false;
      let responseData = null;
      
      const requestBody = {
        courseId,
        forceRegenerate: true,
        // access_token: authToken, // Sending via Authorization header is preferred
      };
      
      for (const endpoint of endpoints) {
        const result = await tryApiEndpoint(endpoint, authToken, requestBody);
        
        if (result.success) {
          apiSuccess = true;
          responseData = result.data;
          console.log(`[${requestId}] ✅ API call succeeded using ${endpoint.description}`);
          break;
        }
      }
      
      if (!apiSuccess || !responseData) {
         console.error(`[${requestId}] ❌ All API endpoints failed.`);
         // Check if Express server is reachable via debug endpoint
         try {
             const debugEndpoint = `${apiBase}/api/debug`; // Assuming /api/debug exists on Express server
             console.log(`[${requestId}] 🔬 Trying diagnostic test API: ${debugEndpoint}`);
             const testResponse = await fetch(debugEndpoint);
             if (testResponse.ok) {
                 const testData = await testResponse.json();
                 console.log(`[${requestId}] ✅ Express debug API is working:`, testData);
                 throw new Error('Content regeneration API endpoints are not working, but the Express server seems reachable. Check route paths and logic.');
             } else {
                 console.log(`[${requestId}] ❌ Express debug API failed with status ${testResponse.status}`);
                 throw new Error('All API endpoints failing, including debug endpoint. Ensure the Express server is running and accessible at the configured VITE_API_BASE_URL.');
             }
         } catch (testError) {
             console.error(`[${requestId}] 💥 Test API error:`, testError);
             throw new Error(`All API endpoints failed. ${testError instanceof Error ? testError.message : 'Please try again later.'}`);
         }
      }
      
      // Show progress tracking
      if (responseData.job_id) {
        setJobId(responseData.job_id);
        setShowProgressDialog(true);
        
        // Manually trigger job processing (if needed by your Express backend)
        // setTimeout(async () => {
        //   await triggerJobProcessing(responseData.job_id);
        // }, 500);
      } else {
          console.warn(`[${requestId}] ⚠️ No job_id received from API response. Cannot track progress.`);
      }
      
      toast({
        title: 'Course content regenerating',
        description: 'Your personalized course content is being generated. This may take a moment.',
      });
      
      if (onSuccess) {
        onSuccess();
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
