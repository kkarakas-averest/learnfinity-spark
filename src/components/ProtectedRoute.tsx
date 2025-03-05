
import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/database.types";
import { toast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userDetails, isLoading } = useAuth();
  
  React.useEffect(() => {
    // For demonstration purposes - showing a toast to guide users
    if (!user && window.location.pathname.includes('admin')) {
      toast({
        title: "Admin access",
        description: "This is a protected route. You would normally need to sign in as a superadmin.",
        duration: 5000,
      });
    }
  }, [user]);

  // If authentication is still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the required role, redirect
  if (allowedRoles && userDetails && !allowedRoles.includes(userDetails.role)) {
    // Redirect based on the user's role
    switch (userDetails.role) {
      case "superadmin":
        return <Navigate to="/admin" replace />;
      case "hr":
        return <Navigate to="/hr" replace />;
      case "mentor":
        return <Navigate to="/mentor" replace />;
      case "learner":
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
