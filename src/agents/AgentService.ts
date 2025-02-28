import { v4 as uuidv4 } from 'uuid';
import { ManagerAgent } from './manager/ManagerAgent';
import { PersonalizationAgent } from './personalization/PersonalizationAgent';
import { RAGAgent } from './rag/RAGAgent';
import { AgentEventBus } from './AgentEventBus';
import { BaseAgent, AgentTask } from './interfaces/BaseAgent';

/**
 * AgentService manages initialization and access to all agents
 */
export class AgentService {
  private static instance: AgentService;
  private initialized = false;
  private managerAgent: ManagerAgent | null = null;
  private agents: Map<string, BaseAgent> = new Map();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }
  
  /**
   * Initialize the agent system
   */
  public async initialize(userId?: string, companyId?: string): Promise<void> {
    if (this.initialized) {
      console.info('Agent system already initialized');
      return;
    }
    
    console.info('Initializing Agent System');
    
    try {
      // Initialize event bus first
      await AgentEventBus.initialize();
      
      // Create Manager Agent
      const manager = new ManagerAgent();
      await manager.initialize({
        userId,
        companyId,
      });
      
      // Store manager agent
      this.managerAgent = manager;
      this.agents.set(manager.id, manager);
      
      // Initialize other agents
      const personalizationAgent = new PersonalizationAgent();
      const ragAgent = new RAGAgent();
      
      // Register all agents with the manager
      manager.registerAgent(personalizationAgent);
      manager.registerAgent(ragAgent);
      
      // Store all agents in the map for access
      this.agents.set(personalizationAgent.id, personalizationAgent);
      this.agents.set(ragAgent.id, ragAgent);
      
      // Create a task to initialize all other agents
      const task: AgentTask = {
        id: uuidv4(),
        type: 'initialize_agents',
        status: 'idle',
        startTime: new Date(),
        data: {
          userId,
          companyId,
        },
      };
      
      // Execute the initialization task
      await manager.executeTask(task);
      
      this.initialized = true;
      console.info('Agent System initialized successfully');
    } catch (error) {
      console.error('Error initializing Agent System:', error);
      throw error;
    }
  }
  
  /**
   * Check if the agent system is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the manager agent
   */
  public getManagerAgent(): ManagerAgent | null {
    return this.managerAgent;
  }
  
  /**
   * Get an agent by ID
   */
  public getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }
  
  /**
   * Get all agents
   */
  public getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Execute a task through the manager agent
   */
  public async executeTask(task: Omit<AgentTask, 'id' | 'startTime' | 'status'>): Promise<AgentTask> {
    if (!this.initialized || !this.managerAgent) {
      throw new Error('Agent System not initialized');
    }
    
    const fullTask: AgentTask = {
      id: uuidv4(),
      status: 'idle',
      startTime: new Date(),
      ...task,
    };
    
    return this.managerAgent.executeTask(fullTask);
  }
  
  /**
   * Shutdown the agent system
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    console.info('Shutting down Agent System');
    
    // Shut down all agents
    for (const agent of this.agents.values()) {
      if ('shutdown' in agent && typeof agent.shutdown === 'function') {
        await agent.shutdown();
      }
    }
    
    this.initialized = false;
    console.info('Agent System shut down successfully');
  }
} 