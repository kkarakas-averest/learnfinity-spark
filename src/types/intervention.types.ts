/**
 * Intervention Types
 * 
 * This file contains all the type definitions for the HR intervention system.
 */

/**
 * Intervention Status
 */
export type InterventionStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * Intervention Type
 */
export enum InterventionType {
  // Content-based interventions
  ADDITIONAL_MATERIALS = 'additional_materials',
  SIMPLIFIED_CONTENT = 'simplified_content',
  ALTERNATIVE_FORMAT = 'alternative_format',
  PRACTICE_EXERCISES = 'practice_exercises',
  
  // Schedule-based interventions
  EXTENDED_DEADLINE = 'extended_deadline',
  ADJUSTED_PACE = 'adjusted_pace',
  LEARNING_BREAK = 'learning_break',
  
  // Support-based interventions
  MENTOR_ASSIGNMENT = 'mentor_assignment',
  PEER_GROUP = 'peer_group',
  HR_MEETING = 'hr_meeting',
  COACHING_SESSION = 'coaching_session',
  
  // Motivation-based interventions
  RECOGNITION = 'recognition',
  INCENTIVE = 'incentive',
  PROGRESS_HIGHLIGHT = 'progress_highlight'
}

/**
 * RAG Status
 */
export type RAGStatus = 'red' | 'amber' | 'green';

/**
 * Content Modification
 */
export interface ContentModification {
  contentId: string;
  contentType: string;
  originalContent: string;
  modifiedContent: string;
  reason: string;
}

/**
 * Resource Assignment
 */
export interface ResourceAssignment {
  resourceId: string;
  resourceType: string;
  resourceName: string;
  resourceUrl?: string;
  assignmentReason: string;
}

/**
 * Intervention
 */
export interface Intervention {
  id: string;
  title: string;
  description: string;
  type: InterventionType;
  status: InterventionStatus;
  employeeId: string;
  employeeName: string;
  ragStatusAtCreation: RAGStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  reason: string;
  contentModifications?: ContentModification[];
  resourceAssignments?: ResourceAssignment[];
  notes?: string;
}

/**
 * Intervention Input
 */
export interface InterventionInput {
  title: string;
  description: string;
  type: InterventionType;
  employeeId: string;
  reason: string;
  dueDate?: string;
  contentModifications?: ContentModification[];
  resourceAssignments?: ResourceAssignment[];
  notes?: string;
}

/**
 * Intervention Filter
 */
export interface InterventionFilter {
  status?: InterventionStatus;
  employeeId?: string;
  type?: InterventionType;
  createdBy?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Intervention Update
 */
export interface InterventionUpdate {
  title?: string;
  description?: string;
  status?: InterventionStatus;
  dueDate?: string;
  notes?: string;
  contentModifications?: ContentModification[];
  resourceAssignments?: ResourceAssignment[];
}

/**
 * Employee
 */
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  ragStatus: RAGStatus;
  lastAssessmentDate?: string;
}

/**
 * Intervention Template
 */
export interface InterventionTemplate {
  id: string;
  name: string;
  description: string;
  interventionType: InterventionType;
  defaultDuration: number; // in days
  contentTemplate?: string;
  targetRagStatus: 'amber' | 'red';
  suggestedFollowUp?: InterventionType[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Measures the effectiveness of an intervention
 */
export enum InterventionEffectivenessRating {
  HIGHLY_EFFECTIVE = 'highly_effective',
  EFFECTIVE = 'effective',
  NEUTRAL = 'neutral',
  INEFFECTIVE = 'ineffective',
  COUNTERPRODUCTIVE = 'counterproductive'
}

/**
 * Records the effectiveness of interventions for future reference
 */
export interface InterventionEffectiveness {
  id: string;
  interventionId: string;
  rating: InterventionEffectivenessRating;
  ragStatusBefore: 'amber' | 'red';
  ragStatusAfter: 'green' | 'amber' | 'red';
  timeToStatusChange?: number; // in days
  learnerFeedback?: string;
  hrNotes?: string;
  evaluatedAt: Date;
}

/**
 * Historical record of an intervention
 */
export interface InterventionHistoryRecord {
  interventionId: string;
  employeeId: string;
  employeeName: string;
  interventionType: InterventionType;
  startDate: Date;
  endDate?: Date;
  effectiveness?: InterventionEffectivenessRating;
  ragStatusChange: {
    before: 'amber' | 'red';
    after: 'green' | 'amber' | 'red';
  };
}

/**
 * Aggregated metrics about intervention effectiveness
 */
export interface InterventionMetrics {
  totalInterventions: number;
  byType: Record<InterventionType, number>;
  effectiveness: {
    highlyEffective: number;
    effective: number;
    neutral: number;
    ineffective: number;
    counterproductive: number;
  };
  averageDaysToImprovement: number;
  mostEffectiveType: InterventionType;
  leastEffectiveType: InterventionType;
} 