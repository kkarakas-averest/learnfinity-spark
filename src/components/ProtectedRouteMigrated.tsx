import React, { useEffect, useState } from '@/lib/react-helpers';
import { Navigate } from "react-router-dom";
import { UserRole } from "@/lib/database.types";
import { Loader2 } from "lucide-react";

// Import from our new state management system
import { useAuth, useUI } from "@/state";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRouteMigrated: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  // Use our new hooks instead of the old context
  const { user, userDetails, isLoading } = useAuth();
  const { toast } = useUI();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        console.log("Protected route - Loading timeout reached, forcing continue");
        setTimeoutReached(true);
      }, 5000); // 5 second timeout
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isLoading]);
  
  console.log("ProtectedRouteMigrated - auth state:", { 
    user, 
    userDetails, 
    isLoading, 
    timeoutReached,
    path: window.location.pathname,
    allowedRoles
  });
  
  useEffect(() => {
    // For demonstration purposes - showing a toast to guide users
    if (!user && window.location.pathname.includes('admin')) {
      toast(
        "Admin access",
        "This is a protected route. You would normally need to sign in as a superadmin.",
        "info"
      );
    }
  }, [user, toast]);

  // If authentication is still loading, show a loading indicator
  if (isLoading && !timeoutReached) {
    console.log("Protected route - Authentication is still loading");
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // If loading timed out or user is not authenticated, redirect to login
  if (timeoutReached || !user) {
    console.log("Protected route - User not authenticated or loading timed out, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the required role, redirect
  if (allowedRoles && userDetails && !allowedRoles.includes(userDetails.role)) {
    console.log("Protected route - User does not have the required role:", {
      userRole: userDetails.role,
      allowedRoles
    });
    
    // Redirect based on the user's role
    switch (userDetails.role) {
      case "superadmin":
        return <Navigate to="/admin" replace />;
      case "hr":
        return <Navigate to="/hr/dashboard" replace />;
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

export default ProtectedRouteMigrated; 