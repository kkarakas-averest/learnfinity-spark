import React from "@/lib/react-helpers";
import { Navigate, useNavigate } from "react-router-dom";
import { useHRAuth, useUI } from "@/state";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// Import the services for database initialization
import { hrServices } from '@/lib/services/hrServices';

const HRDashboardMigrated: React.FC = () => {
  const { hrUser, isAuthenticated, isLoading, logout } = useHRAuth();
  const { toastSuccess, toastError } = useUI();
  const navigate = useNavigate();
  // Add state for database initialization
  const [initializingDB, setInitializingDB] = React.useState(false);
  // Add a ref to track if initialization has been completed
  const hasInitializedRef = React.useRef(false);
  
  console.log("HRDashboard - Current state:", { hrUser, isAuthenticated, isLoading });

  // Add effect for database initialization
  React.useEffect(() => {
    // Skip initialization if already completed or in progress
    if (!isAuthenticated || initializingDB || hasInitializedRef.current) {
      return;
    }
    
    const initializeHRDatabase = async () => {
      try {
        setInitializingDB(true);
        console.log('Initializing HR database...');
        
        // Initialize the HR database
        const result = await hrServices.initializeHRDatabase();
        
        if (result && result.success) {
          console.log('HR database initialized successfully:', result.message);
          
          // Show success message only if tables were created or seeded
          if (result.message && !result.message.includes('All required tables exist')) {
            toastSuccess({
              title: "Database Ready",
              description: "HR database initialized successfully with sample data."
            });
          }
        } else {
          console.error('Failed to initialize HR database:', result?.error);
          
          // Different error messaging based on error type
          if (result?.error?.includes('permission denied')) {
            toastError({
              title: "Permission Denied",
              description: "Your account doesn't have permission to access the HR database. Please contact your administrator."
            });
          } else if (result?.error?.includes('does not exist')) {
            toastError({
              title: "Database Setup Issue",
              description: "Required database tables could not be created. Using mock data instead."
            });
          } else {
            toastError({
              title: "Database Error",
              description: "Failed to initialize HR database. Employee data may be unavailable."
            });
          }
        }
        
        // Mark initialization as complete regardless of result
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Error initializing HR database:', error);
        toastError({
          title: "Database Connection Error",
          description: "Could not connect to the database. Check your network connection or contact support."
        });
        
        // Still mark as initialized to prevent infinite loops
        hasInitializedRef.current = true;
      } finally {
        setInitializingDB(false);
      }
    };
    
    initializeHRDatabase();
    
    // Cleanup function to reset initialization state if component unmounts
    return () => {
      hasInitializedRef.current = false;
    };
  }, [isAuthenticated]); // Remove toastSuccess, toastError, initializingDB from dependencies

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    console.log("HRDashboard: Not authenticated, redirecting to HR login");
    return <Navigate to="/hr-login" />;
  }

  // Show loading state
  if (isLoading || initializingDB) {
    console.log("HRDashboard: Auth is loading or initializing DB, showing spinner");
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
        <span className="ml-2 text-gray-500">
          {initializingDB ? "Initializing database..." : "Loading..."}
        </span>
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