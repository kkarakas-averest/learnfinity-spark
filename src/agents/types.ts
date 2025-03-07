/**
 * Type definitions for the Multi-Agent System
 */

import { RAGStatus, RAGStatusDetails } from "@/types/hr.types";

/**
 * Base configuration for all agents
 */
export interface AgentConfig {
  name: string;
  role: string;
  goal: string;
  backstory: string;
  allowDelegation?: boolean;
  verbose?: boolean;
}

/**
 * Base agent interface
 */
export interface Agent {
  config: AgentConfig;
  initialize: () => Promise<{ success: boolean; message?: string }>;
}

/**
 * RAG System Agent specific interface
 */
export interface RAGSystemAgent extends Agent {
  determineRAGStatus: (employeeData: any) => Promise<RAGStatusDetails>;
  determineRAGStatusBatch: (employeesData: any[]) => Promise<Map<string, RAGStatusDetails>>;
  explainStatus: (employeeId: string, status: RAGStatus) => Promise<string>;
}

/**
 * Personalization Agent specific interface
 */
export interface PersonalizationAgent extends Agent {
  generateLearningPath: (employeeProfile: any, courseLibrary: any) => Promise<any>;
  recommendNextSteps: (employeeId: string, currentProgress: any) => Promise<any[]>;
}

/**
 * Content Creator Agent specific interface
 */
export interface ContentCreatorAgent extends Agent {
  generateRemediationContent: (learningGap: string, learnerPreferences: any) => Promise<any>;
  adaptContent: (contentId: string, learnerData: any) => Promise<any>;
}

/**
 * Multi-Agent System interface
 */
export interface MultiAgentSystem {
  initialize: () => Promise<{ success: boolean; message?: string }>;
  getAgent: <T extends Agent>(agentType: string) => T | null;
  processTask: (taskType: string, data: any) => Promise<any>;
} 