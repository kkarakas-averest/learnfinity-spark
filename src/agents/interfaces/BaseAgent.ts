
import { User } from '@supabase/supabase-js';

/**
 * Status of an agent operation
 */
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

/**
 * Base interface for all agent operations/tasks
 */
export interface AgentTask {
  id: string;
  type: string;
  status: AgentStatus;
  startTime: Date;
  endTime?: Date;
  data: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
}

/**
 * Base interface that all agents must implement
 */
export interface BaseAgent {
  /**
   * Unique identifier for this agent instance
   */
  id: string;
  
  /**
   * The type of agent (e.g., "manager", "personalization", etc.)
   */
  type: string;
  
  /**
   * Current status of the agent
   */
  status: AgentStatus;
  
  /**
   * Initialize the agent with configuration
   */
  initialize(config?: Record<string, any>): Promise<{ success: boolean; message?: string }>;
  
  /**
   * Execute a task appropriate for this agent
   */
  executeTask(task: AgentTask): Promise<AgentTask>;
  
  /**
   * Handle events from other agents
   */
  handleEvent(event: AgentEvent): Promise<void>;
  
  /**
   * Get the current status of this agent
   */
  getStatus(): AgentStatus;
}

/**
 * Interface for events passed between agents
 */
export interface AgentEvent {
  id: string;
  source: string; // ID of the source agent
  target?: string; // ID of the target agent (if any)
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * Context object that contains information about the current environment
 */
export interface AgentContext {
  user?: User;
  userId?: string;
  companyId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
} 
