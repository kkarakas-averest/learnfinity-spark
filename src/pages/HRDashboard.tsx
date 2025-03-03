import React from "react";
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { LogOut, Users, BookOpen, BarChart2 } from 'lucide-react';
import { HRDashboardTab } from '@/types/hr.types';
import { useToast } from '@/components/ui/use-toast';
import { hrServices } from '@/services/hrServices';
import { useAuth } from '../contexts/AuthContext';

// Import HR components
const DashboardOverview = React.lazy(() => import('@/components/hr/DashboardOverview'));
const EmployeeManagement = React.lazy(() => import('@/components/hr/EmployeeManagement'));

export default function HRDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, logout } = useHRAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<HRDashboardTab>('overview');
  const [initializing, setInitializing] = React.useState(true);
  
  // Parse the query parameters to get the tab
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['overview', 'employees', 'courses', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as HRDashboardTab);
    }
  }, [location]);

  // Initialize database if needed
  React.useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await hrServices.initializeHRDatabase();
      } catch (error) {
        console.error('Error initializing database:', error);
        toast({
          title: 'Database Error',
          description: 'There was an error initializing the HR database. Some features may not work correctly.',
          variant: 'destructive',
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
  }, [isAuthenticated, isLoading]);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/hr-login" />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as HRDashboardTab);
  };

  const handleLogout = () => {
    logout();
    signOut();
    navigate('/hr-login');
  };

  if (isLoading || initializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            {user && (
              <span className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{user.name}</span>
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
        <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8">
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
          </TabsList>
          
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <TabsContent value="overview">
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="employees">
              <EmployeeManagement />
            </TabsContent>
            
            <TabsContent value="courses">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-2xl font-bold mb-4">Course Management</h2>
                <p className="text-muted-foreground">
                  Manage your organization's courses, curricula, and learning paths.
                  This feature is under development.
                </p>
              </div>
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
          </React.Suspense>
        </Tabs>
      </div>
    </div>
  );
}
