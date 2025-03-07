import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import LoginPageMigrated from "./pages/LoginPageMigrated";
import RegisterPage from "./pages/RegisterPage";
import RegisterPageMigrated from "./pages/RegisterPageMigrated";
import Dashboard from "./pages/Dashboard";
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
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRouteMigrated allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
                <Dashboard />
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
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]}>
                <HRDashboardMigrated />
              </ProtectedRouteMigrated>
            } 
          />
          
          <Route 
            path="/hr/dashboard/*" 
            element={
              <ProtectedRouteMigrated allowedRoles={["hr", "superadmin"]}>
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
