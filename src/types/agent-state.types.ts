/**
 * Agent State Persistence Types
 * Defines data structures for tracking and persisting agent states and decisions
 */

/**
 * Types of agents in the system
 */
export enum AgentType {
  MANAGER = 'manager',
  PERSONALIZATION = 'personalization',
  CONTENT_CREATOR = 'content_creator',
  FEEDBACK_ADAPTATION = 'feedback_adaptation',
  RAG_SYSTEM = 'rag_system',
  REPORTING = 'reporting'
}

/**
 * Decision types that can be made by agents
 */
export enum AgentDecisionType {
  // Path related decisions
  PATH_CREATION = 'path_creation',
  PATH_ADJUSTMENT = 'path_adjustment',
  CONTENT_RECOMMENDATION = 'content_recommendation',
  
  // RAG related decisions  
  STATUS_CHANGE = 'status_change',
  INTERVENTION_RECOMMENDATION = 'intervention_recommendation',
  
  // Content related decisions
  CONTENT_CREATION = 'content_creation',
  CONTENT_ADAPTATION = 'content_adaptation',
  ASSESSMENT_GENERATION = 'assessment_generation',
  
  // General decisions
  AGENT_DELEGATION = 'agent_delegation',
  METRIC_TRACKING = 'metric_tracking',
  ALERT_GENERATION = 'alert_generation'
}

/**
 * Reason categories for agent decisions
 */
export enum DecisionReasonCategory {
  PERFORMANCE_BASED = 'performance_based',
  PREFERENCE_BASED = 'preference_based',
  TIME_BASED = 'time_based',
  ENGAGEMENT_BASED = 'engagement_based',
  CONTENT_BASED = 'content_based',
  SKILL_BASED = 'skill_based',
  GOAL_BASED = 'goal_based',
  SYSTEM_DIRECTIVE = 'system_directive'
}

/**
 * Context provided to an agent for decision making
 */
export interface AgentContext {
  employeeId?: string;
  courseId?: string;
  timestamp: Date;
  ragStatus?: 'green' | 'amber' | 'red';
  primaryData: Record<string, any>; // Main data for the decision
  secondaryData?: Record<string, any>; // Supporting data
  previousDecisions?: AgentDecisionRecord[];
  systemDirectives?: string[];
}

/**
 * Record of a decision made by an agent
 */
export interface AgentDecisionRecord {
  id: string;
  agentType: AgentType;
  decisionType: AgentDecisionType;
  timestamp: Date;
  context: AgentContext;
  decision: {
    action: string;
    parameters: Record<string, any>;
  };
  reasoning: {
    mainReason: string;
    reasonCategory: DecisionReasonCategory;
    confidenceScore: number; // 0-1 scale
    alternativesConsidered?: string[];
  };
  outcome?: {
    successful: boolean;
    resultingAction?: string;
    feedback?: string;
  };
  metadata: {
    processingTime: number; // in milliseconds
    tokensUsed?: number;
    modelVersion?: string;
  };
}

/**
 * Agent memory for maintaining state between operations
 */
export interface AgentMemory {
  id: string;
  agentType: AgentType;
  employeeId?: string;
  memoryType: 'short_term' | 'long_term';
  key: string;
  value: any;
  priority: number; // 1-10 scale, higher is more important
  expiresAt?: Date; // For short-term memories
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Performance metrics for an agent
 */
export interface AgentMetrics {
  agentType: AgentType;
  timeRange: {
    start: Date;
    end: Date;
  };
  invocations: number;
  averageProcessingTime: number; // in milliseconds
  tokensConsumed: number;
  successRate: number; // 0-1 scale
  decisionDistribution: Record<AgentDecisionType, number>;
  totalCost: number; // in USD
  errorRate: number; // 0-1 scale
  commonErrors: {
    type: string;
    count: number;
    lastOccurred: Date;
  }[];
}

/**
 * Agent state snapshot for debugging and monitoring
 */
export interface AgentStateSnapshot {
  agentType: AgentType;
  timestamp: Date;
  activeMemories: AgentMemory[];
  pendingDecisions: number;
  activeContexts: string[]; // IDs or descriptions of contexts in progress
  lastDecision?: AgentDecisionRecord;
  healthStatus: 'healthy' | 'degraded' | 'error';
  errorState?: {
    message: string;
    code: string;
    retryCount: number;
  };
  metricsSnapshot: Partial<AgentMetrics>;
} 