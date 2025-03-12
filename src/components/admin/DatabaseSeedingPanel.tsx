import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { seedAllCourseData } from '@/utils/database/seedCourses';
import { seedAllEmployeeData } from '@/utils/database/seedEmployees';
import { seedAllAssessmentData } from '@/utils/database/seedAssessments';
import { AlertCircle, CheckCircle, FileText, Users, BookOpen, Activity } from 'lucide-react';

/**
 * DatabaseSeedingPanel provides an admin UI for seeding the database with test data
 * This component should only be used in development or staging environments
 */
const DatabaseSeedingPanel: React.FC = () => {
  const [options, setOptions] = React.useState({
    employees: true,
    courses: true,
    assessments: true
  });
  const [status, setStatus] = React.useState<'idle' | 'seeding' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{ success: boolean; message: string }>({ success: false, message: '' });
  
  const getTotalSteps = () => {
    let steps = 0;
    if (options.employees) steps++;
    if (options.courses) steps++;
    if (options.assessments) steps++;
    return steps;
  };
  
  const handleOptionChange = (option: 'employees' | 'courses' | 'assessments') => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  const resetState = () => {
    setStatus('idle');
    setProgress(0);
    setResult({ success: false, message: '' });
  };
  
  const handleSeedDatabase = async () => {
    try {
      resetState();
      setStatus('seeding');
      const totalSteps = getTotalSteps();
      let completedSteps = 0;
      
      if (options.employees) {
        await seedAllEmployeeData();
        completedSteps++;
        setProgress(Math.floor((completedSteps / totalSteps) * 100));
      }
      
      if (options.courses) {
        await seedAllCourseData();
        completedSteps++;
        setProgress(Math.floor((completedSteps / totalSteps) * 100));
      }
      
      if (options.assessments) {
        await seedAllAssessmentData();
        completedSteps++;
        setProgress(Math.floor((completedSteps / totalSteps) * 100));
      }
      
      setStatus('completed');
      setResult({
        success: true,
        message: 'Database seeding completed successfully!'
      });
    } catch (error) {
      setStatus('error');
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
  
  return (
    <Card className="w-full max-w-3xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Database Seeding
        </CardTitle>
        <CardDescription>
          Populate the database with test data for development and testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4" variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Development Use Only</AlertTitle>
          <AlertDescription>
            This tool should only be used in development or staging environments, never in production.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Select data types to seed:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="employees" 
                  checked={options.employees}
                  onCheckedChange={() => handleOptionChange('employees')}
                />
                <Label htmlFor="employees" className="flex items-center cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Employees/Learners
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="courses" 
                  checked={options.courses}
                  onCheckedChange={() => handleOptionChange('courses')}
                />
                <Label htmlFor="courses" className="flex items-center cursor-pointer">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Courses
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="assessments" 
                  checked={options.assessments}
                  onCheckedChange={() => handleOptionChange('assessments')}
                />
                <Label htmlFor="assessments" className="flex items-center cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Assessments
                </Label>
              </div>
            </div>
          </div>
          
          {status !== 'idle' && (
            <div className="space-y-2">
              <Separator />
              <div className="space-y-1">
                <p className="text-sm">{status === 'seeding' ? 'Seeding in progress...' : 'Seeding completed'}</p>
                <Progress value={progress} className="h-2" />
              </div>
              
              {status === 'completed' && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetState} disabled={status === 'seeding'}>
          Reset
        </Button>
        <Button 
          onClick={handleSeedDatabase} 
          disabled={status === 'seeding' || !Object.values(options).some(Boolean)}
        >
          Seed Database
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseSeedingPanel; 