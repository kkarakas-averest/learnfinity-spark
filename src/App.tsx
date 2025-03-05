import React from "@/lib/react-helpers";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { HRAuthProvider } from "@/contexts/HRAuthContext";
import { ROUTES, buildRoute } from "@/lib/routes";
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
        // Check if initialize method exists before calling it
        if (typeof hrEmployeeService.initialize === 'function') {
          const result = await hrEmployeeService.initialize();
          if (result && !result.success) {
            console.error('Failed to initialize HR system:', result.error);
            toast({
              title: "HR System Initialization Warning",
              description: "Some HR features may be limited.",
              variant: "destructive"
            });
          } else {
            console.log('HR system initialized successfully');
          }
        } else {
          console.log('HR initialization method not available, skipping...');
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
              <Route path={ROUTES.COURSE_DETAIL} element={<CourseDetailPage />} />
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
              {/* HR routes */}
              <Route path={ROUTES.HR_LOGIN} element={<HRLogin />} />
              <Route path={ROUTES.HR_DASHBOARD} element={<HRDashboard />} />
              <Route path={ROUTES.HR_DASHBOARD_EMPLOYEES_NEW} element={<CreateEmployeePage />} />
              <Route path={ROUTES.HR_DASHBOARD_EMPLOYEES_EDIT} element={<EditEmployeePage />} />
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
                  <ProtectedRoute allowedRoles={["superadmin"]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </HRAuthProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
