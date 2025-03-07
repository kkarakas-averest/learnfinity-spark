import React from "@/lib/react-helpers";
import { Navigate, useNavigate } from "react-router-dom";
import { useHRAuth, useUI } from "@/state";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// Import the services for database initialization
import { hrServices } from '@/lib/services/hrServices';
// Import the agent system hook
import { useAgentSystem } from '@/hooks/useAgentSystem';
// Import the header component
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';

const HRDashboardMigrated: React.FC = () => {
  const { hrUser, isAuthenticated, isLoading, logout } = useHRAuth();
  const { toastSuccess, toastError } = useUI();
  const navigate = useNavigate();
  // Add state for database initialization
  const [initializingDB, setInitializingDB] = React.useState(false);
  // Add a ref to track if initialization has been completed
  const hasInitializedRef = React.useRef(false);
  
  // Initialize the agent system
  const { 
    isInitialized: isAgentSystemInitialized, 
    isInitializing: isAgentSystemInitializing,
    initError: agentSystemError,
    initialize: initializeAgentSystem
  } = useAgentSystem({ 
    autoInitialize: false, // We'll initialize manually after DB is ready
    debug: process.env.NODE_ENV === 'development'
  });

  console.log("HRDashboard - Current state:", { 
    hrUser, 
    isAuthenticated, 
    isLoading,
    isAgentSystemInitialized,
    isAgentSystemInitializing 
  });

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

          // Now that the database is ready, initialize the agent system
          try {
            await initializeAgentSystem();
            if (agentSystemError) {
              console.error('Failed to initialize agent system:', agentSystemError);
              toastError({
                title: "Agent System Error",
                description: "Failed to initialize AI agents. Some advanced features may not be available."
              });
            } else {
              console.log('Agent system initialized successfully');
            }
          } catch (initError) {
            console.error('Exception during agent system initialization:', initError);
            toastError({
              title: "Agent System Initialization Failed",
              description: "Could not initialize the AI system. Some features will be unavailable."
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
  }, [
    isAuthenticated, 
    initializingDB, 
    toastSuccess, 
    toastError, 
    initializeAgentSystem, 
    agentSystemError
  ]);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    console.log("HRDashboard: Not authenticated, redirecting to HR login");
    return <Navigate to="/hr-login" />;
  }

  // Show loading state
  if (isLoading || initializingDB || isAgentSystemInitializing) {
    const loadingMessage = 
      isAgentSystemInitializing ? "Initializing AI agents..." :
      initializingDB ? "Initializing database..." : 
      "Loading...";
      
    console.log(`HRDashboard: ${loadingMessage}`);
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="xl" />
        <span className="ml-2 text-gray-500">{loadingMessage}</span>
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
    <div className="min-h-screen bg-gray-50">
      <HRDashboardHeader 
        username={hrUser?.username || "HR Admin"} 
        onLogout={handleLogout} 
      />
      
      <div className="container pt-8 pb-12 mx-auto px-4">
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
        
        {!isAgentSystemInitialized && agentSystemError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mt-4">
            <h3 className="font-medium">AI Assistant Limited</h3>
            <p className="text-sm">
              The AI agent system could not be initialized. Basic functionality will work, 
              but advanced features like automated RAG status analysis may be limited.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboardMigrated; 