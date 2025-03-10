/**
 * Type definitions for the Multi-Agent System
 * 
 * This file serves as a bridge between our agent system and external types.
 * It re-exports types from our interfaces directory and from external type files.
 */

import { Agent, AgentConfig } from './interfaces/Agent';
import { AgentMessage } from './core/BaseAgent';
import { 
  ContentType, 
  DifficultyLevel,
  LearnerProfile,
  ContentGenerationRequest,
  PersonalizationParams,
  GeneratedContent,
  GeneratedQuiz
} from '@/types/ai-content.types';
import { RAGStatus, RAGStatusDetails } from '@/types/hr.types';

// Re-export all types to ensure they are used consistently
export type { 
  Agent,
  AgentConfig,
  AgentMessage,
  ContentType,
  DifficultyLevel,
  LearnerProfile,
  ContentGenerationRequest,
  PersonalizationParams,
  GeneratedContent,
  GeneratedQuiz,
  RAGStatus,
  RAGStatusDetails
};

/**
 * ContentCreatorAgent specific interface
 */
export interface ContentCreatorAgent extends Agent {
  generateRemediationContent: (learningGap: string, learnerPreferences: any) => Promise<any>;
  adaptContent: (contentId: string, learnerData: any) => Promise<any>;
  generateContentForRequest: (request: ContentGenerationRequest) => Promise<GeneratedContent>;
  personalizeContent: (params: PersonalizationParams) => Promise<GeneratedContent>;
  generateQuiz: (topic: string, difficultyLevel: DifficultyLevel, questionCount: number) => Promise<GeneratedQuiz>;
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
 * Multi-Agent System interface
 */
export interface MultiAgentSystem {
  initialize: () => Promise<{ success: boolean; message?: string }>;
  getAgent: <T extends Agent>(agentType: string) => T | null;
  processTask: (taskType: string, data: any) => Promise<any>;
} 