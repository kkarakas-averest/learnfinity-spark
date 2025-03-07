import React, { useState, useEffect } from '@/lib/react-helpers';
import { RAGStatus } from '@/types/hr.types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface RAGStatusBadgeProps {
  status: RAGStatus;
  label?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * RAG Status Badge Component
 * 
 * Displays a color-coded badge representing the Red-Amber-Green status
 * with optional tooltip and animation effects
 */
export const RAGStatusBadge: React.FC<RAGStatusBadgeProps> = ({
  status,
  label,
  showTooltip = true,
  tooltipContent,
  animate = false,
  size = 'md',
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle animation when status changes or animation is explicitly requested
  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, animate]);

  // Color variants for each status
  const variants = {
    green: "bg-green-500 hover:bg-green-600 border-green-600",
    amber: "bg-amber-500 hover:bg-amber-600 border-amber-600",
    red: "bg-red-500 hover:bg-red-600 border-red-600"
  };
  
  // Default labels if none provided
  const defaultLabels = {
    green: "On Track",
    amber: "Needs Attention",
    red: "Urgent Intervention"
  };

  // Default tooltips if none provided
  const defaultTooltips = {
    green: "Employee is progressing well with no significant issues",
    amber: "Employee needs some attention or assistance",
    red: "Employee requires immediate intervention"
  };

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "px-3 py-1"
  };
  
  const displayLabel = label || defaultLabels[status];
  const displayTooltip = tooltipContent || defaultTooltips[status];
  
  const badgeContent = (
    <Badge 
      className={`
        ${variants[status]} 
        ${sizeClasses[size]}
        ${isAnimating ? 'animate-rag-status-pulse' : ''}
        ${className}
      `}
    >
      {displayLabel}
    </Badge>
  );
  
  // If tooltip is disabled, just return the badge
  if (!showTooltip) {
    return badgeContent;
  }
  
  // With tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RAGStatusBadge; 