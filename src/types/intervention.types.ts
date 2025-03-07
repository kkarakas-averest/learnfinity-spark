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
export type InterventionType = 
  | 'content_modification' 
  | 'resource_assignment' 
  | 'schedule_adjustment' 
  | 'mentor_assignment'
  | 'feedback_request';

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
  type: InterventionType;
  reasonForUse: string;
  contentTemplate?: string;
  resourceIds?: string[];
} 