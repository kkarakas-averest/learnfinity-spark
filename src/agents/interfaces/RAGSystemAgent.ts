/**
 * RAG System Agent Interface
 * 
 * The RAG System Agent is responsible for tracking learner progress and determining 
 * their Red/Amber/Green status based on engagement and performance metrics.
 */

import { Agent } from '../types';
import { RAGStatus, RAGStatusDetails } from '@/types/hr.types';
import { LearnerProfile } from '../types';

/**
 * Extended RAG status details with recommendations
 */
export interface RAGStatusReport extends RAGStatusDetails {
  recommendations: {
    priority: 'low' | 'medium' | 'high';
    actions: string[];
    timeframe: 'immediate' | 'short-term' | 'long-term';
    assignedTo?: string;
  };
  followUpDate?: Date;
}

/**
 * Progress metrics for RAG status determination
 */
export interface ProgressMetrics {
  completionRate: number; // 0.0 to 1.0
  lastActivityDate?: Date;
  assessmentScores?: Record<string, number>; // moduleId -> score (0-100)
  engagementMetrics?: {
    averageSessionDuration?: number; // minutes
    sessionsPerWeek?: number;
    contentCompletionSpeed?: number; // relative to average
    interactionFrequency?: number; // clicks/actions per session
  };
  deadlinesMet?: number; // count of deadlines met
  deadlinesMissed?: number; // count of deadlines missed
}

/**
 * RAG Agent interface extending the base Agent interface
 */
export interface RAGSystemAgent extends Agent {
  /**
   * Determine the RAG status for a single learner
   */
  determineRAGStatus: (
    learnerProfile: LearnerProfile, 
    progressMetrics: ProgressMetrics
  ) => Promise<RAGStatusDetails>;
  
  /**
   * Determine RAG status for multiple learners in batch
   */
  determineRAGStatusBatch: (
    learnersData: Array<{
      profile: LearnerProfile;
      metrics: ProgressMetrics;
    }>
  ) => Promise<Map<string, RAGStatusDetails>>;
  
  /**
   * Generate an explanation of a learner's RAG status
   */
  explainStatus: (
    learnerId: string, 
    status: RAGStatus
  ) => Promise<string>;
  
  /**
   * Generate a detailed report with recommendations
   */
  generateStatusReport: (
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails,
    context?: any
  ) => Promise<RAGStatusReport>;
  
  /**
   * Identify learners that need immediate attention
   */
  identifyAtRiskLearners: (
    statuses: Map<string, RAGStatusDetails>,
    threshold?: 'red' | 'amber' | 'all'
  ) => Promise<string[]>;
  
  /**
   * Track changes in learner RAG status over time
   */
  trackStatusHistory: (
    learnerId: string,
    newStatus: RAGStatusDetails
  ) => Promise<RAGStatusDetails[]>;
  
  /**
   * Generate recommendations based on RAG status
   */
  generateRecommendations: (
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails
  ) => Promise<string[]>;
} 