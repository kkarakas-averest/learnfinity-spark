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

  const getApiEndpoints = (baseUrl: string) => {
    return [
      // First priority: simplified flat path endpoint (most reliable in previews)
      {
        url: `${baseUrl}/api/hr-course-regenerate`,
        method: 'POST',
        description: 'Simplified endpoint'
      },
      // Second priority: standard API endpoint
      {
        url: `${baseUrl}/api/hr/courses/regenerate-content`,
        method: 'POST',
        description: 'Standard endpoint'
      },
      // Third priority: alternative endpoint
      {
        url: `${baseUrl}/api/courses/regenerate`,
        method: 'POST',
        description: 'Alternative endpoint'
      },
      // Fourth priority: GET method for simplified endpoint
      {
        url: `${baseUrl}/api/hr-course-regenerate`,
        method: 'GET',
        description: 'Simplified endpoint (GET)'
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
        credentials: 'include'
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
        if (authToken) params.append('access_token', authToken);
        params.append('_t', Date.now().toString()); // Cache buster
        url = `${url}?${params.toString()}`;
      }
      
      const response = await fetch(url, config);
      
      // Check if we got a successful response
      if (!response.ok) {
        console.log(`[${requestId}] ❌ ${endpoint.description} failed with status ${response.status}`);
        
        // Try to get error details from response
        let errorText = '';
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } else {
          // Probably got HTML - this is our main issue
          errorText = await response.text().then(text => 
            text.length > 100 ? text.substring(0, 100) + '...' : text
          );
          console.log(`[${requestId}] ⚠️ Received non-JSON response: ${errorText}`);
          throw new Error(`Server returned ${response.status} with non-JSON response`);
        }
        
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      // Explicitly check for JSON content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log(`[${requestId}] ⚠️ Response not JSON, content-type: ${contentType}`);
        const text = await response.text();
        console.log(`[${requestId}] ⚠️ Response body: ${text.substring(0, 100)}...`);
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
      
      // Get API base URL
      const apiBase = getApiBaseUrl();
      console.log(`[${requestId}] 🌐 Using API base URL: ${apiBase}`);
      
      // Try multiple API endpoints in sequence until one succeeds
      const endpoints = getApiEndpoints(apiBase);
      let apiSuccess = false;
      let responseData = null;
      
      const requestBody = {
        courseId,
        forceRegenerate: true,
        access_token: authToken,  // Include in body as fallback
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
        // Try test API to diagnose if there's a general API routing issue
        try {
          const testApiEndpoint = `${apiBase}/api/debug-api-health`;
          console.log(`[${requestId}] 🔬 Trying diagnostic test API: ${testApiEndpoint}`);
          
          const testResponse = await fetch(testApiEndpoint);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log(`[${requestId}] ✅ Test API is working:`, testData);
            throw new Error('Content regeneration API endpoints are not working, but test API is. This suggests an issue with specific route configuration.');
          } else {
            console.log(`[${requestId}] ❌ Test API also failed with status ${testResponse.status}`);
            throw new Error('All API endpoints failing. This suggests a general API routing issue on the server.');
          }
        } catch (testError) {
          console.error(`[${requestId}] 💥 Test API error:`, testError);
          throw new Error('All API endpoints failed, including test endpoint. Please try again later.');
        }
      }
      
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
