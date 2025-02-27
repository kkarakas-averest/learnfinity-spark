
import { Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const ProgressIndicator = ({
  progress,
  size = "md",
  showLabel = true,
  className = "",
}: ProgressIndicatorProps) => {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Circle
              className={progress === 100 ? "fill-primary text-primary" : ""}
              size={12}
            />
            <span className="font-medium">
              {progress === 100 ? "Complete" : "In Progress"}
            </span>
          </div>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <Progress value={progress} className={sizeClasses[size]} />
    </div>
  );
};

export default ProgressIndicator;
