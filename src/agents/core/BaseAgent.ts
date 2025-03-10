/**
 * Base Agent Implementation
 * 
 * Provides core functionality for all agent types, including
 * initialization, logging, and message handling.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentConfig, AgentMessage as AgentMessageType } from '../types';

// Re-export the AgentMessage type
export type AgentMessage = AgentMessageType;

/**
 * Base implementation for all agent types
 */
export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private initialized: boolean = false;
  private verbose: boolean;
  
  /**
   * Initialize the agent with configuration
   */
  constructor(config: AgentConfig) {
    this.id = uuidv4();
    this.config = {
      ...config,
      verbose: config.verbose !== undefined ? config.verbose : false
    };
    this.verbose = this.config.verbose;
  }
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    // Basic initialization
    this.initialized = true;
    
    return { success: true };
  }
  
  /**
   * Process a task assigned to this agent
   */
  abstract processTask(task: any): Promise<any>;
  
  /**
   * Receive and process a message from another agent
   */
  abstract receiveMessage(message: AgentMessage): Promise<AgentMessage | null>;
  
  /**
   * Ensure the agent is initialized before performing operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Agent ${this.id} (${this.config.name}) is not initialized`);
    }
  }
  
  /**
   * Log a message with agent context
   */
  protected log(message: string, ...args: any[]): void {
    if (this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${this.config.name}] ${message}`, ...args);
    }
  }
  
  /**
   * Log an error with agent context
   */
  protected logError(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.config.name}] ERROR: ${message}`, error || '');
  }
  
  /**
   * Generate a response message to the sender
   */
  protected createResponseMessage(
    originalMessage: AgentMessage,
    content: string,
    metadata?: Record<string, any>
  ): AgentMessage {
    return {
      id: uuidv4(),
      from: this.id,
      to: originalMessage.from,
      content,
      timestamp: new Date(),
      metadata
    };
  }
  
  /**
   * Send a message to another agent through the manager
   * This is a placeholder method that should be overridden by specific agents that implement direct messaging
   */
  protected async sendMessage(
    toAgentId: string, 
    content: string, 
    metadata?: Record<string, any>
  ): Promise<AgentMessage | null> {
    // This base implementation simply logs the message
    this.log(`STUB: Would send message to ${toAgentId}: ${content}`);
    
    // Actual implementations should route through a manager agent or message bus
    return null;
  }
} 