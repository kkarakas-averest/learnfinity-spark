/**
 * Manager Agent Implementation
 * 
 * This agent acts as the central coordinator for the multi-agent system,
 * managing task routing, agent registration, and workflow execution.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { Agent, AgentConfig } from '../types';
import { 
  ManagerAgent as IManagerAgent,
  AgentRegistry,
  AgentTask,
  TaskStatus,
  TaskResult
} from '../interfaces/ManagerAgent';
import { isFeatureEnabled } from '@/lib/env-config';

/**
 * Definition of a workflow that can be executed by the manager agent
 */
interface WorkflowDefinition {
  name: string;
  description: string;
  steps: Array<{
    id: string;
    description: string;
    targetAgent: string;
    taskType: string;
    dataMapper?: (data: any, previousResults?: Record<string, any>) => any;
    dependencies?: string[];
  }>;
  options?: Record<string, any>;
}

/**
 * Manager Agent implementation
 */
export class ManagerAgent extends BaseAgent implements IManagerAgent {
  private agentRegistry: AgentRegistry = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  
  /**
   * Register predefined workflows
   */
  private registerPredefinedWorkflows(): void {
    // Implementation will go here
  }

  /**
   * Execute a specific task by ID
   */
  private async executeTask(taskId: string): Promise<void> {
    // Implementation will go here
  }

  /**
   * Wait for multiple tasks to complete
   */
  private async waitForTasks(taskIds: string[]): Promise<void> {
    // Implementation will go here
  }

  /**
   * Handle agent registration messages
   */
  private async handleRegistrationMessage(message: AgentMessage): Promise<void> {
    // Implementation will go here
  }

  /**
   * Handle task result messages
   */
  private async handleTaskResultMessage(message: AgentMessage): Promise<void> {
    // Implementation will go here
  }

  /**
   * Handle agent status update messages
   */
  private async handleStatusUpdateMessage(message: AgentMessage): Promise<void> {
    // Implementation will go here
  }
  
  /**
   * Initialize the Manager Agent with default config
   */
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Manager Agent",
      role: "System Coordinator",
      goal: "Coordinate agent interactions and task execution",
      backstory: "You manage and coordinate all other AI agents, ensuring efficient system operation.",
      ...config
    });
    
    // Register predefined workflows
    this.registerPredefinedWorkflows();
  }
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    try {
      await super.initialize();
      
      // TODO: Load any persisted agent registrations
      
      this.log(`${this.config.name} initialized, ready to coordinate agents`);
      return { success: true };
    } catch (error) {
      this.logError(`Error initializing ${this.config.name}:`, error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : "Unknown error initializing manager agent" 
      };
    }
  }
  
  /**
   * Process messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    try {
      // Route the message to the appropriate handler based on content/metadata
      if (message.metadata?.type === 'registration') {
        // Agent registration request
        await this.handleRegistrationMessage(message);
      } else if (message.metadata?.type === 'task_result') {
        // Task result message
        await this.handleTaskResultMessage(message);
      } else if (message.metadata?.type === 'status_update') {
        // Agent status update
        await this.handleStatusUpdateMessage(message);
      } else {
        // General message routing
        await this.routeMessage(message);
      }
      
      // Acknowledge receipt
      return {
        id: uuidv4(),
        from: this.id,
        to: message.from,
        content: `Message processed: ${message.id}`,
        timestamp: new Date(),
        metadata: {
          type: 'acknowledgment',
          originalMessageId: message.id
        }
      };
    } catch (error) {
      this.logError(`Error processing message ${message.id}:`, error);
      
      // Return error response
      return {
        id: uuidv4(),
        from: this.id,
        to: message.from,
        content: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: {
          type: 'error',
          originalMessageId: message.id
        }
      };
    }
  }
  
  /**
   * Process tasks assigned to the manager agent
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'register_agent':
        return this.registerAgent(task.data.agent);
        
      case 'unregister_agent':
        return this.unregisterAgent(task.data.agentId);
        
      case 'execute_workflow':
        return this.executeWorkflow(
          task.data.workflowName, 
          task.data.initialData, 
          task.data.config
        );
        
      case 'monitor_health':
        return this.monitorAgentHealth();
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Register an agent with the manager
   */
  async registerAgent(agent: Agent): Promise<boolean> {
    this.ensureInitialized();
    
    if (!agent.id) {
      throw new Error("Agent must have an ID to be registered");
    }
    
    // Check if agent is already registered
    if (this.agentRegistry.has(agent.id)) {
      this.log(`Agent ${agent.id} is already registered`);
      return false;
    }
    
    // Register the agent
    this.agentRegistry.set(agent.id, agent);
    this.log(`Agent registered: ${agent.id} (${agent.config.name})`);
    
    return true;
  }
  
  /**
   * Unregister an agent from the manager
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    this.ensureInitialized();
    
    if (!this.agentRegistry.has(agentId)) {
      this.log(`Agent ${agentId} is not registered`);
      return false;
    }
    
    // Unregister the agent
    this.agentRegistry.delete(agentId);
    this.log(`Agent unregistered: ${agentId}`);
    
    return true;
  }
  
  /**
   * Get a registered agent by ID or type
   */
  async getAgent<T extends Agent>(idOrType: string): Promise<T | null> {
    this.ensureInitialized();
    
    // Check if we have an exact ID match
    if (this.agentRegistry.has(idOrType)) {
      return this.agentRegistry.get(idOrType) as T;
    }
    
    // If not, look for an agent by type/role
    for (const agent of this.agentRegistry.values()) {
      const role = agent.config.role.toLowerCase();
      
      if (
        role.includes(idOrType.toLowerCase()) || 
        agent.config.name.toLowerCase().includes(idOrType.toLowerCase())
      ) {
        return agent as T;
      }
    }
    
    return null;
  }
  
  /**
   * Submit a task for execution
   */
  async submitTask(taskData: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.ensureInitialized();
    
    // Create a new task with generated ID
    const taskId = uuidv4();
    const now = new Date();
    
    const task: AgentTask = {
      id: taskId,
      status: TaskStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      ...taskData
    };
    
    // Store the task
    this.tasks.set(taskId, task);
    this.log(`Task submitted: ${taskId} (${task.type}) for agent ${task.targetAgent}`);
    
    // Process the task if no dependencies or all dependencies are complete
    if (!task.dependencies || task.dependencies.length === 0) {
      this.executeTask(taskId).catch(error => {
        this.logError(`Error executing task ${taskId}:`, error);
      });
    } else {
      // Check if all dependencies are complete
      const allDependenciesComplete = task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === TaskStatus.COMPLETED;
      });
      
      if (allDependenciesComplete) {
        this.executeTask(taskId).catch(error => {
          this.logError(`Error executing task ${taskId}:`, error);
        });
      } else {
        this.log(`Task ${taskId} waiting for dependencies to complete`);
      }
    }
    
    return taskId;
  }
  
  /**
   * Get task status by ID
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    this.ensureInitialized();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    return task.status;
  }
  
  /**
   * Get task result by ID
   */
  async getTaskResult(taskId: string): Promise<TaskResult | null> {
    this.ensureInitialized();
    
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    return task.result || null;
  }
  
  /**
   * Execute a workflow involving multiple agents
   */
  async executeWorkflow(
    workflowName: string, 
    initialData: any,
    config?: Record<string, any>
  ): Promise<TaskResult> {
    this.ensureInitialized();
    
    // Get the workflow definition
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }
    
    this.log(`Executing workflow: ${workflowName}`);
    
    const workflowId = uuidv4();
    const taskResults: Record<string, any> = {};
    
    try {
      // Create tasks for each workflow step
      for (const step of workflow.steps) {
        // Map input data if needed
        const taskData = step.dataMapper 
          ? step.dataMapper(initialData, taskResults)
          : initialData;
        
        // Determine dependencies
        const dependencies = step.dependencies || [];
        
        // Submit the task
        const taskId = await this.submitTask({
          type: step.taskType,
          targetAgent: step.targetAgent,
          priority: 'medium',
          data: taskData,
          dependencies
        });
        
        // Store task ID for dependency tracking
        taskResults[step.id] = { taskId };
      }
      
      // Wait for all tasks to complete
      const allTaskIds = Object.values(taskResults).map(result => result.taskId);
      await this.waitForTasks(allTaskIds);
      
      // Collect all results
      for (const [stepId, result] of Object.entries(taskResults)) {
        const taskResult = await this.getTaskResult(result.taskId);
        if (taskResult) {
          taskResults[stepId] = taskResult;
        }
      }
      
      // Return the final result
      return {
        taskId: workflowId,
        status: TaskStatus.COMPLETED,
        result: taskResults,
        timestamp: new Date()
      };
    } catch (error) {
      this.logError(`Error executing workflow ${workflowName}:`, error);
      
      return {
        taskId: workflowId,
        status: TaskStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Monitor the health and status of all registered agents
   */
  async monitorAgentHealth(): Promise<Record<string, boolean>> {
    this.ensureInitialized();
    
    const results: Record<string, boolean> = {};
    
    for (const [agentId, agent] of this.agentRegistry.entries()) {
      try {
        // Send a ping message to check if agent is responsive
        const message: AgentMessage = {
          id: uuidv4(),
          from: this.id,
          to: agentId,
          content: "health_check",
          timestamp: new Date(),
          metadata: {
            type: 'health_check'
          }
        };
        
        // Wait for response with timeout
        const response = await Promise.race([
          agent.receiveMessage(message),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 5000); // 5-second timeout
          })
        ]);
        
        // Agent is healthy if we got a response
        results[agentId] = response !== null;
      } catch (error) {
        this.logError(`Error checking health for agent ${agentId}:`, error);
        results[agentId] = false;
      }
    }
    
    return results;
  }
  
  /**
   * Handle agent communication by routing messages
   */
  async routeMessage(message: AgentMessage): Promise<void> {
    this.ensureInitialized();
    
    const targetAgent = await this.getAgent(message.to);
    if (!targetAgent) {
      throw new Error(`Target agent ${message.to} not found`);
    }
    
    // Route the message to the target agent
    await targetAgent.receiveMessage(message);
  }
}