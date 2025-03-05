import * as React from "react";
import { AgentService } from '@/agents/AgentService';
import { AgentTask } from '@/agents/interfaces/BaseAgent';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to access the Agent System
 */
export const useAgentSystem = () => {
  const { user, userDetails } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const agentService = AgentService.getInstance();
  
  /**
   * Initialize the agent system
   */
  const initializeAgents = async () => {
    if (agentService.isInitialized()) {
      setInitialized(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get user ID and company ID from auth context
      const userId = user?.id;
      const companyId = userDetails?.companyId || undefined;
      
      await agentService.initialize(userId, companyId);
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing agent system:', err);
      setError(err instanceof Error ? err.message : 'Unknown error initializing agents');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Execute a task using the agent system
   */
  const executeTask = async (task: Omit<AgentTask, 'id' | 'startTime' | 'status'>) => {
    if (!initialized) {
      throw new Error('Agent system not initialized');
    }
    
    return agentService.executeTask(task);
  };
  
  /**
   * Shutdown the agent system
   */
  const shutdownAgents = async () => {
    if (!initialized) {
      return;
    }
    
    try {
      await agentService.shutdown();
      setInitialized(false);
    } catch (err) {
      console.error('Error shutting down agent system:', err);
      throw err;
    }
  };
  
  // Initialize the agent system when the user is authenticated
  useEffect(() => {
    if (user && !initialized && !loading) {
      initializeAgents();
    }
    
    // Shutdown the agent system when the component unmounts
    return () => {
      // We don't want to shut down the agents when unmounting the component
      // as other components might still be using the agent system.
      // The agents will be shut down when the user logs out instead.
    };
  }, [user, initialized, loading]);
  
  // Listen for user logout to shutdown agents
  useEffect(() => {
    if (!user && initialized) {
      shutdownAgents();
    }
  }, [user, initialized]);
  
  return {
    initialized,
    loading,
    error,
    initializeAgents,
    executeTask,
    shutdownAgents,
    getManagerAgent: agentService.getManagerAgent.bind(agentService),
    getAllAgents: agentService.getAllAgents.bind(agentService),
    getAgent: agentService.getAgent.bind(agentService),
  };
}; 