import * as React from "react";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loading spinner component for indicating loading states
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg, xl)
 * @param {string} props.className - Additional classes
 * @returns {JSX.Element} Loading spinner component
 */
export const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary", 
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    />
  );
};

export default LoadingSpinner; 