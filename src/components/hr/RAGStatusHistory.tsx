import React, { useState } from '@/lib/react-helpers';
import { RAGStatus } from '@/types/hr.types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export interface StatusHistoryEntry {
  status: RAGStatus;
  date: string;
  reason?: string;
}

export interface RAGStatusHistoryProps {
  history: StatusHistoryEntry[];
  maxEntries?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltips?: boolean;
  className?: string;
}

/**
 * RAG Status History Component
 * 
 * Displays a mini-chart visualization of an employee's RAG status history
 */
export const RAGStatusHistory: React.FC<RAGStatusHistoryProps> = ({
  history = [],
  maxEntries = 5,
  size = 'md',
  showTooltips = true,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort history by date (newest first) and take only the most recent entries
  const sortedHistory = [...history]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxEntries);

  // Size classes for the status dots
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Helper function to get color based on status
  const getStatusColor = (status: RAGStatus) => {
    const colors = {
      green: 'bg-green-500 border-green-600',
      amber: 'bg-amber-500 border-amber-600',
      red: 'bg-red-500 border-red-600',
    };
    return colors[status];
  };

  // If no history, display a message
  if (!sortedHistory.length) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        No status history available
      </div>
    );
  }

  return (
    <div className={`flex space-x-1 items-center ${className}`}>
      {sortedHistory.map((entry, index) => {
        const isHovered = hoveredIndex === index;
        const dotClassName = `
          rounded-full ${sizeClasses[size]} ${getStatusColor(entry.status)} 
          border transition-all duration-200
          ${isHovered ? 'ring-2 ring-offset-1 ring-gray-300' : ''}
        `;

        const formattedDate = format(new Date(entry.date), 'MMM d, yyyy');
        
        // Status dot with optional tooltip
        return showTooltips ? (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={dotClassName}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="p-2 max-w-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Badge>
                    <span className="text-xs font-medium">{formattedDate}</span>
                  </div>
                  {entry.reason && (
                    <p className="text-xs text-muted-foreground">{entry.reason}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div 
            key={index}
            className={dotClassName}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        );
      })}
    </div>
  );
};

export default RAGStatusHistory; 