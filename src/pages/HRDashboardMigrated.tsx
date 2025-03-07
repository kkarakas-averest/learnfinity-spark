import React from "@/lib/react-helpers";
import { Navigate, useNavigate } from "react-router-dom";
import { useHRAuth, useUI } from "@/state";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const HRDashboardMigrated: React.FC = () => {
  const { hrUser, isAuthenticated, isLoading, logout } = useHRAuth();
  const { toastSuccess } = useUI();
  const navigate = useNavigate();
  
  console.log("HRDashboard - Current state:", { hrUser, isAuthenticated, isLoading });

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    console.log("HRDashboard: Not authenticated, redirecting to HR login");
    return <Navigate to="/hr-login" />;
  }

  // Show loading state
  if (isLoading) {
    console.log("HRDashboard: Auth is loading, showing spinner");
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Handle logout
  const handleLogout = () => {
    logout();
    toastSuccess("Logged out", "You have been successfully logged out of HR portal");
  };

  // Navigation handlers
  const navigateToEmployees = () => {
    navigate("/hr-dashboard/employees");
  };

  const navigateToPrograms = () => {
    navigate("/hr-dashboard/programs");
  };

  const navigateToReports = () => {
    navigate("/hr-dashboard/reports");
  };

  console.log("HRDashboard: Rendering for user:", hrUser?.username);
  return (
    <div className="container relative pt-20 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
          <h2 className="text-xl">Welcome, {hrUser?.username || "HR User"}</h2>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-2">Employee Management</h3>
          <p className="text-gray-600 mb-4">Manage employee records, onboarding, and roles.</p>
          <Button variant="outline" onClick={navigateToEmployees}>View Employees</Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-2">Learning Programs</h3>
          <p className="text-gray-600 mb-4">Assign courses and track employee progress.</p>
          <Button variant="outline" onClick={navigateToPrograms}>Manage Programs</Button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
          <p className="text-gray-600 mb-4">View completion rates and assessment scores.</p>
          <Button variant="outline" onClick={navigateToReports}>View Reports</Button>
        </div>
      </div>
    </div>
  );
};

export default HRDashboardMigrated; 