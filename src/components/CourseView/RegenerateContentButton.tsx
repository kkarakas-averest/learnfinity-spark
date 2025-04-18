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
          let mappingMethod = 'user_id_fallback'; // Track which method was used
          
          try {
            console.log(`[${requestId}] 🔗 Attempting to fetch employee mapping for user: ${userId}`);
            
            // APPROACH 1: Direct mapping table query via Supabase client
            try {
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
                
                // Continue to next approach
              } else if (employeeMapping?.employee_id) {
                employeeId = employeeMapping.employee_id;
                mappingMethod = 'mapping_table_direct';
                console.log(`[${requestId}] ✅ Successfully mapped user ${userId} to employee ${employeeId} via direct query`);
              }
            } catch (directMappingError) {
              console.error(`[${requestId}] 💥 Exception during direct mapping fetch:`, directMappingError);
              // Continue to next approach
            }
            
            // APPROACH 2: Try direct approach with employees table if mapping failed
            if (mappingMethod === 'user_id_fallback') {
              try {
                const { data: employeeData, error: employeeError } = await supabase
                  .from('employees')
                  .select('id')
                  .eq('user_id', userId)
                  .maybeSingle();
                  
                if (!employeeError && employeeData?.id) {
                  employeeId = employeeData.id;
                  mappingMethod = 'employees_table';
                  console.log(`[${requestId}] ✅ Found employee ID directly from employees table: ${employeeId}`);
                } else {
                  console.log(`[${requestId}] ℹ️ Could not find employee in 'employees' table, trying server-side API`);
                }
              } catch (employeeTableError) {
                console.error(`[${requestId}] 💥 Exception querying employees table:`, employeeTableError);
                // Continue to next approach
              }
            }
            
            // APPROACH 3: Try server API endpoint with service role access
            if (mappingMethod === 'user_id_fallback') {
              try {
                const apiBase = getApiBaseUrl();
                const serverMappingEndpoint = `${apiBase}/api/user/get-employee-mapping?userId=${encodeURIComponent(userId)}`;
                console.log(`[${requestId}] 🔍 Attempting server-side mapping lookup at: ${serverMappingEndpoint}`);
                
                const mappingResponse = await fetch(serverMappingEndpoint, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (mappingResponse.ok) {
                  const mappingData = await mappingResponse.json();
                  if (mappingData.employeeId) {
                    employeeId = mappingData.employeeId;
                    mappingMethod = 'server_api';
                    console.log(`[${requestId}] ✅ Retrieved employee mapping via server API: ${employeeId}`);
                  }
                } else {
                  console.warn(`[${requestId}] ⚠️ Server mapping API returned error: ${mappingResponse.status}`);
                }
              } catch (serverApiError) {
                console.error(`[${requestId}] 💥 Exception calling server mapping API:`, serverApiError);
                // Continue with fallback
              }
            }
            
            // Fallback if all approaches failed
            if (mappingMethod === 'user_id_fallback') {
              console.log(`[${requestId}] ℹ️ All mapping approaches failed. Using user ID as employee ID: ${userId}`);
            }
            
          } catch (mappingCatchError) {
              console.error(`[${requestId}] 💥 Exception during employee mapping fetch:`, mappingCatchError);
              // Proceed using userId as employeeId fallback
          }

          // Check for existing pending or in-progress jobs using the determined employeeId
          console.log(`[${requestId}] 🔍 Checking for existing jobs for course ${courseId} and employee ${employeeId} (mapping method: ${mappingMethod})`);
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
      
      // Get the correct API base URL based on environment
      const apiBase = getApiBaseUrl();
      console.log(`[${requestId}] 🌐 Using API base URL: ${apiBase}`);
      
      // Try multiple API endpoints in sequence, with fallbacks
      let apiResponse = null;
      let responseData = null;
      
      // ATTEMPT 1: Standard API endpoint
      const standardEndpoint = `${apiBase}/api/hr/courses/regenerate-content`;
      console.log(`[${requestId}] 🚀 Calling standard endpoint: ${standardEndpoint}`);
      
      try {
        const requestStartTime = Date.now();
        const response = await fetch(standardEndpoint, {
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
        
        if (response.ok) {
          apiResponse = response;
          responseData = await response.json();
          console.log(`[${requestId}] ✅ Standard API call successful in ${requestDuration}ms`);
        } else {
          const errorBody = await response.text();
          console.error(`[${requestId}] ❌ Standard API Error (${response.status}):`, {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorBody,
            endpoint: standardEndpoint,
            requestDuration: `${requestDuration}ms`,
          });
          
          // Continue to next attempt
        }
      } catch (standardApiError) {
        console.error(`[${requestId}] 💥 Exception during standard API call:`, standardApiError);
        // Continue to next attempt
      }
      
      // ATTEMPT 2: Try alternative endpoint if standard failed
      if (!apiResponse) {
        const alternativeEndpoint = `${apiBase}/api/courses/regenerate`;
        console.log(`[${requestId}] 🚀 Trying alternative endpoint: ${alternativeEndpoint}`);
        
        try {
          const altStartTime = Date.now();
          const altResponse = await fetch(alternativeEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              courseId,
              forceRegenerate: true,
              access_token: authToken,
            }),
            credentials: 'include',
          });
          const altDuration = Date.now() - altStartTime;
          
          if (altResponse.ok) {
            apiResponse = altResponse;
            responseData = await altResponse.json();
            console.log(`[${requestId}] ✅ Alternative API call successful in ${altDuration}ms`);
          } else {
            const altErrorBody = await altResponse.text();
            console.error(`[${requestId}] ❌ Alternative API Error (${altResponse.status}):`, {
              status: altResponse.status,
              statusText: altResponse.statusText,
              responseBody: altErrorBody,
              endpoint: alternativeEndpoint,
              requestDuration: `${altDuration}ms`,
            });
            
            // Try GET method for alternative endpoint if POST failed
            console.log(`[${requestId}] 🔄 Trying alternative endpoint with GET method`);
            try {
              const getAltStartTime = Date.now();
              const getAltResponse = await fetch(`${alternativeEndpoint}?courseId=${encodeURIComponent(courseId)}&access_token=${encodeURIComponent(authToken)}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Accept': 'application/json'
                }
              });
              const getAltDuration = Date.now() - getAltStartTime;
              
              if (getAltResponse.ok) {
                apiResponse = getAltResponse;
                responseData = await getAltResponse.json();
                console.log(`[${requestId}] ✅ Alternative GET API call successful in ${getAltDuration}ms`);
              } else {
                const getAltErrorBody = await getAltResponse.text();
                console.error(`[${requestId}] ❌ Alternative GET API Error (${getAltResponse.status}):`, {
                  status: getAltResponse.status,
                  statusText: getAltResponse.statusText,
                  responseBody: getAltErrorBody,
                  endpoint: `${alternativeEndpoint} (GET)`,
                  requestDuration: `${getAltDuration}ms`,
                });
              }
            } catch (getAltError) {
              console.error(`[${requestId}] 💥 Exception during alternative GET API call:`, getAltError);
            }
          }
        } catch (altApiError) {
          console.error(`[${requestId}] 💥 Exception during alternative API call:`, altApiError);
          // Continue to next attempt
        }
      }
      
      // ATTEMPT 3: Try fallback with query parameter auth if prior attempts failed
      if (!apiResponse) {
        // Get a fresh token if available
        console.log(`[${requestId}] 🔐 Requesting fresh auth token for fallback`);
        const { data: tokenData } = await supabase.auth.getSession();
        const freshToken = tokenData?.session?.access_token || authToken;
        
        // Try POST first
        const fallbackUrl = `${apiBase}/api/hr/courses/regenerate-content?access_token=${encodeURIComponent(freshToken)}`;
        console.log(`[${requestId}] 🚀 Attempting fallback request to: ${fallbackUrl}`);
          
        try {
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
          
          if (fallbackResponse.ok) {
            apiResponse = fallbackResponse;
            responseData = await fallbackResponse.json();
            console.log(`[${requestId}] ✅ Fallback API call successful in ${fallbackDuration}ms`);
          } else {
            const fallbackErrorBody = await fallbackResponse.text();
            console.error(`[${requestId}] ❌ Fallback API Error (${fallbackResponse.status}):`, {
              status: fallbackResponse.status,
              statusText: fallbackResponse.statusText,
              responseBody: fallbackErrorBody,
              endpoint: fallbackUrl,
              requestDuration: `${fallbackDuration}ms`,
            });
            
            // Try GET as a last resort
            console.log(`[${requestId}] 🔄 Trying main endpoint with GET method as final attempt`);
            try {
              const getFallbackUrl = `${apiBase}/api/hr/courses/regenerate-content?courseId=${encodeURIComponent(courseId)}&access_token=${encodeURIComponent(freshToken)}`;
              const getFallbackStartTime = Date.now();
              const getFallbackResponse = await fetch(getFallbackUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                }
              });
              const getFallbackDuration = Date.now() - getFallbackStartTime;
              
              if (getFallbackResponse.ok) {
                apiResponse = getFallbackResponse;
                responseData = await getFallbackResponse.json();
                console.log(`[${requestId}] ✅ GET Fallback API call successful in ${getFallbackDuration}ms`);
              } else {
                const getFallbackErrorBody = await getFallbackResponse.text();
                console.error(`[${requestId}] ❌ GET Fallback API Error (${getFallbackResponse.status}):`, {
                  status: getFallbackResponse.status,
                  statusText: getFallbackResponse.statusText,
                  responseBody: getFallbackErrorBody,
                  endpoint: getFallbackUrl,
                  requestDuration: `${getFallbackDuration}ms`
                });
              }
            } catch (getFallbackError) {
              console.error(`[${requestId}] 💥 Exception during GET fallback API call:`, getFallbackError);
            }
          }
        } catch (fallbackApiError) {
          console.error(`[${requestId}] 💥 Exception during fallback API call:`, fallbackApiError);
        }
      }
      
      // Handle the result of API attempts
      if (apiResponse && responseData) {
        console.log(`[${requestId}] ✅ Content regeneration successful:`, {
          response: responseData
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
      } else {
        // All API attempts failed
        console.error(`[${requestId}] ❌ All API attempts failed`);
        throw new Error('Failed to regenerate content: All API endpoints failed. Please try again later.');
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