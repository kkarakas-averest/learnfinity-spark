import React, { useState, useEffect, useRef, forwardRef } from '@/lib/react-helpers';
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
  showTransition?: boolean;
  previousStatus?: RAGStatus | null;
  transitionDuration?: number;
}

/**
 * RAG Status Badge Component
 * 
 * Displays a color-coded badge representing the Red-Amber-Green status
 * with optional tooltip and animation effects
 */
export const RAGStatusBadge = forwardRef<HTMLDivElement, RAGStatusBadgeProps>(({
  status,
  label,
  showTooltip = true,
  tooltipContent,
  animate = false,
  size = 'md',
  className = '',
  showTransition = false,
  previousStatus = null,
  transitionDuration = 1500,
}, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedStatus, setDisplayedStatus] = useState<RAGStatus>(status);
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle animation when status changes or animation is explicitly requested
  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, animate]);

  // Handle status transition animation
  useEffect(() => {
    // If previous status exists and is different from current status
    if (showTransition && previousStatus && previousStatus !== status) {
      setTransitioning(true);
      setDisplayedStatus(previousStatus);
      
      // First half of transition - old status fades out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        // Second half of transition - new status fades in
        setDisplayedStatus(status);
        
        // End transition
        timeoutRef.current = setTimeout(() => {
          setTransitioning(false);
        }, transitionDuration / 2);
      }, transitionDuration / 2);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      setDisplayedStatus(status);
    }
  }, [status, previousStatus, showTransition, transitionDuration]);

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
  
  const displayLabel = label || defaultLabels[displayedStatus];
  const displayTooltip = tooltipContent || defaultTooltips[status]; // Always show tooltip for current status
  
  const badgeContent = (
    <Badge 
      ref={ref}
      className={`
        ${variants[displayedStatus]} 
        ${sizeClasses[size]}
        ${isAnimating ? 'animate-rag-status-pulse' : ''}
        ${transitioning ? 'animate-rag-status-transition' : ''}
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
});

RAGStatusBadge.displayName = "RAGStatusBadge";

export default RAGStatusBadge; 