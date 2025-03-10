/**
 * Base configuration for all agents
 */
export interface AgentConfig {
  id?: string;  // Optional since it can be auto-generated
  name: string;
  role: string;
  goal?: string;
  backstory?: string;
  verbose?: boolean;
  model?: string;
  temperature?: number;
}

/**
 * Base Agent interface that all specialized agents must implement
 */
export interface Agent {
  id: string;
  name: string;
  role: string;
  
  /**
   * Initialize the agent
   */
  initialize(): Promise<void>;
  
  /**
   * Process a task assigned to this agent
   * @param task The task to process
   */
  processTask(task: any): Promise<any>;
  
  /**
   * Receive a message from another agent
   * @param message The message received
   * @param from The agent who sent the message
   */
  receiveMessage(message: any, from?: string): Promise<any>;
  
  /**
   * Get the current status of the agent
   */
  getStatus(): Promise<{
    status: 'idle' | 'busy' | 'error';
    currentTask?: string;
    lastActivity?: Date;
  }>;
} 