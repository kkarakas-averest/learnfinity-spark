import React from "@/lib/react-helpers";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Dashboard = () => {
  const { user, userDetails, isLoading } = useAuth();

  // Redirect if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="container relative pt-20 pb-12">
      <WelcomeHeader userName={userDetails?.name || "User"} />
      <DashboardTabs />
    </div>
  );
};

export default Dashboard;
