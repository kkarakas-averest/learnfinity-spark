
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettings from "./pages/ProfileSettings";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import ProtectedRoute from "./components/ProtectedRoute";
import DiagnosticTool from "./components/DiagnosticTool";
import { UserRole } from "./lib/database.types";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["learner", "mentor", "hr", "superadmin"]}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/hr-dashboard/*" 
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/hr/*" 
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/mentor/*" 
          element={
            <ProtectedRoute allowedRoles={["mentor", "superadmin"]}>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        
        {/* Diagnostic route */}
        <Route path="/diagnostic" element={<DiagnosticTool />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
