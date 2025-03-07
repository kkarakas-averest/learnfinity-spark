import React from '@/lib/react-helpers';
import { RAGStatus, RAGStatusDetails } from '@/types/hr.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { TrendUpIcon, TrendDownIcon, MinusIcon } from '@/components/ui/custom-icons';

interface RAGStatusTimelineProps {
  statusHistory: RAGStatusDetails[];
  title?: string;
  description?: string;
  showDetailedView?: boolean;
  maxItems?: number;
  compact?: boolean;
}

/**
 * RAGStatusTimeline Component
 * 
 * Visualizes the RAG status history of an employee over time
 * with trend indicators and detailed information.
 */
const RAGStatusTimeline: React.FC<RAGStatusTimelineProps> = ({
  statusHistory,
  title = "RAG Status History",
  description = "Status changes over time with justifications",
  showDetailedView = false,
  maxItems = 5,
  compact = false,
}) => {
  // Sort status history by date (most recent first)
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  
  // Limit the number of items to display
  const displayedHistory = maxItems ? sortedHistory.slice(0, maxItems) : sortedHistory;
  
  // Determine if status is improving, worsening, or stable
  const getTrend = (current: RAGStatus, previous: RAGStatus): 'improving' | 'worsening' | 'stable' => {
    const statusValue = (status: RAGStatus): number => {
      switch (status) {
        case 'green': return 2;
        case 'amber': return 1;
        case 'red': return 0;
      }
    };
    
    const currentValue = statusValue(current);
    const previousValue = statusValue(previous);
    
    if (currentValue > previousValue) return 'improving';
    if (currentValue < previousValue) return 'worsening';
    return 'stable';
  };
  
  // Get trend between consecutive status updates
  const getStatusWithTrend = (index: number): { status: RAGStatus, trend: 'improving' | 'worsening' | 'stable' } => {
    const currentStatus = displayedHistory[index].status;
    
    // If this is the first item, there's no previous status to compare with
    if (index === displayedHistory.length - 1) {
      return { status: currentStatus, trend: 'stable' };
    }
    
    const previousStatus = displayedHistory[index + 1].status;
    return { status: currentStatus, trend: getTrend(currentStatus, previousStatus) };
  };
  
  // Render a status badge with appropriate styling
  const renderStatusBadge = (status: RAGStatus): JSX.Element => {
    const getStatusColorClass = (status: RAGStatus): string => {
      switch (status) {
        case 'red': return 'bg-destructive text-destructive-foreground';
        case 'amber': return 'bg-yellow-500 text-white';
        case 'green': return 'bg-green-500 text-white';
        default: return 'bg-gray-500 text-white';
      }
    };
    
    const getStatusIcon = (status: RAGStatus): JSX.Element => {
      switch (status) {
        case 'red': return <AlertCircle className="h-3 w-3 mr-1" />;
        case 'amber': return <AlertTriangle className="h-3 w-3 mr-1" />;
        case 'green': return <CheckCircle className="h-3 w-3 mr-1" />;
        default: return <div className="h-3 w-3 mr-1" />;
      }
    };
    
    return (
      <Badge className={`capitalize flex items-center ${getStatusColorClass(status)}`}>
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };
  
  // Render a trend indicator
  const renderTrendIndicator = (trend: 'improving' | 'worsening' | 'stable'): JSX.Element => {
    switch (trend) {
      case 'improving':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TrendUpIcon className="h-4 w-4 text-green-500" />
              </TooltipTrigger>
              <TooltipContent>Improving</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'worsening':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TrendDownIcon className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Worsening</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'stable':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MinusIcon className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>Stable</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };
  
  // If no history, show empty state
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardHeader className={compact ? 'p-2' : ''}>
          <CardTitle className={compact ? 'text-base' : ''}>{title}</CardTitle>
          {!compact && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={compact ? 'p-2' : ''}>
          <p className="text-sm text-muted-foreground">No status history available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={compact ? 'p-2' : ''}>
      <CardHeader className={compact ? 'p-2' : ''}>
        <CardTitle className={compact ? 'text-base' : ''}>{title}</CardTitle>
        {!compact && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={compact ? 'p-2' : ''}>
        <div className="space-y-4">
          {displayedHistory.map((statusDetail, index) => {
            const { status, trend } = getStatusWithTrend(index);
            const date = new Date(statusDetail.lastUpdated);
            const formattedDate = new Intl.DateTimeFormat('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(date);
            
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  <div className="rounded-full w-2 h-2 bg-primary mt-2"></div>
                  {index < displayedHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                  )}
                </div>
                
                <div className="flex-1 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      {renderStatusBadge(status)}
                      {index > 0 && renderTrendIndicator(trend)}
                    </div>
                    <div className="text-xs text-muted-foreground">{formattedDate}</div>
                  </div>
                  
                  {showDetailedView && (
                    <>
                      <p className="text-sm my-2">{statusDetail.justification}</p>
                      
                      {statusDetail.recommendedActions && statusDetail.recommendedActions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                          <ul className="text-xs list-disc list-inside text-muted-foreground">
                            {statusDetail.recommendedActions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Updated by: {statusDetail.updatedBy}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {statusHistory.length > maxItems && maxItems > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Showing {maxItems} of {statusHistory.length} status updates.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RAGStatusTimeline; 