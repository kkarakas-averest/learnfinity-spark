import React, { useState, useEffect } from "@/lib/react-helpers";
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { LogOut, Users, BookOpen, BarChart2, AlertTriangle } from 'lucide-react';
import { HRDashboardTab } from '@/types/hr.types';
import { hrServices } from '@/lib/services/hrServices';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import from our new state management system
import { useHRAuth, useAuth, useUI } from "@/state";

// Import HR components
const DashboardOverview = React.lazy(() => import('@/components/hr/DashboardOverview'));
const EmployeeManagement = React.lazy(() => import('@/components/hr/EmployeeManagement'));

const HRDashboardMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { hrUser, isAuthenticated, isLoading: hrLoading, logout } = useHRAuth();
  const { signOut } = useAuth();
  const { toast, toastError, toastSuccess } = useUI();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<HRDashboardTab>('overview');
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Redirect if not authenticated
  if (!hrLoading && !isAuthenticated) {
    return <Navigate to="/hr/login" replace />;
  }
  
  // Parse the query parameters to get the tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'employees', 'courses', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as HRDashboardTab);
    }
  }, [location]);

  // Initialize database if needed
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing HR database...');
        setInitError(null);
        
        // Call the initialization function and handle the response
        const result = await hrServices.initializeHRDatabase();
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
        
        setInitError(errorMessage);
        toastError(
          'Database initialization failed',
          errorMessage
        );
      } finally {
        setInitializing(false);
      }
    };
    
    initializeDatabase();
  }, [toastError]);

  // Handle tab change
  const handleTabChange = (value: HRDashboardTab) => {
    setActiveTab(value);
    navigate(`/hr/dashboard?tab=${value}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Logout from HR auth
      logout();
      
      // Optionally logout from regular auth if needed
      await signOut();
      
      navigate('/hr/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toastError('Logout failed', 'An error occurred while logging out');
    }
  };

  if (hrLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Initialization Failed</AlertTitle>
          <AlertDescription>{initError}</AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {hrUser?.username || 'HR Administrator'}
          </p>
        </div>
        
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as HRDashboardTab)}
        className="space-y-6"
      >
        <div className="border-b">
          <TabsList className="w-full justify-start">
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
              Course Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>
        
        {initializing ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="employees" className="space-y-6">
              <EmployeeManagement />
            </TabsContent>
            
            <TabsContent value="courses" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium">Course Management</h3>
                <p className="text-muted-foreground">
                  Manage employee training courses and learning paths
                </p>
                <p className="text-md mt-4">Coming soon...</p>
              </Card>
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium">Reports</h3>
                <p className="text-muted-foreground">
                  View and generate reports on employee progress
                </p>
                <p className="text-md mt-4">Coming soon...</p>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default HRDashboardMigrated; 