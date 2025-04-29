import React from 'react';
import { CourseAI } from '@/components/chat/CourseAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Book } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Local Plus icon
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Define the Employee type
type Employee = {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
};

// Functional ErrorBoundary
function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by error boundary:", error);
      setHasError(true);
      
      // Optionally report to error monitoring service
      // if (window && (window as any).Sentry) (window as any).Sentry.captureException(error);
      
      // Prevent the error from bubbling up
      error.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="p-8 text-center text-red-600">
        Something went wrong in the chat. Please refresh the page.
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function CourseGeneratorPage() {
  const [activeTab, setActiveTab] = React.useState('chat');
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  const { toast } = useToast();

  // Fetch employees when the component loads or the tab changes to 'assigned'
  React.useEffect(() => {
    if (activeTab === 'assigned') {
      fetchEmployees();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('id, name, email, hr_departments(name), hr_positions(title)')
        .order('name');

      if (error) {
        throw error;
      }

      // Map joined fields to department and position for UI
      setEmployees(
        (data || []).map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.hr_departments?.name || '',
          position: emp.hr_positions?.title || ''
        }))
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Failed to load employees',
        description: 'There was an error loading the employee list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Generator</h1>
            <p className="text-muted-foreground mt-1">
              Create personalized courses using AI and employee skills data
            </p>
          </div>
        </div>

        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              AI Course Designer
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee Specific
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Course Designer</CardTitle>
                <CardDescription>
                  Engage with our AI to create customized learning content for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatErrorBoundary>
                  <CourseAI />
                </ChatErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee-Specific Course Design</CardTitle>
                <CardDescription>
                  Create personalized learning content targeted to specific employees and their skill gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-72">
                      <Select 
                        value={selectedEmployeeId || ''} 
                        onValueChange={handleEmployeeSelect}
                        disabled={isLoadingEmployees}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingEmployees ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : employees.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">
                              No employees found
                            </div>
                          ) : (
                            employees.map((employee: Employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.department || 'No department'})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={fetchEmployees}
                      disabled={isLoadingEmployees}
                    >
                      {isLoadingEmployees ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          Refresh List
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedEmployeeId ? (
                    <ChatErrorBoundary>
                      <CourseAI 
                        employeeId={selectedEmployeeId} 
                        initialMessage="I'd like to create a course for this employee based on their skill gaps and current role." 
                      />
                    </ChatErrorBoundary>
                  ) : (
                    <div className="bg-muted rounded-lg p-8 text-center">
                      <h3 className="text-lg font-medium mb-2">Select an Employee</h3>
                      <p className="text-muted-foreground">
                        Choose an employee from the dropdown to start designing a personalized course
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 