import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { HRAuthProvider } from "@/contexts/HRAuthContext";
import { ROUTES } from "@/lib/routes";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import Courses from "@/pages/Courses";
import CourseDetailPage from "@/pages/CourseDetail";
import HRDashboard from "@/pages/HRDashboard";
import HRLogin from "@/pages/HRLogin";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import OnboardingWizard from "@/pages/OnboardingWizard";
import ProfileSettings from "@/pages/ProfileSettings";
import Billing from "@/pages/Billing";
import CreateEmployeePage from "@/components/hr/CreateEmployeePage";
import EditEmployeePage from "@/components/hr/EditEmployeePage";
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { toast } from "@/components/ui/use-toast";

import "./App.css";

function App() {
  React.useEffect(() => {
    const initializeHR = async () => {
      try {
        console.log('Starting HR system initialization...');
        const result = await hrEmployeeService.initialize();
        if (!result.success) {
          console.error('Failed to initialize HR system:', result.error);
          toast({
            title: "HR System Initialization Warning",
            description: "Some HR features may be limited.",
            variant: "destructive"
          });
        } else {
          console.log('HR system initialized successfully');
        }
      } catch (error) {
        console.error('Error during HR system initialization:', error);
        // Don't block the app from loading if HR fails to initialize
      }
    };
    
    // Wrap in a try-catch to prevent app from breaking if initialization fails
    try {
      initializeHR();
    } catch (error) {
      console.error('Critical error during HR initialization:', error);
    }
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <HRAuthProvider>
            <Routes>
              <Route path={ROUTES.HOME} element={<Index />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={ROUTES.COURSES} element={<Courses />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path={ROUTES.ONBOARDING} element={<OnboardingWizard />} />
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SETTINGS_PROFILE}
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SETTINGS_BILLING}
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              {/* HR routes using HRAuthProvider */}
              <Route path={ROUTES.HR_LOGIN} element={
                <HRAuthProvider>
                  <HRLogin />
                </HRAuthProvider>
              } />
              <Route path={ROUTES.HR_DASHBOARD} element={
                <HRAuthProvider>
                  <HRDashboard />
                </HRAuthProvider>
              } />
              <Route path={ROUTES.HR_DASHBOARD_EMPLOYEES_NEW} element={
                <HRAuthProvider>
                  <CreateEmployeePage />
                </HRAuthProvider>
              } />
              <Route path="/hr-dashboard/employees/:id/edit" element={
                <HRAuthProvider>
                  <EditEmployeePage />
                </HRAuthProvider>
              } />
              <Route 
                path={ROUTES.USER_PROFILE} 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.ADMIN_DASHBOARD} 
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HRAuthProvider>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
