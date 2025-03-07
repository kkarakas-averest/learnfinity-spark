import React, { useEffect, useState } from '@/lib/react-helpers';
import { Navigate, useLocation } from "react-router-dom";
import { UserRole } from "@/lib/database.types";
import { Loader2 } from "lucide-react";

// Import from our new state management system
import { useAuth, useHRAuth, useUI } from "@/state";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireHRAuth?: boolean;
}

const ProtectedRouteMigrated: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requireHRAuth = false
}) => {
  // Use our new hooks instead of the old context
  const { user, userDetails, isLoading } = useAuth();
  const { hrUser, isAuthenticated: hrIsAuthenticated, isLoading: hrIsLoading } = useHRAuth();
  const { toast } = useUI();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const location = useLocation();
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if ((isLoading && !requireHRAuth) || (hrIsLoading && requireHRAuth)) {
      timer = setTimeout(() => {
        console.log("Protected route - Loading timeout reached, forcing continue");
        setTimeoutReached(true);
      }, 5000); // 5 second timeout
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, hrIsLoading, requireHRAuth]);
  
  // Determine if we're on an HR route
  const isHRRoute = location.pathname.startsWith('/hr/') || location.pathname.startsWith('/hr-');
  
  console.log("ProtectedRouteMigrated - auth state:", { 
    user, 
    userDetails, 
    isLoading,
    hrUser,
    hrIsAuthenticated,
    hrIsLoading,
    timeoutReached,
    isHRRoute,
    requireHRAuth,
    path: location.pathname,
    allowedRoles
  });
  
  useEffect(() => {
    // For demonstration purposes - showing a toast to guide users
    if (!user && location.pathname.includes('admin')) {
      toast(
        "Admin access",
        "This is a protected route. You would normally need to sign in as a superadmin.",
        "info"
      );
    }
  }, [user, toast, location.pathname]);

  // If authentication is still loading, show a loading indicator
  if ((isLoading && !requireHRAuth) || (hrIsLoading && requireHRAuth) && !timeoutReached) {
    console.log("Protected route - Authentication is still loading");
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // For HR routes, check HR authentication
  if (requireHRAuth || isHRRoute) {
    if (timeoutReached || !hrIsAuthenticated) {
      console.log("Protected route - HR user not authenticated or loading timed out, redirecting to HR login");
      return <Navigate to="/hr-login" replace />;
    }
    
    return <>{children}</>;
  }
  
  // For regular routes, check regular authentication
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