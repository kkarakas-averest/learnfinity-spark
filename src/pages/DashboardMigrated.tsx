import React from "@/lib/react-helpers";
import { Navigate } from "react-router-dom";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import from our new state management system
import { useAuth, useUI } from "@/state";

/**
 * Dashboard component that displays the user's learning progress, stats, and recommendations
 * Uses the new state management system with useAuth and useUI hooks
 */
const DashboardMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { user, userDetails, isLoading } = useAuth();
  const { isMobile } = useUI();
  
  // Redirect if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`container relative ${isMobile ? 'pt-10' : 'pt-20'} pb-12`}>
      <WelcomeHeader userName={userDetails?.name || "User"} />
      <DashboardTabs />
    </div>
  );
};

export default DashboardMigrated; 