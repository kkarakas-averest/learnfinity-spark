import * as React from "react";

export interface LoadingSpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export declare const LoadingSpinner: React.FC<LoadingSpinnerProps>;
export default LoadingSpinner; 