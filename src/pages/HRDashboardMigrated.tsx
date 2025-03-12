import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { useHRAuth, useUI } from "@/state";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// Import the services for database initialization
import { hrServices } from '@/services/hrServices';
// Import the agent system hook
import { useAgentSystem } from '@/hooks/useAgentSystem';
// Import the DashboardOverview component
import DashboardOverview from '@/components/hr/DashboardOverview';

/**
 * HR Dashboard Index Page
 * Shows overview cards and stats for quick navigation
 */
const HRDashboardMigrated: React.FC = () => {
  const { isAuthenticated, isLoading } = useHRAuth();
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
    debug: import.meta.env.MODE === 'development'
  });
  
  // Handle database initialization
  const initializeDatabase = React.useCallback(async () => {
    if (hasInitializedRef.current || initializingDB) return;
    
    setInitializingDB(true);
    try {
      // Check if tables exist
      const result = await hrServices.checkRequiredTables();
      
      if (result.missingTables.length > 0) {
        console.warn('Missing HR tables:', result.missingTables);
        toastError(`Missing tables: ${result.missingTables.join(', ')}. Please contact support.`);
      } else {
        toastSuccess('HR Dashboard ready');
        // Initialize the agent system after DB is ready
        if (!isAgentSystemInitialized && !isAgentSystemInitializing) {
          initializeAgentSystem();
        }
      }
      
      hasInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize HR database:', error);
      toastError('Failed to initialize HR dashboard. Please try again later.');
    } finally {
      setInitializingDB(false);
    }
  }, [initializingDB, toastSuccess, toastError, isAgentSystemInitialized, isAgentSystemInitializing, initializeAgentSystem]);
  
  // Initialize on component mount if authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('HR user authenticated, initializing dashboard...');
      initializeDatabase();
    }
  }, [isAuthenticated, isLoading, initializeDatabase]);
  
  // Redirect to login if not authenticated and not loading
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to HR login...');
      navigate('/hr-login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Loading state
  if (isLoading || initializingDB) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <h2 className="mt-4 text-xl font-semibold">
            {initializingDB ? 'Initializing HR Dashboard...' : 'Loading...'}
          </h2>
        </div>
      </div>
    );
  }
  
  // Return the DashboardOverview component instead of null
  return <DashboardOverview />;
};

export default HRDashboardMigrated; 