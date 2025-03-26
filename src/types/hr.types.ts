/**
 * HR and employee management related types
 */

// RAG Status types
export type RAGStatus = 'red' | 'amber' | 'green';

export interface RAGStatusDetails {
  status: RAGStatus;
  rag_status_reason: string;
  rag_status_updated_by: string;
  rag_status_updated_at: string;
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
  department_id?: string;
  position_id?: string;
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

export type HRDashboardTab = 'overview' | 'employees' | 'courses' | 'reports' | 'analytics' | 'agents';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate?: string;
  status: 'active' | 'inactive' | 'onboarding' | 'terminated';
  manager?: string;
  skills?: string[];
  certifications?: string[];
  ragStatus?: RAGStatus;
  progress?: number;
  lastActivity?: string;
  department_id?: string;
  position_id?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  targetAudience: string;
  skillLevel: string;
  topics: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  objectives: string[];
  prerequisites?: string[];
  modules: Array<{
    id: string;
    title: string;
    description: string;
    duration: string;
    content: any[];
    assessments: any[];
  }>;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  author: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  skills: string[];
  experience: {
    years: number;
    level: string;
    previousRoles?: string[];
  };
  learningPreferences: {
    preferredLearningStyle?: string;
    preferredContentTypes?: string[];
    learningGoals?: string[];
  };
}

export interface EmployeeOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  temporaryPassword: string;
  skills?: string[];
  experience?: {
    years: number;
    level: 'junior' | 'mid' | 'senior';
    previousRoles?: string[];
  };
  learningPreferences?: {
    preferredLearningStyle?: string;
    preferredContentTypes?: string[];
    learningGoals?: string[];
  };
}

export interface LearningStatistics {
  total_employees: number;
  active_paths: number;
  avg_progress: number;
  at_risk_count: number;
  recent_completions: number;
  completion_rate: number;
  engagement_rate: number;
}

export interface EmployeeProgress {
  user_id: string;
  name: string;
  email: string;
  department: string;
  active_paths: number;
  avg_progress: number;
  rag_status: 'red' | 'amber' | 'green';
  recent_activity: string;
  last_active: string;
}
