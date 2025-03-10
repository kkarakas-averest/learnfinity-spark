/**
 * Manager Agent Interface
 * 
 * The Manager Agent serves as the central coordinator for the multi-agent system,
 * orchestrating tasks and communication between specialized agents.
 */

import { Agent, AgentMessage } from '../types';
import { ContentCreatorAgent } from '../types';
import { RAGSystemAgent } from '../types';

/**
 * Agent registry map for storing references to registered agents
 */
export type AgentRegistry = Map<string, Agent>;

/**
 * Task execution status
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Task execution result
 */
export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Task definition for agent execution
 */
export interface AgentTask {
  id: string;
  type: string;
  targetAgent: string;
  priority: 'low' | 'medium' | 'high';
  data: any;
  dependencies?: string[]; // IDs of tasks that must complete before this one
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  result?: TaskResult;
}

/**
 * Manager Agent interface extending the base Agent interface
 */
export interface ManagerAgent extends Agent {
  /**
   * Register an agent with the manager
   */
  registerAgent: (agent: Agent) => Promise<boolean>;
  
  /**
   * Unregister an agent from the manager
   */
  unregisterAgent: (agentId: string) => Promise<boolean>;
  
  /**
   * Get a registered agent by ID or type
   */
  getAgent: <T extends Agent>(idOrType: string) => Promise<T | null>;
  
  /**
   * Submit a task for execution
   */
  submitTask: (task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  
  /**
   * Get task status by ID
   */
  getTaskStatus: (taskId: string) => Promise<TaskStatus>;
  
  /**
   * Get task result by ID
   */
  getTaskResult: (taskId: string) => Promise<TaskResult | null>;
  
  /**
   * Execute a workflow involving multiple agents
   */
  executeWorkflow: (
    workflowName: string, 
    initialData: any, 
    config?: Record<string, any>
  ) => Promise<TaskResult>;
  
  /**
   * Monitor the health and status of all registered agents
   */
  monitorAgentHealth: () => Promise<Record<string, boolean>>;
  
  /**
   * Handle agent communication by routing messages
   */
  routeMessage: (message: AgentMessage) => Promise<void>;
} 