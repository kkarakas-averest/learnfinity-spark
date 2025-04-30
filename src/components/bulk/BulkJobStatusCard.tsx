import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, AlertCircle, Clock, RefreshCw, Loader2 } from "lucide-react";
import type { BulkGenerationJob, BulkGenerationTask } from '@/types/bulk-generation';

// Define additional types for our component
type EmployeeInfo = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
};

export type BulkTaskWithEmployee = BulkGenerationTask & {
  employee_info?: EmployeeInfo;
};

export interface BulkJobStatusCardProps {
  job: BulkGenerationJob;
  tasks: BulkTaskWithEmployee[];
  progress: number;
  estimatedCompletionTime?: string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

// Helper to format a timestamp
const formatTime = (timeStr?: string) => {
  if (!timeStr) return 'N/A';
  const date = new Date(timeStr);
  return date.toLocaleString();
};

// Helper to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'failed': return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'processing': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

// Helper for status icons
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return null;
  }
};

export function BulkJobStatusCard({
  job,
  tasks,
  progress,
  estimatedCompletionTime,
  onRefresh,
  isRefreshing = false
}: BulkJobStatusCardProps) {
  // Group tasks by status
  const tasksByStatus = tasks.reduce<Record<string, BulkTaskWithEmployee[]>>((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {});

  // Create status counts
  const statusCounts = {
    completed: tasksByStatus.completed?.length || 0,
    failed: tasksByStatus.failed?.length || 0,
    processing: tasksByStatus.processing?.length || 0,
    pending: tasksByStatus.pending?.length || 0
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.base_title}</CardTitle>
            <CardDescription>
              {job.group_type.charAt(0).toUpperCase() + job.group_type.slice(1)}: {job.group_id}
            </CardDescription>
          </div>
          <Badge
            className={getStatusColor(job.status)}
            variant="outline"
          >
            {job.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progress: {Math.round(progress)}%</span>
            <span>
              {statusCounts.completed} of {job.total_count} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Created:</span>
            <p>{formatTime(job.created_at)}</p>
          </div>
          {job.completed_at && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Completed:</span>
              <p>{formatTime(job.completed_at)}</p>
            </div>
          )}
          {!job.completed_at && estimatedCompletionTime && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Estimated completion:</span>
              <p>{formatTime(estimatedCompletionTime)}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="all" className="mt-4">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({statusCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({statusCounts.processing})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({statusCounts.failed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks found</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          {['completed', 'processing', 'pending', 'failed'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {!tasksByStatus[status] || tasksByStatus[status].length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No {status} tasks</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {tasksByStatus[status]?.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Task card component for individual tasks
const TaskCard = ({ task }: { task: BulkTaskWithEmployee }) => {
  const employeeName = task.employee_info?.full_name || 'Unknown Employee';
  const employeeEmail = task.employee_info?.email || '';
  
  return (
    <div className="border rounded-md p-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={task.employee_info?.avatar_url} alt={employeeName} />
          <AvatarFallback>{employeeName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{employeeName}</p>
          <p className="text-xs text-muted-foreground">{employeeEmail}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <StatusIcon status={task.status} />
        <span className="text-xs font-medium capitalize">{task.status}</span>
      </div>
    </div>
  );
}; 