
import type { BaseAgentConfig } from '@/types/agent.types';

export class BaseAgent {
  protected name: string;
  protected role: string;
  protected goal: string;
  protected backstory: string;

  constructor(config: BaseAgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.goal = config.goal;
    this.backstory = config.backstory;
  }

  // Update the return type signature to match the agent interface
  protected async initialize(): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  }

  protected log(...args: any[]): void {
    console.log(`[${this.name}]`, ...args);
  }

  protected error(...args: any[]): void {
    console.error(`[${this.name} ERROR]`, ...args);
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.name} ERROR] ${message}`, error);
  }
} 
