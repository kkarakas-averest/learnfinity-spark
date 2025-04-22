import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import LoginPageMigrated from "./pages/LoginPageMigrated";
import RegisterPage from "./pages/RegisterPage";
import RegisterPageMigrated from "./pages/RegisterPageMigrated";
import Dashboard from "./pages/Dashboard";
import LearnerDashboard from "./pages/LearnerDashboard";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettings from "./pages/ProfileSettings";
import HRDashboard from "./pages/HRDashboard";
import HRLogin from "./pages/HRLogin";
import HRLoginMigrated from "./pages/HRLoginMigrated";
import HRDashboardMigrated from "./pages/HRDashboardMigrated";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedRouteMigrated from "./components/ProtectedRouteMigrated";
import DiagnosticTool from "./components/DiagnosticTool";
import ExampleErrorHandling from "./components/ExampleErrorHandling";
import FunctionalErrorBoundary from "./components/FunctionalErrorBoundary";
import { Toaster } from "./components/ui/toaster";
import { useAuth, useHRAuth } from "./state";
import { Button } from "./components/ui/button";
import SystemHealthCheck from "./pages/SystemHealthCheck";
import React, { useEffect } from "@/lib/react-helpers";
import { toast } from './components/ui/use-toast';
import databaseInitService from "./services/databaseInitService";
import LearnerLayout from './layouts/LearnerLayout';

// Import HR dashboard pages
import EmployeesPage from "./pages/hr/EmployeesPage";
import ProgramsPage from "./pages/hr/ProgramsPage";
import ReportsPage from "./pages/hr/ReportsPage";
import SettingsPage from "./pages/hr/SettingsPage";
import EmployeeProfilePage from "./pages/hr/EmployeeProfilePage";

// Import learner components
import CourseView from "./components/learner/CourseView";
import CourseViewPage from "./pages/course/CourseViewPage";

// Import Course Builder components
import CourseTemplates from "./components/admin/course-builder/CourseTemplates";
import ModuleEditor from "./components/admin/course-builder/ModuleEditor";
import CourseBuilderPage from "./pages/hr/CourseBuilderPage";

// Import HR dashboard root layout
import HRDashboardRoot from "./pages/hr/HRDashboardRoot";

// Import the AIEngineTester component
import AIEngineTester from "./pages/AIEngineTester";

// Import the AI Learning Center component
import AILearningCenter from "./pages/AILearningCenter";

// Import the AI Testing Page
import AITestingPage from "./pages/AITestingPage";

// Simple diagnostic component for auth debugging
const AuthDiagnostic = () => {
  const { user, userDetails, isLoading, error } = useAuth();
  const { hrUser, isAuthenticated: hrIsAuthenticated } = useHRAuth();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Diagnostic</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold mb-2">Regular Auth State</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
          {JSON.stringify({ user, userDetails, isLoading, error }, null, 2)}
        </pre>
      </div>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold mb-2">HR Auth State</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
          {JSON.stringify({ hrUser, hrIsAuthenticated }, null, 2)}
        </pre>
      </div>
      
      <div className="flex gap-4 mt-4">
        <Button onClick={() => window.location.href = "/login"}>Go to Login</Button>
        <Button onClick={() => window.location.href = "/hr-login"}>Go to HR Login</Button>
        <Button onClick={() => window.location.href = "/register"}>Go to Register</Button>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    const initDb = async () => {
      try {
        const result = await databaseInitService.initialize();
        if (!result.success) {
          console.error('Database initialization error:', result.error);
          toast({
            title: 'System Notice',
            description: 'Some features may not be available. Please contact the administrator.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initDb();
  }, []);

  return (
    <FunctionalErrorBoundary>
      <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPageMigrated />} />
          <Route path="/register" element={<RegisterPageMigrated />} />
          
          {/* Unified HR routes */}
          <Route path="/hr-login" element={<HRLoginMigrated />} />
          <Route path="/hr/login" element={<HRLoginMigrated />} />
          
          {/* Auth diagnostic route */}
          <Route path="/auth-diagnostic" element={<AuthDiagnostic />} />
          
          {/* AI Engine Tester */}
          <Route 
            path="/ai-tester" 
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]}>
                <AIEngineTester />
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* AI Testing Page for Content Generation */}
          <Route 
            path="/ai-testing" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <AITestingPage />
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* AI Learning Center */}
          <Route 
            path="/ai-learning-center" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <AILearningCenter />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <LearnerDashboard />
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* HR Dashboard routes */}
          <Route 
            path="/hr-dashboard" 
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardRoot />
              </ProtectedRouteMigrated>
            }
          />
          <Route
            path="/hr-dashboard/:path"
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardRoot />
              </ProtectedRouteMigrated>
            }
          />
          <Route
            path="/hr-dashboard/:path/:subpath"
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardRoot />
              </ProtectedRouteMigrated>
            }
          />
          <Route
            path="/hr-dashboard/:path/:subpath/:id"
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardRoot />
              </ProtectedRouteMigrated>
            }
          />
          
          {/* Legacy HR routes - redirect to new routes */}
          <Route path="/hr-dashboard-legacy" element={<Navigate to="/hr-dashboard" replace />} />
          <Route path="/hr/dashboard" element={<Navigate to="/hr-dashboard" replace />} />
          
          <Route 
            path="/mentor/*" 
            element={
              <ProtectedRouteMigrated allowedRoles={["mentor", "superadmin"]}>
                <Navigate to="/dashboard" replace />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRouteMigrated>
                <ProfilePage />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRouteMigrated>
                <ProfileSettings />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          
          {/* Learner Course View Route - New standardized route */}
          <Route 
            path="/learner/courses/view/:id" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <LearnerLayout>
                  <CourseViewPage />
                </LearnerLayout>
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* Legacy Course View Route - Keep for backward compatibility */}
          <Route 
            path="/learning/course/:courseId" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <CourseView />
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* Diagnostic route */}
          <Route path="/diagnostic" element={<DiagnosticTool />} />
          
          {/* System Health Check */}
          <Route path="/health-check" element={<SystemHealthCheck />} />
          
          {/* Error handling example route */}
          <Route path="/error-examples" element={<ExampleErrorHandling />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </main>
    </FunctionalErrorBoundary>
  );
}

export default App;
