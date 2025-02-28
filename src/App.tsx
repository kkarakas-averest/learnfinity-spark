import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { HRAuthProvider } from "@/contexts/HRAuthContext";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import HRDashboard from "@/pages/HRDashboard";
import HRLogin from "@/pages/HRLogin";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import OnboardingWizard from "@/pages/OnboardingWizard";
import ProfileSettings from "@/pages/ProfileSettings";
import Billing from "@/pages/Billing";

import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <HRAuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/onboarding" element={<OnboardingWizard />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["learner"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/profile"
                element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/billing"
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              {/* HR routes using HRAuthProvider */}
              <Route path="/hr-login" element={
                <HRAuthProvider>
                  <HRLogin />
                </HRAuthProvider>
              } />
              <Route path="/hr" element={
                <HRAuthProvider>
                  <HRDashboard />
                </HRAuthProvider>
              } />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
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
