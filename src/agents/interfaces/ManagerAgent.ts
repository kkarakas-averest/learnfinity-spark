/**
 * Manager Agent Interface
 * 
 * The Manager Agent serves as the central coordinator for the multi-agent system,
 * orchestrating tasks and communication between specialized agents.
 */

import { Agent } from './Agent';

/**
 * Message type for agent communication
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent registry map for storing references to registered agents
 */
export type AgentRegistry = Map<string, Agent>;

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Result of a completed task
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
 * Represents a task that can be assigned to an agent
 */
export interface AgentTask {
  id: string;
  name: string;
  type: string;
  targetAgent?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  data: any;
  result?: any;
  error?: string;
  dependencies?: string[]; // IDs of tasks that must complete before this one
}

/**
 * Interface for manager agent that coordinates other agents
 */
export interface IManagerAgent extends Agent {
  /**
   * Register an agent with the manager
   * @param agent The agent to register
   */
  registerAgent(agent: Agent): Promise<void>;
  
  /**
   * Unregister an agent from the manager
   * @param agentId The ID of the agent to unregister
   */
  unregisterAgent(agentId: string): Promise<void>;
  
  /**
   * Get a registered agent by ID
   * @param agentId The ID of the agent to retrieve
   */
  getAgent(agentId: string): Promise<Agent | null>;
  
  /**
   * Submit a task for processing
   * @param task The task to process
   */
  submitTask(task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string>;
  
  /**
   * Get the status of a task
   * @param taskId The ID of the task
   */
  getTaskStatus(taskId: string): Promise<'pending' | 'in_progress' | 'completed' | 'failed'>;
  
  /**
   * Get the result of a completed task
   * @param taskId The ID of the task
   */
  getTaskResult(taskId: string): Promise<any>;
  
  /**
   * Execute a predefined workflow
   * @param workflowName The name of the workflow to execute
   * @param data The data to pass to the workflow
   */
  executeWorkflow(workflowName: string, data: any): Promise<string>;
  
  /**
   * Check the health of all registered agents
   */
  monitorAgentHealth(): Promise<Record<string, { status: 'healthy' | 'warning' | 'error'; lastActive?: Date }>>;
  
  /**
   * Route a message to the appropriate agent
   * @param message The message to route
   * @param from The sender of the message
   * @param to The intended recipient of the message
   */
  routeMessage(message: any, from: string, to: string): Promise<any>;
} 