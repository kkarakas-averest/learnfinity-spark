/**
 * HR Intervention Type Definitions
 */
import { RAGStatus } from './hr.types';

// Types of interventions
export type InterventionType = 
  | 'content_modification'   // Modifying learning content
  | 'resource_assignment'    // Assigning additional resources
  | 'schedule_adjustment'    // Adjusting learning schedule
  | 'mentor_assignment'      // Assigning a mentor for guidance
  | 'feedback_request'       // Requesting specific feedback
  | 'custom';                // Custom intervention type

// Status of an intervention
export type InterventionStatus = 
  | 'pending'      // Intervention created but not yet applied
  | 'active'       // Intervention is currently active
  | 'completed'    // Intervention has been completed
  | 'cancelled';   // Intervention was cancelled

// Reason for intervention
export type InterventionReason = 
  | 'rag_status_change'      // Changes in RAG status
  | 'progress_slowdown'      // Slowed progress
  | 'low_engagement'         // Low engagement with content
  | 'poor_performance'       // Poor performance in assessments
  | 'employee_request'       // Requested by employee
  | 'periodic_review'        // Part of regular review
  | 'custom';                // Custom reason

// Basic intervention structure
export interface Intervention {
  id: string;
  employeeId: string;
  type: InterventionType;
  status: InterventionStatus;
  reason: InterventionReason;
  createdAt: string;
  createdBy: string;        // ID of HR user who created it
  ragStatusAtCreation: RAGStatus;
  title: string;
  description: string;
  dueDate?: string;         // Optional due date
  completedAt?: string;     // Date when intervention was completed
  updatedAt: string;
  contentModifications?: ContentModification[];
  resourceAssignments?: ResourceAssignment[];
  scheduleAdjustment?: ScheduleAdjustment;
  mentorAssignment?: MentorAssignment;
  feedbackRequest?: FeedbackRequest;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Input for creating a new intervention
export type InterventionInput = Omit<Intervention, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

// Content modification details
export interface ContentModification {
  contentId: string;
  contentType: 'module' | 'quiz' | 'video' | 'document' | 'other';
  originalContent?: string;
  modifiedContent: string;
  reason: string;
}

// Resource assignment details
export interface ResourceAssignment {
  resourceId: string;
  resourceType: 'document' | 'video' | 'course' | 'quiz' | 'other';
  resourceName: string;
  resourceUrl: string;
  reason: string;
  dueDate?: string;
  isRequired: boolean;
}

// Schedule adjustment details
export interface ScheduleAdjustment {
  originalDueDate?: string;
  newDueDate: string;
  affectedContentIds: string[];
  reason: string;
}

// Mentor assignment details
export interface MentorAssignment {
  mentorId: string;
  mentorName: string;
  sessionCount: number;
  startDate: string;
  endDate?: string;
  focusAreas: string[];
  notes?: string;
}

// Feedback request details
export interface FeedbackRequest {
  questions: string[];
  dueDate: string;
  isAnonymous: boolean;
  feedbackType: 'course' | 'content' | 'experience' | 'progress' | 'other';
  targetContentIds?: string[];
}

// Intervention template for quick creation
export interface InterventionTemplate {
  id: string;
  name: string;
  description: string;
  type: InterventionType;
  reasonsForUse: InterventionReason[];
  contentTemplate: string;
  requiredResourceIds?: string[];
  suggestedMentorIds?: string[];
  feedbackQuestions?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
} 