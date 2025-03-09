import React from '@/lib/react-helpers';
import { RAGStatus } from '@/types/hr.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { PlayIcon, RotateCcwIcon } from '@/components/ui/custom-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RAGStatusDemoProps {
  title?: string;
  description?: string;
  showControls?: boolean;
  initialStatus?: RAGStatus;
  transitionDuration?: number;
}

/**
 * RAG Status Demo Component
 * 
 * Demonstrates the transitions between RAG statuses with interactive controls
 */
const RAGStatusDemo: React.FC<RAGStatusDemoProps> = ({
  title = "RAG Status Transitions",
  description = "Demonstration of status change animations",
  showControls = true,
  initialStatus = 'green',
  transitionDuration = 1500,
}) => {
  const [currentStatus, setCurrentStatus] = React.useState<RAGStatus>(initialStatus);
  const [previousStatus, setPreviousStatus] = React.useState<RAGStatus | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<RAGStatus>(initialStatus);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [autoPlayActive, setAutoPlayActive] = React.useState(false);
  
  // Status cycle for auto-play demonstration
  const statusCycle: RAGStatus[] = ['green', 'amber', 'red', 'amber', 'green'];
  const [cycleIndex, setCycleIndex] = React.useState(0);
  
  // Handle auto-play demonstration
  React.useEffect(() => {
    if (!autoPlayActive) return;
    
    const interval = setInterval(() => {
      const nextIndex = (cycleIndex + 1) % statusCycle.length;
      setPreviousStatus(currentStatus);
      setCurrentStatus(statusCycle[nextIndex]);
      setCycleIndex(nextIndex);
    }, transitionDuration + 1000); // Wait for transition to complete plus a pause
    
    return () => clearInterval(interval);
  }, [autoPlayActive, cycleIndex, currentStatus, transitionDuration]);
  
  // Handle manual status change
  const changeStatus = () => {
    if (isAnimating || selectedStatus === currentStatus) return;
    
    setIsAnimating(true);
    setPreviousStatus(currentStatus);
    setCurrentStatus(selectedStatus);
    
    // Reset animation flag after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, transitionDuration);
  };
  
  // Reset to initial state
  const resetDemo = () => {
    setAutoPlayActive(false);
    setPreviousStatus(null);
    setCurrentStatus(initialStatus);
    setSelectedStatus(initialStatus);
    setCycleIndex(0);
    setIsAnimating(false);
  };
  
  // Toggle auto-play demonstration
  const toggleAutoPlay = () => {
    if (autoPlayActive) {
      setAutoPlayActive(false);
    } else {
      // Start with green status regardless of current state
      setPreviousStatus(currentStatus);
      setCurrentStatus('green');
      setCycleIndex(0);
      setAutoPlayActive(true);
    }
  };
  
  // Get icon for each status
  const getStatusIcon = (status: RAGStatus) => {
    switch(status) {
      case 'green': return <CheckCircle className="h-5 w-5" />;
      case 'amber': return <AlertTriangle className="h-5 w-5" />;
      case 'red': return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          {/* Status display */}
          <div className="flex flex-col items-center justify-center h-24 w-full">
            <RAGStatusBadge 
              status={currentStatus}
              previousStatus={previousStatus}
              showTransition={previousStatus !== null}
              transitionDuration={transitionDuration}
              size="lg"
            />
            <div className="mt-3 text-sm text-muted-foreground">
              Previous: {previousStatus || 'None'} → Current: {currentStatus}
            </div>
          </div>
          
          {/* Controls */}
          {showControls && (
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as RAGStatus)}
                  disabled={autoPlayActive}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green" className="flex items-center">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Green</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="amber">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Amber</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="red">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Red</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={changeStatus} 
                  disabled={isAnimating || autoPlayActive || selectedStatus === currentStatus}
                >
                  Change Status
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={toggleAutoPlay}
                  className="flex items-center"
                >
                  <PlayIcon className={`h-4 w-4 mr-2 ${autoPlayActive ? "text-green-500" : ""}`} />
                  {autoPlayActive ? "Stop Demo" : "Auto Demo"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetDemo}
                  className="flex items-center"
                >
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RAGStatusDemo; 