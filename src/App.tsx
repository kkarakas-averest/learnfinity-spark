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
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
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
import { UserRole } from "./lib/database.types";
import { Toaster } from "./components/ui/toaster";
import { useAuth, useHRAuth } from "./state";
import { Button } from "./components/ui/button";
import SystemHealthCheck from "./pages/SystemHealthCheck";

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
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <LearnerDashboard />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRouteMigrated allowedRoles={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRouteMigrated allowedRoles={["superadmin"]}>
                <SuperAdminDashboard />
              </ProtectedRouteMigrated>
            } 
          />
          
          {/* Unified HR Dashboard routes */}
          <Route 
            path="/hr-dashboard/*" 
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardMigrated />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/hr/dashboard/*" 
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]} requireHRAuth={true}>
                <HRDashboardMigrated />
              </ProtectedRouteMigrated>
            } 
          />
          
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
          
          {/* Diagnostic route */}
          <Route path="/diagnostic" element={<DiagnosticTool />} />
          
          {/* System Health Check */}
          <Route path="/health-check" element={<SystemHealthCheck />} />
          
          {/* Error handling example route */}
          <Route path="/error-examples" element={<ExampleErrorHandling />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
    </FunctionalErrorBoundary>
  );
}

export default App;
