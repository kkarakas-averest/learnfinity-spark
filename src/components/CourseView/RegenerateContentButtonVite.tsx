
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

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      // You may want to pass an auth token here if required by your Express code
      const response = await fetch("/api/hr-course-regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      if (!response.ok) {
        let errorMsg = `Server responded with ${response.status}`;
        try {
          const data = await response.json();
          errorMsg = data?.error || data?.message || errorMsg;
        } catch {
          // If non-JSON, fall back
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      toast({
        title: "Regeneration Started",
        description: "Your course content regeneration job was accepted.",
        variant: "default",
      });

      if (onSuccess && data?.job_id) {
        onSuccess(data.job_id);
      }
    } catch (error: any) {
      toast({
        title: "Regeneration Error",
        description: error.message || "Unknown error.",
        variant: "destructive",
      });
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleRegenerate} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {isLoading ? "Regenerating..." : "Regenerate Content"}
    </Button>
  );
};

export default RegenerateContentButtonVite;
