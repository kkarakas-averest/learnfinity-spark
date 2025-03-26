import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HRLearnerService } from '@/services/hrLearnerService';
import { RAGStatusBadge } from './RAGStatusBadge';

interface LearningStatistics {
  total_employees: number;
  active_paths: number;
  completion_rate: number;
  at_risk_count: number;
  avg_progress: number;
  recent_completions: number;
}

interface EmployeeProgress {
  user_id: string;
  name: string;
  email: string;
  department: string;
  active_paths: number;
  avg_progress: number;
  rag_status: 'red' | 'amber' | 'green';
  recent_activity: string;
  last_active: string;
}

interface LearnerProgressSummaryProps {
  period?: 'week' | 'month' | 'quarter';
}

export default function LearnerProgressSummary({ period = 'week' }: LearnerProgressSummaryProps) {
  const [statistics, setStatistics] = useState<LearningStatistics | null>(null);
  const [employeeProgress, setEmployeeProgress] = useState<EmployeeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { success, data, error: serviceError, missingTables } = await HRLearnerService.getLearnerProgressSummary();

      if (!success || serviceError) {
        let errorMessage = serviceError || 'Failed to load learner progress data';
        
        if (missingTables && missingTables.length > 0) {
          errorMessage = `Required database tables do not exist: ${missingTables.join(', ')}. Please run the database setup script.`;
        }
        
        throw new Error(errorMessage);
      }

      setStatistics(data.statistics);
      setEmployeeProgress(data.employees);
    } catch (err: any) {
      console.error('Error fetching learner progress:', err);
      setError(err.message || 'An error occurred while fetching learner progress data');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load learner progress data. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [period]);

  const getRAGStatusColor = (status: 'red' | 'amber' | 'green') => {
    switch (status) {
      case 'red':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'amber':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'green':
        return 'text-green-500 bg-green-50 border-green-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Learner Progress Summary</h2>
        <Tabs defaultValue={period}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="quarter">This Quarter</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-red-600 font-medium">{error}</p>
                {error.includes('database tables do not exist') && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-600">To fix this issue:</p>
                    <ol className="list-decimal list-inside text-sm text-red-600 pl-2">
                      <li>Make sure you've set SUPABASE_SERVICE_KEY in your .env file</li>
                      <li>Run database setup script: <code className="bg-red-100 px-1 rounded">node src/db/apply-hr-schema.js</code></li>
                      <li>Populate test data: <code className="bg-red-100 px-1 rounded">node src/scripts/populate-hr-employees.js</code></li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchProgressData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">Employee Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{statistics?.avg_progress || 0}%</p>
                    <p className="text-sm text-muted-foreground">Average progress</p>
                  </div>
                  <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <Progress 
                  value={statistics?.avg_progress || 0} 
                  className="h-2 mt-4" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">Active Learning Paths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{statistics?.active_paths || 0}</p>
                    <p className="text-sm text-muted-foreground">Current assignments</p>
                  </div>
                  <div className="h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <span className="text-green-500 font-medium">{statistics?.recent_completions || 0}</span> completed in the last {period}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">At-Risk Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{statistics?.at_risk_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Low progress or past due</p>
                  </div>
                  <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <span className="font-medium">{((statistics?.at_risk_count || 0) / (statistics?.total_employees || 1) * 100).toFixed(1)}%</span> of total employees
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Progress Breakdown</CardTitle>
              <CardDescription>
                Detail of employee progress on assigned learning paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Employee</th>
                      <th className="text-left py-3 px-2">Department</th>
                      <th className="text-left py-3 px-2">Progress</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Last Activity</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeProgress.map((employee) => (
                      <tr key={employee.user_id} className="border-b hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{employee.department}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="w-[120px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{employee.avg_progress}%</span>
                              <span className="text-xs text-muted-foreground">{employee.active_paths} paths</span>
                            </div>
                            <Progress value={employee.avg_progress} className="h-2" />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <RAGStatusBadge status={employee.rag_status} />
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-xs">{employee.recent_activity}</p>
                            <p className="text-xs text-muted-foreground">{employee.last_active}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Intervene</Button>
                            <Button variant="ghost" size="sm">Details</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="border-t py-3 flex justify-between items-center bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing {employeeProgress.length} employees out of {statistics?.total_employees || 0}
              </div>
              <Button variant="outline" size="sm">
                View All Employees
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
