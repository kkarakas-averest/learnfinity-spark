
/**
 * Base Agent Implementation
 * 
 * Provides core functionality for all agent types, including
 * initialization, logging, and message handling.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentConfig } from '../interfaces/Agent';

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
 * Base implementation of the Agent interface that provides common functionality
 * for all agent types
 */
export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  role: string;
  protected config: AgentConfig;
  protected verbose: boolean;
  protected initialized: boolean = false;

  constructor(config: AgentConfig) {
    this.id = config.id || `agent-${uuidv4()}`;
    this.name = config.name;
    this.role = config.role;
    this.config = config;
    this.verbose = config.verbose || false;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    this.initialized = true;
    if (this.verbose) {
      this.log(`${this.name} initialized`);
    }
    return { success: true };
  }

  /**
   * Process a task assigned to this agent
   * This method should be implemented by the concrete agent classes
   */
  abstract processTask(task: any): Promise<any>;

  /**
   * Receive a message from another agent
   * This method should be implemented by the concrete agent classes
   */
  abstract receiveMessage(message: any, from?: string): Promise<any>;

  /**
   * Get the current status of the agent
   */
  async getStatus(): Promise<{
    status: 'idle' | 'busy' | 'error';
    currentTask?: string;
    lastActivity?: Date;
  }> {
    return {
      status: 'idle',
      lastActivity: new Date()
    };
  }

  /**
   * Ensure the agent is initialized before performing operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Agent ${this.id} (${this.name}) is not initialized`);
    }
  }

  /**
   * Protected method for logging messages
   */
  protected log(message: string): void {
    if (this.verbose) {
      console.log(`[${new Date().toISOString()}] [${this.name}] ${message}`);
    }
  }

  /**
   * Protected method for logging errors
   */
  protected logError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error(`[${new Date().toISOString()}] [${this.name}] ERROR: ${errorMessage}`);
    
    if (error instanceof Error && error.stack && this.verbose) {
      console.error(error.stack);
    }
  }

  /**
   * Create a response message
   */
  protected createResponseMessage(to: string, content: any, metadata?: Record<string, any>): AgentMessage {
    return {
      id: uuidv4(),
      from: this.id,
      to,
      content,
      timestamp: new Date(),
      metadata
    };
  }

  /**
   * Send a message to another agent
   */
  protected async sendMessage(to: string, content: any, metadata?: Record<string, any>): Promise<AgentMessage> {
    // In a real implementation, this would use a message bus or other communication mechanism
    // For now, we'll just log the message
    this.log(`Sending message to ${to}: ${JSON.stringify(content).substring(0, 100)}...`);
    return this.createResponseMessage(to, content, metadata);
  }
}
