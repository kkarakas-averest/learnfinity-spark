/**
 * Crew Manager
 * 
 * Orchestrates the multi-agent system by managing agent instances,
 * coordinating communication, and task distribution.
 */

import { Agent, AgentConfig } from '../types';
import { BaseAgent } from './BaseAgent';
import { AnalyzerAgent } from '../roles/AnalyzerAgent';
import { EducatorAgent } from '../roles/EducatorAgent';
import { MonitorAgent } from '../roles/MonitorAgent';
import { IntegratorAgent } from '../roles/IntegratorAgent';

export interface CrewManagerConfig {
  name: string;
  description: string;
  goal: string;
  debug?: boolean;
}

export class CrewManager {
  private agents: Map<string, Agent> = new Map();
  private config: CrewManagerConfig;
  private initialized: boolean = false;
  private taskHistory: Array<{ taskId: string; agentId: string; status: string; }> = [];
  
  constructor(config: CrewManagerConfig) {
    this.config = {
      ...config,
      debug: config.debug ?? false
    };
  }
  
  /**
   * Register an agent with the manager
   */
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`);
    }
    
    this.agents.set(agent.id, agent);
    
    if (this.config.debug) {
      console.log(`Agent registered: ${agent.id} (${agent.config.name})`);
    }
  }
  
  /**
   * Get an agent by ID
   */
  getAgent<T extends Agent>(id: string): T | null {
    const agent = this.agents.get(id);
    return agent as T || null;
  }
  
  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Create and register a new agent of the specified role
   */
  createAgent(role: string, config?: Partial<AgentConfig>): Agent {
    let agent: BaseAgent;
    
    switch (role.toLowerCase()) {
      case 'analyzer':
        agent = new AnalyzerAgent(config);
        break;
        
      case 'educator':
        agent = new EducatorAgent(config);
        break;
        
      case 'monitor':
        agent = new MonitorAgent(config);
        break;
        
      case 'integrator':
        agent = new IntegratorAgent(config);
        break;
        
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }
    
    this.registerAgent(agent as unknown as Agent);
    return agent as unknown as Agent;
  }
  
  /**
   * Initialize the crew manager and all registered agents
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    if (this.initialized) {
      return { success: true, message: 'Crew Manager is already initialized.' };
    }
    
    try {
      // Initialize all registered agents
      const initPromises = Array.from(this.agents.values()).map(agent => agent.initialize());
      const results = await Promise.all(initPromises);
      
      // Check if all agents initialized successfully
      const failedInits = results.filter(r => !r.success);
      
      if (failedInits.length > 0) {
        const failMessages = failedInits.map(r => r.message).join('; ');
        return {
          success: false,
          message: `Some agents failed to initialize: ${failMessages}`
        };
      }
      
      this.initialized = true;
      
      if (this.config.debug) {
        console.log(`Crew Manager initialized with ${this.agents.size} agents.`);
      }
      
      return {
        success: true,
        message: `Crew Manager initialized with ${this.agents.size} agents.`
      };
    } catch (error) {
      console.error('Error initializing Crew Manager:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during initialization'
      };
    }
  }
  
  /**
   * Process a task using the appropriate agent
   */
  async processTask(task: any): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const { agentId, type, data } = task;
    
    if (!agentId) {
      throw new Error('Task must specify an agentId');
    }
    
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      // Record task start
      this.taskHistory.push({
        taskId,
        agentId,
        status: 'started'
      });
      
      if (this.config.debug) {
        console.log(`Task ${taskId} started for agent ${agentId}`);
      }
      
      // Process the task
      const result = await agent.processTask({
        type,
        data
      });
      
      // Record task completion
      this.taskHistory = this.taskHistory.map(t => 
        t.taskId === taskId ? { ...t, status: 'completed' } : t
      );
      
      if (this.config.debug) {
        console.log(`Task ${taskId} completed for agent ${agentId}`);
      }
      
      return result;
    } catch (error) {
      // Record task failure
      this.taskHistory = this.taskHistory.map(t => 
        t.taskId === taskId ? { ...t, status: 'failed' } : t
      );
      
      console.error(`Error processing task ${taskId} for agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Send a message from one agent to another
   */
  async sendMessage(fromAgentId: string, toAgentId: string, content: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const fromAgent = this.getAgent(fromAgentId);
    const toAgent = this.getAgent(toAgentId);
    
    if (!fromAgent) {
      throw new Error(`Sender agent with ID ${fromAgentId} not found`);
    }
    
    if (!toAgent) {
      throw new Error(`Recipient agent with ID ${toAgentId} not found`);
    }
    
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const message = {
      id: messageId,
      from: fromAgentId,
      to: toAgentId,
      content,
      timestamp: new Date()
    };
    
    if (this.config.debug) {
      console.log(`Message ${messageId} sent from ${fromAgentId} to ${toAgentId}`);
    }
    
    // Send the message and receive response
    const response = await toAgent.receiveMessage(message);
    
    if (this.config.debug && response) {
      console.log(`Response received from ${toAgentId} to message ${messageId}`);
    }
    
    return response;
  }
  
  /**
   * Initialize the standard RAG agent crew with default configuration
   */
  static createStandardCrew(debug: boolean = false): CrewManager {
    const manager = new CrewManager({
      name: 'RAG System Crew',
      description: 'Multi-Agent System for managing employee learning progress',
      goal: 'Effectively monitor and improve employee learning progress',
      debug
    });
    
    // Create standard agents with typecasting to match interfaces
    const analyzer = new AnalyzerAgent({
      name: 'Pattern Analyzer',
      goal: 'Identify learning patterns and determine appropriate RAG status'
    });
    
    const educator = new EducatorAgent({
      name: 'Learning Path Designer',
      goal: 'Create and adjust learning content based on employee needs'
    });
    
    const monitor = new MonitorAgent({
      name: 'Progress Monitor',
      goal: 'Track employee progress and generate alerts for significant changes'
    });
    
    const integrator = new IntegratorAgent({
      name: 'System Integrator',
      goal: 'Connect agent insights with external systems and UI'
    });
    
    // Register agents with type assertions to work around the interface mismatch
    manager.registerAgent(analyzer as unknown as Agent);
    manager.registerAgent(educator as unknown as Agent);
    manager.registerAgent(monitor as unknown as Agent);
    manager.registerAgent(integrator as unknown as Agent);
    
    return manager;
  }
  
  /**
   * Get task history
   */
  getTaskHistory(): Array<{ taskId: string; agentId: string; status: string; }> {
    return [...this.taskHistory];
  }
}
