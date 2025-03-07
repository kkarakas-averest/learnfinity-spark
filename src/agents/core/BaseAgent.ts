/**
 * Base Agent Class
 * 
 * This is the foundation for all agents in the system.
 * It provides common functionality and interfaces that specific agent types will extend.
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentConfig } from '../types';

export interface AgentMemory {
  shortTerm: Map<string, any>;
  conversations: Array<{
    id: string;
    messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'agent';
      content: string;
      timestamp: Date;
    }>;
  }>;
  contextWindow: any[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export abstract class BaseAgent {
  id: string;
  config: AgentConfig;
  memory: AgentMemory;
  initialized: boolean = false;
  
  constructor(config: AgentConfig) {
    this.id = uuidv4();
    this.config = {
      ...config,
      verbose: config.verbose ?? false,
      allowDelegation: config.allowDelegation ?? true
    };
    
    // Initialize agent memory
    this.memory = {
      shortTerm: new Map(),
      conversations: [],
      contextWindow: []
    };
  }
  
  /**
   * Initialize the agent with any necessary setup
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    try {
      // Any additional setup can be added in subclass implementations
      if (this.config.verbose) {
        console.log(`Initializing ${this.config.name} (${this.id})...`);
      }
      
      this.initialized = true;
      return { success: true, message: `${this.config.name} initialized successfully` };
    } catch (error) {
      console.error(`Error initializing ${this.config.name}:`, error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : `Unknown error initializing ${this.config.name}`
      };
    }
  }
  
  /**
   * Send a message from this agent to another agent
   */
  async sendMessage(to: BaseAgent, content: string, metadata?: Record<string, any>): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: uuidv4(),
      from: this.id,
      to: to.id,
      content,
      metadata,
      timestamp: new Date()
    };
    
    if (this.config.verbose) {
      console.log(`[${this.config.name}] -> [${to.config.name}]: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    }
    
    // Record in conversation history
    this.recordMessage(message);
    
    return message;
  }
  
  /**
   * Receive a message from another agent
   */
  abstract receiveMessage(message: AgentMessage): Promise<AgentMessage | null>;
  
  /**
   * Process a task using the agent's capabilities
   */
  abstract processTask(task: any): Promise<any>;
  
  /**
   * Store information in the agent's short-term memory
   */
  remember(key: string, value: any): void {
    this.memory.shortTerm.set(key, value);
  }
  
  /**
   * Retrieve information from the agent's short-term memory
   */
  recall(key: string): any {
    return this.memory.shortTerm.get(key);
  }
  
  /**
   * Record a message in the conversation history
   */
  private recordMessage(message: AgentMessage): void {
    const isNewConversation = message.metadata?.newConversation === true;
    
    if (isNewConversation || this.memory.conversations.length === 0) {
      // Start a new conversation
      this.memory.conversations.push({
        id: uuidv4(),
        messages: [{
          role: message.from === this.id ? 'assistant' : 'user',
          content: message.content,
          timestamp: message.timestamp
        }]
      });
    } else {
      // Add to the most recent conversation
      const currentConversation = this.memory.conversations[this.memory.conversations.length - 1];
      currentConversation.messages.push({
        role: message.from === this.id ? 'assistant' : 'user',
        content: message.content,
        timestamp: message.timestamp
      });
    }
  }
  
  /**
   * Ensure the agent is initialized before performing operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Agent ${this.config.name} is not initialized. Call initialize() first.`);
    }
  }
  
  /**
   * Generate system prompt for the agent based on its configuration
   */
  protected generateSystemPrompt(): string {
    return `
      You are ${this.config.name}, a ${this.config.role}.
      
      Your goal is: ${this.config.goal}
      
      Backstory: ${this.config.backstory}
      
      Respond in a way that's consistent with your role.
    `.trim().replace(/\n\s+/g, '\n');
  }
} 