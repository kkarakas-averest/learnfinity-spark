import React, { useState } from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RotateCcwIcon } from "@/components/ui/custom-icons";
import { toast } from "@/components/ui/use-toast";

/**
 * RegenerateContentButtonVite - pure Vite/React version
 * Props:
 *   courseId (string, required): ID of the course to regenerate.
 *   userId (string, optional): ID of the user/employee to regenerate content for.
 *   onSuccess?: callback to trigger on successful regeneration.
 *   onError?: callback for errors.
 */
interface RegenerateContentButtonViteProps {
  courseId: string;
  userId?: string;
  onSuccess?: (jobId: string) => void;
  onError?: (error: Error) => void;
}

const RegenerateContentButtonVite = ({
  courseId,
  userId,
  onSuccess,
  onError,
}: RegenerateContentButtonViteProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Helper function to log with identifier for easier debugging
  const logOperation = (message: string, data?: any) => {
    const logId = `regen_${Date.now().toString()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[${logId}] ${message}`, data ? data : '');
    return logId;
  };

  // Function to update progress status
  const updateProgress = (step: string) => {
    setCurrentStep(step);
  };

  // Function to get employee CV data based on course enrollment
  const fetchEmployeeDataForCourse = async (courseId: string) => {
    updateProgress("Fetching employee data...");
    try {
      const currentUserId = userId || localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      if (!currentUserId) {
        throw new Error("User ID not available. Please login again.");
      }

      // Get course enrollment to find the employee - now with userId in query params
      const enrollmentResponse = await fetch(`/api/hr/courses/${courseId}/enrollment?userId=${currentUserId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!enrollmentResponse.ok) {
        throw new Error(`Failed to fetch enrollment data: ${enrollmentResponse.status}`);
      }

      const enrollmentData = await enrollmentResponse.json();
      
      // Log the enrollment data structure to help debug
      logOperation("📋 Received enrollment data:", enrollmentData);
      
      // Our API returns { enrollment: { ... } }
      const enrollment = enrollmentData.enrollment;
      
      if (!enrollment) {
        throw new Error("Enrollment data is missing from the response");
      }
      
      const employeeId = enrollment.employee_id || enrollment.employeeId || enrollment.user_id || enrollment.userId;
      
      if (!employeeId) {
        throw new Error("No employee ID found in the enrollment data");
      }
      
      logOperation("👤 Found employee ID:", employeeId);

      // Now fetch the employee CV data
      updateProgress("Retrieving CV data...");
      const employeeResponse = await fetch(`/api/hr/employees/${employeeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!employeeResponse.ok) {
        throw new Error(`Failed to fetch employee data: ${employeeResponse.status}`);
      }

      const employeeData = await employeeResponse.json();
      
      if (!employeeData.cv_extracted_data) {
        throw new Error("Employee has no CV data. Please upload and process a CV first.");
      }

      return {
        employeeId,
        cvData: employeeData.cv_extracted_data,
        name: employeeData.name,
        position: employeeData.position?.title || "Unknown Position",
        department: employeeData.department?.name || "Unknown Department"
      };
    } catch (error: any) {
      logOperation(`❌ Error fetching employee data: ${error.message}`);
      throw new Error(`Failed to get employee data: ${error.message}`);
    }
  };

  // Main regenerate handler
  const handleRegenerate = async () => {
    const logId = logOperation("🔄 Starting content regeneration for course:", courseId);
    setIsLoading(true);

    try {
      // Step 1: Fetch employee data including CV
      const employeeData = await fetchEmployeeDataForCourse(courseId);

      // Step 2: Call Edge Function for regeneration
      updateProgress("Calling Edge Function to personalize content...");
      const edgeFuncRes = await fetch(
        "https://ujlqzkkkfatehxeqtbdl.functions.supabase.co/regenerate-course-content",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            courseId,
            employeeId: employeeData.employeeId
          })
        }
      );

      if (!edgeFuncRes.ok) {
        const errJson = await edgeFuncRes.json();
        throw new Error(errJson?.error || "Edge function error");
      }

      const edgeResult = await edgeFuncRes.json();
      if (!edgeResult.success) {
        throw new Error(edgeResult?.error || "Failed to generate personalized content");
      }

      toast({
        title: "Content Regenerated Successfully",
        description: "The course content has been personalized and saved.",
        variant: "default",
      });

      logOperation("✅ Content regeneration completed successfully!", {
        contentId: edgeResult.contentId,
        jobId: edgeResult.jobId
      });

      if (onSuccess && edgeResult.jobId) {
        onSuccess(edgeResult.jobId);
      }

      window.location.reload();
    } catch (error: any) {
      logOperation(`💥 Error regenerating course content: ${error.message}`);

      toast({
        title: "Regeneration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });

      if (onError) onError(error);
    } finally {
      setIsLoading(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleRegenerate} 
        disabled={isLoading}
        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcwIcon className="h-4 w-4 mr-2" />}
        {isLoading ? "Regenerating..." : "Regenerate Content (Vite)"}
      </Button>
      
      {currentStep && (
        <div className="text-xs text-muted-foreground mt-1">
          <span className="font-medium">Status:</span> {currentStep}
        </div>
      )}
    </div>
  );
};

export default RegenerateContentButtonVite;
