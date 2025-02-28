import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { 
  BaseAgent, 
  AgentStatus, 
  AgentTask, 
  AgentEvent,
  AgentContext 
} from '../interfaces/BaseAgent';
import { AgentEventBus } from '../AgentEventBus';

/**
 * Types of tasks the Manager Agent can handle
 */
export enum ManagerTaskType {
  INITIALIZE_AGENTS = 'initialize_agents',
  COORDINATE_LEARNING_PATH = 'coordinate_learning_path',
  HANDLE_RAG_ALERT = 'handle_rag_alert',
  GENERATE_REPORTS = 'generate_reports',
}

/**
 * Manager Agent coordinates the activities of all other agents
 */
export class ManagerAgent implements BaseAgent {
  public id: string;
  public type: string = 'manager';
  public status: AgentStatus = 'idle';
  
  private agents: Map<string, BaseAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private context: AgentContext = {};
  private unsubscribeFunctions: Array<() => void> = [];
  
  /**
   * Create a new instance of the Manager Agent
   */
  constructor(id: string = uuidv4()) {
    this.id = id;
  }
  
  /**
   * Initialize the Manager Agent
   */
  public async initialize(config?: Record<string, any>): Promise<void> {
    console.info('Initializing Manager Agent:', this.id);
    this.status = 'running';
    
    // Store context information
    if (config) {
      this.context = { 
        ...this.context,
        ...config
      };
    }
    
    // Subscribe to relevant events
    this.subscribeToEvents();
    
    // Register the manager agent in the database
    try {
      const { error } = await supabase
        .from('ai_agents')
        .upsert({
          id: this.id,
          name: 'Manager Agent',
          description: 'Coordinates all agent activities',
          last_active: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Error registering manager agent:', error);
      }
    } catch (error) {
      console.warn('Could not register manager agent, table might not exist:', error);
    }
    
    // Publish initialization event
    await AgentEventBus.publish({
      source: this.id,
      type: 'manager.initialized',
      data: {
        managerId: this.id,
      },
    });
  }
  
  /**
   * Subscribe to events the Manager Agent needs to handle
   */
  private subscribeToEvents(): void {
    // Subscribe to RAG alerts
    const ragUnsubscribe = AgentEventBus.subscribe(
      'rag.status_changed',
      async (event: AgentEvent) => {
        if (event.data.status === 'red' || event.data.status === 'amber') {
          // Create task to handle RAG alert
          const task: AgentTask = {
            id: uuidv4(),
            type: ManagerTaskType.HANDLE_RAG_ALERT,
            status: 'idle',
            startTime: new Date(),
            data: {
              learnerId: event.data.learnerId,
              moduleId: event.data.moduleId,
              status: event.data.status,
              details: event.data.details,
            },
          };
          
          await this.executeTask(task);
        }
      }
    );
    
    // Subscribe to learning path requests
    const pathUnsubscribe = AgentEventBus.subscribe(
      'learner.profile_completed',
      async (event: AgentEvent) => {
        // Create task to coordinate learning path creation
        const task: AgentTask = {
          id: uuidv4(),
          type: ManagerTaskType.COORDINATE_LEARNING_PATH,
          status: 'idle',
          startTime: new Date(),
          data: {
            learnerId: event.data.learnerId,
            preferences: event.data.preferences,
          },
        };
        
        await this.executeTask(task);
      }
    );
    
    // Store unsubscribe functions for cleanup
    this.unsubscribeFunctions.push(ragUnsubscribe, pathUnsubscribe);
  }
  
  /**
   * Register another agent with the Manager
   */
  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    
    // Log agent registration
    console.info(`Agent registered with Manager: ${agent.type} (${agent.id})`);
  }
  
  /**
   * Handle events from other components
   */
  public async handleEvent(event: AgentEvent): Promise<void> {
    console.info(`Manager Agent handling event: ${event.type}`, event);
    
    // Handle different event types
    switch (event.type) {
      case 'system.shutdown':
        await this.shutdown();
        break;
        
      case 'task.create':
        // Create a new task based on the event data
        if (event.data.taskType) {
          const task: AgentTask = {
            id: event.data.taskId || uuidv4(),
            type: event.data.taskType,
            status: 'idle',
            startTime: new Date(),
            data: event.data.taskData || {},
          };
          
          await this.executeTask(task);
        }
        break;
        
      default:
        // Forward event to appropriate agent if target is specified
        if (event.target && this.agents.has(event.target)) {
          await this.agents.get(event.target)?.handleEvent(event);
        }
    }
  }
  
  /**
   * Execute a task based on its type
   */
  public async executeTask(task: AgentTask): Promise<AgentTask> {
    console.info(`Manager Agent executing task: ${task.type}`, task);
    
    // Update task status
    task.status = 'running';
    this.tasks.set(task.id, task);
    
    try {
      switch (task.type) {
        case ManagerTaskType.INITIALIZE_AGENTS:
          await this.initializeAgents(task);
          break;
          
        case ManagerTaskType.COORDINATE_LEARNING_PATH:
          await this.coordinateLearningPath(task);
          break;
          
        case ManagerTaskType.HANDLE_RAG_ALERT:
          await this.handleRagAlert(task);
          break;
          
        case ManagerTaskType.GENERATE_REPORTS:
          await this.generateReports(task);
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Mark task as completed
      task.status = 'completed';
      task.endTime = new Date();
      
    } catch (error) {
      console.error(`Error executing task ${task.type}:`, error);
      
      // Mark task as failed
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error instanceof Error ? error.message : String(error);
    }
    
    // Update task in storage
    this.tasks.set(task.id, task);
    
    // Publish task completion event
    await AgentEventBus.publish({
      source: this.id,
      type: 'task.completed',
      data: {
        taskId: task.id,
        taskType: task.type,
        status: task.status,
        result: task.result,
        error: task.error,
      },
    });
    
    return task;
  }
  
  /**
   * Initialize all other agents
   */
  private async initializeAgents(task: AgentTask): Promise<void> {
    // This is where you would create and initialize all other agents
    // For MVP we'll start with just the most critical agents
    
    // Publish event for personalizer agent to initialize
    await AgentEventBus.publish({
      source: this.id,
      type: 'agent.initialize',
      data: {
        agentType: 'personalization',
        context: this.context,
      },
    });
    
    // Publish event for content creator agent to initialize
    await AgentEventBus.publish({
      source: this.id,
      type: 'agent.initialize',
      data: {
        agentType: 'content',
        context: this.context,
      },
    });
    
    // Publish event for RAG agent to initialize
    await AgentEventBus.publish({
      source: this.id,
      type: 'agent.initialize',
      data: {
        agentType: 'rag',
        context: this.context,
      },
    });
    
    // Set task result
    task.result = {
      status: 'Initialization events published for all agents',
    };
  }
  
  /**
   * Coordinate the creation of a personalized learning path
   */
  private async coordinateLearningPath(task: AgentTask): Promise<void> {
    const { learnerId, preferences } = task.data;
    
    if (!learnerId) {
      throw new Error('Missing learnerId in learning path task');
    }
    
    // Publish event for personalization agent to create path
    await AgentEventBus.publish({
      source: this.id,
      type: 'personalization.create_path',
      data: {
        learnerId,
        preferences,
        requestId: task.id,
      },
    });
    
    // For MVP, we'll consider this task complete once we delegate to the personalization agent
    // In a more complete implementation, we'd wait for a response before completing
    
    task.result = {
      status: 'Learning path creation delegated to personalization agent',
      learnerId,
    };
  }
  
  /**
   * Handle a RAG status alert by coordinating agent responses
   */
  private async handleRagAlert(task: AgentTask): Promise<void> {
    const { learnerId, moduleId, status, details } = task.data;
    
    if (!learnerId || !moduleId || !status) {
      throw new Error('Missing required data in RAG alert task');
    }
    
    // For red status, coordinate multiple agent responses
    if (status === 'red') {
      // Ask content agent to generate remedial content
      await AgentEventBus.publish({
        source: this.id,
        type: 'content.generate_remedial',
        data: {
          learnerId,
          moduleId,
          details,
          requestId: task.id,
        },
      });
      
      // Ask feedback agent to gather more information
      await AgentEventBus.publish({
        source: this.id,
        type: 'feedback.gather',
        data: {
          learnerId,
          moduleId,
          requestId: task.id,
        },
      });
    } 
    // For amber status, just ask content agent for extra resources
    else if (status === 'amber') {
      await AgentEventBus.publish({
        source: this.id,
        type: 'content.suggest_resources',
        data: {
          learnerId,
          moduleId,
          details,
          requestId: task.id,
        },
      });
    }
    
    task.result = {
      status: `Handled ${status} RAG alert for learner ${learnerId} on module ${moduleId}`,
      interventions: status === 'red' ? ['remedial_content', 'feedback'] : ['suggested_resources'],
    };
  }
  
  /**
   * Generate reports by coordinating with reporting agent
   */
  private async generateReports(task: AgentTask): Promise<void> {
    const { companyId, reportType, filters } = task.data;
    
    // Delegate to reporting agent
    await AgentEventBus.publish({
      source: this.id,
      type: 'reporting.generate',
      data: {
        companyId,
        reportType,
        filters,
        requestId: task.id,
      },
    });
    
    task.result = {
      status: 'Report generation delegated to reporting agent',
      reportType,
      companyId,
    };
  }
  
  /**
   * Get the current status of the agent
   */
  public getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Clean up and shut down the agent
   */
  public async shutdown(): Promise<void> {
    console.info('Shutting down Manager Agent:', this.id);
    
    // Unsubscribe from all events
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    
    // Update status
    this.status = 'idle';
    
    // Update last active timestamp
    try {
      await supabase
        .from('ai_agents')
        .update({ last_active: new Date().toISOString() })
        .eq('id', this.id);
    } catch (error) {
      console.warn('Could not update last active time:', error);
    }
  }
} 