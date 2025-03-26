
/**
 * HR and employee management related types
 */

// RAG Status types
export type RAGStatus = 'red' | 'amber' | 'green';

export interface RAGStatusDetails {
  status: RAGStatus;
  justification: string;
  updatedBy: string;
  lastUpdated: string;
  recommendedActions?: string[];
}

export interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'onboarding' | 'terminated';
  manager?: string;
  skills?: string[];
  certifications?: string[];
  ragStatus?: RAGStatus;
  learningPathId?: string;
  progress?: number; // 0-100%
  lastActivity?: string; // ISO date string
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headCount: number;
  manager?: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  responsibilities?: string[];
  requiredSkills?: string[];
}

export interface LearningPathAssignment {
  id: string;
  employeeId: string;
  learningPathId: string;
  assignedBy: string;
  assignedDate: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100%
}

export interface EmployeeIntervention {
  id: string;
  employeeId: string;
  createdBy: string;
  createdDate: string;
  reason: string;
  interventionType: 'course_reassignment' | 'mentor_assignment' | 'additional_resources' | 'meeting' | 'other';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  outcome?: string;
  followUpRequired: boolean;
}

export interface RAGStatusSummary {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  redCount: number;
  amberCount: number;
  greenCount: number;
  redPercentage: number;
  amberPercentage: number;
  greenPercentage: number;
}
