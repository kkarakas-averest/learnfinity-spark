import React from "@/utils/react-import";
import { useState } from "@/utils/react-import";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

/**
 * RegenerateContentButtonVite - pure Vite/React version
 * Props:
 *   courseId (string, required): ID of the course to regenerate.
 *   userId (string, optional): ID of the user/employee to regenerate content for. If not provided, attempts to use authenticated user's ID.
 *   onSuccess?: callback to trigger on successful regeneration.
 *   onError?: callback for errors.
 *   className?: additional CSS classes to apply to the button.
 */
interface RegenerateContentButtonProps {
  courseId: string;
  userId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * Button component that triggers regeneration of course content.
 * Handles authentication state and provides user feedback.
 */
export default function RegenerateContentButtonVite({
  courseId,
  userId: propUserId,
  onSuccess,
  onError,
  className,
}: RegenerateContentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const auth = useAuth();

  // Helper for operation logging (useful for debugging)
  const logOperation = (action: string, data?: any) => {
    console.log(`[RegenerateContentVite] ${action}`, data || '');
  };

  // Determine the user ID to use
  const getTargetUserId = (): string | undefined => {
    // 1. Use propUserId if explicitly provided
    if (propUserId) {
      logOperation('Using provided userId prop', { propUserId });
      return propUserId;
    }
    // 2. Use authenticated user ID if available and authenticated
    if (auth?.isAuthenticated && auth.user?.id) {
      logOperation('Using authenticated user ID from context', { userId: auth.user.id });
      return auth.user.id;
    }
    // 3. No user ID available
    logOperation('No usable userId found (prop or authenticated context)');
    return undefined;
  };

  // Get the employee ID by fetching enrollment data
  const fetchEmployeeData = async (): Promise<string | null> => {
    const targetUserId = getTargetUserId();

    if (!targetUserId) {
      // This error should ideally be caught before calling handleRegenerate,
      // but we check again here for safety.
      throw new Error("User ID is required but could not be determined.");
    }

    setProgress("Checking course enrollment...");
    logOperation('Fetching enrollment data', { courseId, targetUserId });

    try {
      const enrollmentApiUrl = `/api/hr/courses/${courseId}/enrollment?userId=${targetUserId}`;
      logOperation('Calling enrollment API', { url: enrollmentApiUrl });

      const enrollmentResponse = await fetch(enrollmentApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header if your API requires it
          // 'Authorization': `Bearer ${auth?.session?.access_token}`
        },
      });

      logOperation('Enrollment API response', {
        status: enrollmentResponse.status,
        ok: enrollmentResponse.ok,
        statusText: enrollmentResponse.statusText
      });

      if (!enrollmentResponse.ok) {
        let errorDetails = 'Unknown enrollment API error';
        try {
          // Attempt to parse JSON error first
          const errorJson = await enrollmentResponse.json();
          errorDetails = errorJson.error || errorJson.message || JSON.stringify(errorJson);
        } catch (jsonError) {
          try {
            // Fallback to text error if JSON parsing fails
            errorDetails = await enrollmentResponse.text();
          } catch (textError) {
            // Use status text as last resort
            errorDetails = enrollmentResponse.statusText;
          }
        }
        throw new Error(`Enrollment check failed: ${errorDetails} (${enrollmentResponse.status})`);
      }

      const enrollmentData = await enrollmentResponse.json();
      logOperation('Enrollment data received', enrollmentData);

      // Validate structure (adjust based on actual API response)
      const employeeId = enrollmentData?.enrollment?.employee_id;

      if (!employeeId) {
        logOperation('Employee ID not found in enrollment data', { enrollmentData });
        throw new Error("Employee ID not found in enrollment data.");
      }

      logOperation('Employee ID found', { employeeId });
      setProgress("Enrollment verified");
      return employeeId;

    } catch (error: unknown) { // Catch unknown type
      logOperation('Error fetching employee data', error);
      // Ensure error is an Error instance
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get employee data: ${errorMessage}`);
    }
  };

  const handleRegenerate = async () => {
    // Prevent action if no user ID could be determined
    const targetUserId = getTargetUserId();
    if (!targetUserId) {
      toast.error("Cannot regenerate content: User ID is missing.");
      logOperation('Regeneration blocked: No user ID available.');
      if (onError) onError(new Error("User ID is missing"));
      return;
    }

    setLoading(true);
    setProgress("Starting regeneration...");
    logOperation('Initiating regeneration process', { courseId });

    let employeeId: string | null = null;

    try {
      // Step 1: Get employee ID based on enrollment
      employeeId = await fetchEmployeeData(); // This now uses targetUserId internally

      if (!employeeId) {
        // This case should be handled within fetchEmployeeData, but double-check
        throw new Error("Could not determine employee ID after fetch.");
      }

      setProgress("Regenerating course content...");
      logOperation('Calling content regeneration API', { courseId, employeeId });

      // Step 2: Call the serverless function to regenerate content
      const regenerateApiUrl = "/api/ai/regenerate-content";
      const response = await fetch(regenerateApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
           // Add Authorization header if your API requires it
          // 'Authorization': `Bearer ${auth?.session?.access_token}`
        },
        body: JSON.stringify({
          courseId,
          employeeId, // Send the fetched employeeId
        }),
      });

      logOperation('Regeneration API response', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
         let errorDetails = 'Unknown regeneration API error';
        try {
          const errorJson = await response.json();
          errorDetails = errorJson.error || errorJson.message || JSON.stringify(errorJson);
        } catch (jsonError) {
          try {
            errorDetails = await response.text();
          } catch (textError) {
            errorDetails = response.statusText;
          }
        }
        throw new Error(`Regeneration failed: ${errorDetails} (${response.status})`);
      }

      const data = await response.json();
      logOperation('Regeneration completed successfully', data);

      // Success - show message and call the success callback
      toast.success("Course content regeneration initiated successfully!");
      setProgress("Regeneration started..."); // Update progress message
      
      // Add a polling mechanism to check completion status
      const pollCompletionStatus = async () => {
        try {
          const checkStatusUrl = `/api/hr/courses/${courseId}/enrollment?userId=${targetUserId}`;
          const statusResponse = await fetch(checkStatusUrl);
          if (!statusResponse.ok) return false;
          
          const statusData = await statusResponse.json();
          const status = statusData?.enrollment?.personalized_content_generation_status;
          
          // If completed, clear interval and call onSuccess
          if (status === 'completed') {
            logOperation('Content generation completed. Stopping polling.', { status });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error checking content status:', error);
          return false;
        }
      };
      
      // Poll for completion every 3 seconds for up to 3 minutes
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes at 3-second intervals
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        const isComplete = await pollCompletionStatus();
        if (isComplete || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          
          // Wait a short delay before triggering a content refresh
          setTimeout(() => {
            setLoading(false);
            setProgress(null);
            
            if (onSuccess) {
              logOperation('Calling onSuccess callback');
              onSuccess();
            }
          }, 1000);
        }
      }, 3000);
      
      // This is a fallback - if polling fails, still clean up the UI after some time
      setTimeout(() => {
        if (loading) {
          clearInterval(pollInterval);
          setLoading(false);
          setProgress(null);
          
          if (onSuccess) {
            logOperation('Calling onSuccess callback (timeout fallback)');
            onSuccess();
          }
        }
      }, 180000); // 3 minutes max

    } catch (error: unknown) { // Catch unknown type
      const typedError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = typedError.message || "An unexpected error occurred during regeneration.";
      logOperation('Error in regeneration process', { error: typedError });

      toast.error(errorMessage);
      if (onError) onError(typedError); // Pass the Error object

    } finally {
      // Keep loading true briefly after success to show "Regeneration started..."
      // Reset loading state completely on error.
      if (!(progress === "Regeneration started...")) {
          setLoading(false);
          setProgress(null);
      }
      // The setTimeout cleanup has been moved to the polling logic
      // setTimeout(() => { setLoading(false); setProgress(null); }, 3000);
    }
  };

  // Determine if the button should be disabled
  const isDisabled = loading || (!propUserId && !auth?.isAuthenticated);
  const buttonText = loading ? (progress || "Processing...") : "Regenerate Content";
  const titleText = !propUserId && !auth?.isAuthenticated
    ? "Login required or provide User ID"
    : "Regenerate personalized content for this course";

  // Component render
  return (
    <Button
      onClick={handleRegenerate}
      className={`flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 ${className || ''}`}
      disabled={isDisabled} // Use combined disabled state
      title={titleText} // Add tooltip for disabled state
      data-testid="regenerate-content-button"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {buttonText}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
