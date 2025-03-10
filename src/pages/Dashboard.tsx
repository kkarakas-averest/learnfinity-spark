import React from "@/lib/react-helpers";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/state";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Call useAuth hook unconditionally at the top level
  const { user, userDetails, isLoading } = useAuth();
  
  try {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to login");
      return <Navigate to="/login" />;
    }

    // Show loading state
    if (isLoading) {
      console.log("Dashboard: Auth is loading, showing spinner");
      return (
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="xl" />
        </div>
      );
    }

    console.log("Dashboard: Rendering with user:", user?.id, "details:", userDetails);
    return (
      <div className="container relative pt-20 pb-12">
        <WelcomeHeader userName={userDetails?.name || "User"} />
        <DashboardTabs />
      </div>
    );
  } catch (error) {
    console.error("Dashboard: Error using auth:", error);
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p>{error instanceof Error ? error.message : "Authentication error"}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
};

export default Dashboard;
