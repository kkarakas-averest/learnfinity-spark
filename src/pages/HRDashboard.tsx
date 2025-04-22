import React from "@/lib/react-helpers";
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { LogOut, Users, BookOpen, BarChart2, AlertCircle, Activity } from 'lucide-react';
import { HRDashboardTab } from '@/types/hr.types';
import { useToast } from '@/components/ui/use-toast';
import { hrServices } from '@/lib/services/hrServices';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Employee } from "@/types/hr.types";
import EmployeeIntervention from '@/components/hr/EmployeeIntervention';

// Import HR components
const DashboardOverview = React.lazy(() => import('@/components/hr/DashboardOverview'));
const EmployeeManagement = React.lazy(() => import('@/components/hr/EmployeeManagement'));
const EmployeeDataDashboard = React.lazy(() => import('@/components/hr/EmployeeDataDashboard'));
const CourseCreationWizard = React.lazy(() => import('@/components/hr/CourseCreationWizard'));

// Define an extended type for hrServices
type HRServicesExtended = typeof hrServices & {
  initializeHRDatabase: () => Promise<{ success: boolean; error?: string }>;
};

// Cast the imported hrServices to our extended type
const hrServicesExtended = hrServices as HRServicesExtended;

export default function HRDashboard() {
  const { toast } = useToast();
  const { hrUser, isAuthenticated, logout } = useHRAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<HRDashboardTab>('overview');
  const [initializing, setInitializing] = React.useState(true);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [showInterventionDialog, setShowInterventionDialog] = React.useState(false);
  const isLoading = false; // Define isLoading as a constant since it's not provided by HRAuthContext
  
  // Parse the query parameters to get the tab
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'employees', 'courses', 'reports', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam as HRDashboardTab);
    }
  }, [location]);

  // Initialize database if needed
  React.useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing HR database...');
        setInitError(null);
        
        // Call the initialization function and handle the response
        const result = await hrServicesExtended.initializeHRDatabase();
        console.log('HR database initialization result:', result);
        
        if (!result || result.success === false) {
          throw new Error(result?.error || 'Unknown database initialization error');
        }
        
        console.log('HR database initialized');
      } catch (error: Error | unknown) {
        console.error('Unexpected error initializing HR database:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unexpected error initializing database';
        
        toast({
          variant: 'destructive',
          title: 'Database Initialization Failed',
          description: errorMessage,
        });
      } finally {
        setInitializing(false);
      }
    };
    
    if (isAuthenticated && !isLoading) {
      initializeDatabase();
    } else if (!isLoading) {
      setInitializing(false);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/hr-login" />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as HRDashboardTab);
    
    // Update URL without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
  };

  const handleLogout = () => {
    logout();
    signOut();
    navigate('/hr-login');
  };

  const handleRetryInit = () => {
    setInitializing(true);
    setInitError(null);
    // Force re-render which will trigger useEffect again
    window.location.reload();
  };

  // Handle intervention request
  const handleInterventionClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowInterventionDialog(true);
  };

  // Handle intervention completion
  const handleInterventionComplete = () => {
    setShowInterventionDialog(false);
    setSelectedEmployee(null);
    // Refresh the employee data
    if (activeTab === 'employees') {
      // This would refresh the EmployeeManagement component
      // In a real implementation, you would have a state or ref to the component
      // and call a refresh method
    }
  };

  if (isLoading || initializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info and logout */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Learnfinity HR Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {hrUser && (
              <span className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{hrUser.username}</span>
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content with tabs */}
      <div className="container p-4">
        {initError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              {initError}
              <div className="mt-2">
                <Button size="sm" onClick={handleRetryInit}>
                  Retry Initialization
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <BarChart2 className="mr-2 h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
              <LoadingSpinner size="xl" />
            </div>
          }>
            <TabsContent value="overview">
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="employees">
              <EmployeeManagement 
                onViewDetails={(employee: Employee) => console.log('View details:', employee)} 
                onIntervene={handleInterventionClick}
              />
            </TabsContent>
            
            <TabsContent value="courses">
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Courses Overview</TabsTrigger>
                  <TabsTrigger value="create">Create Course</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-2xl font-bold mb-4">Course Management</h2>
                    <p className="text-muted-foreground mb-6">
                      Manage your organization's courses, curricula, and learning paths.
                    </p>
                    <div className="flex gap-4">
                      <Button>View All Courses</Button>
                      <Button variant="outline">Import Courses</Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="create">
                  <CourseCreationWizard />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="reports">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
                <p className="text-muted-foreground">
                  View detailed reports and analytics on learning progress across the organization.
                  This feature is under development.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <EmployeeDataDashboard />
            </TabsContent>
          </React.Suspense>
        </Tabs>
      </div>

      {/* Intervention Dialog */}
      {selectedEmployee && (
        <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <EmployeeIntervention 
              employee={selectedEmployee} 
              onInterventionComplete={handleInterventionComplete} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
