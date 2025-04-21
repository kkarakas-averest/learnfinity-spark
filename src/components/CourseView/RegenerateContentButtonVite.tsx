
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

/**
 * RegenerateContentButtonVite - pure Vite/React version
 * Props:
 *   courseId (string, required): ID of the course to regenerate.
 *   onSuccess?: callback to trigger on successful regeneration.
 *   onError?: callback for errors.
 */
interface RegenerateContentButtonViteProps {
  courseId: string;
  onSuccess?: (jobId: string) => void;
  onError?: (error: Error) => void;
}

const RegenerateContentButtonVite: React.FC<RegenerateContentButtonViteProps> = ({
  courseId,
  onSuccess,
  onError,
}) => {
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
      // Get course enrollment to find the employee
      const enrollmentResponse = await fetch(`/api/hr/courses/${courseId}/enrollment`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!enrollmentResponse.ok) {
        throw new Error(`Failed to fetch enrollment data: ${enrollmentResponse.status}`);
      }

      const enrollment = await enrollmentResponse.json();
      const employeeId = enrollment.employeeId || enrollment.employee_id;
      
      if (!employeeId) {
        throw new Error("No employee found enrolled in this course");
      }

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

  // Function to fetch course data
  const fetchCourseData = async (courseId: string) => {
    updateProgress("Fetching course details...");
    try {
      const response = await fetch(`/api/hr/courses/${courseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course data: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      logOperation(`❌ Error fetching course data: ${error.message}`);
      throw new Error(`Failed to get course data: ${error.message}`);
    }
  };

  // Function to generate personalized content
  const generatePersonalizedContent = async (
    courseId: string,
    courseData: any,
    employeeData: any
  ) => {
    updateProgress("Generating personalized content...");
    try {
      const payload = {
        courseId,
        courseTitle: courseData.title,
        courseDescription: courseData.description,
        employeeId: employeeData.employeeId,
        employeeName: employeeData.name,
        position: employeeData.position,
        department: employeeData.department,
        profileData: employeeData.cvData
      };

      // First try using the course content generation endpoint
      const response = await fetch(`/api/hr/courses/enhance-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      logOperation(`❌ Error generating content: ${error.message}`);
      throw new Error(`Failed to generate personalized content: ${error.message}`);
    }
  };

  // Function to save the generated content to the database
  const saveGeneratedContent = async (
    courseId: string, 
    employeeId: string,
    content: any
  ) => {
    updateProgress("Saving personalized content...");
    try {
      const savePayload = {
        courseId,
        employeeId,
        content,
        isActive: true,
      };

      const saveResponse = await fetch(`/api/hr/courses/save-personalized-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(savePayload),
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save content: ${saveResponse.status}`);
      }

      return await saveResponse.json();
    } catch (error: any) {
      logOperation(`❌ Error saving content: ${error.message}`);
      throw new Error(`Failed to save personalized content: ${error.message}`);
    }
  };

  // Main regenerate handler
  const handleRegenerate = async () => {
    const logId = logOperation("🔄 Starting content regeneration for course:", courseId);
    setIsLoading(true);
    
    try {
      // Step 1: Fetch employee data including CV
      const employeeData = await fetchEmployeeDataForCourse(courseId);
      
      // Step 2: Fetch course data
      const courseData = await fetchCourseData(courseId);
      
      // Step 3: Generate personalized content using Groq via the API
      const generatedContent = await generatePersonalizedContent(
        courseId,
        courseData,
        employeeData
      );
      
      // Step 4: Save the generated content to the database
      const savedResult = await saveGeneratedContent(
        courseId,
        employeeData.employeeId,
        generatedContent
      );
      
      // Step 5: Update the enrollment record to point to the new content
      updateProgress("Updating enrollment record...");
      const updateResponse = await fetch(`/api/hr/course-enrollments/update-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          employeeId: employeeData.employeeId,
          contentId: savedResult.contentId || savedResult.id
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to update enrollment: ${updateResponse.status}`);
      }
      
      const updateResult = await updateResponse.json();
      
      // Success!
      toast({
        title: "Content Regenerated Successfully",
        description: "The course content has been personalized and saved.",
        variant: "default",
      });
      
      logOperation("✅ Content regeneration completed successfully!", {
        contentId: savedResult.contentId || savedResult.id,
        jobId: updateResult.jobId || `job_${Date.now()}`
      });
      
      // Call the success callback if provided
      if (onSuccess && updateResult.jobId) {
        onSuccess(updateResult.jobId);
      }
      
      // Refresh the page to show the new content
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
        className="flex items-center space-x-2"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isLoading ? "Regenerating..." : "Regenerate Content"}
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
