import { UserRole } from '@/lib/database.types';

/**
 * HR Module Types
 * 
 * This file contains all type definitions related to the HR module
 */

// Basic user type for HR authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// RAG Status types
export type RAGStatus = 'green' | 'amber' | 'red';

export interface RAGStatusDetails {
  status: RAGStatus;
  justification: string;
  lastUpdated: string;
  updatedBy: string | 'system';
  recommendedActions?: string[];
}

// HR Dashboard types
export interface KeyMetric {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface QuickAction {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'completion' | 'achievement' | 'warning';
  user: string;
  course?: string;
  timestamp: string;
  description: string;
}

// Employee types
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position?: string;
  courses: number;
  coursesCompleted: number;
  progress: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'onboarding' | 'offboarding';
  
  // RAG status properties
  ragStatus: RAGStatus;
  ragDetails?: RAGStatusDetails;
  statusHistory?: RAGStatusDetails[];
}

// Intervention types
export interface Intervention {
  id: string;
  employeeId: string;
  type: 'content_modification' | 'remedial_assignment' | 'notification' | 'other';
  createdAt: string;
  createdBy: string;
  notes?: string;
  content?: string;
  status: 'pending' | 'delivered' | 'completed';
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  department: string;
  enrollments: number;
  completionRate: number;
  averageScore?: number;
  duration: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Department type
export interface Department {
  id: string;
  name: string;
  employeeCount: number;
  courseCount: number;
  averageCompletion: number;
}

// HRDashboard tab type
export type HRDashboardTab = 'overview' | 'employees' | 'courses' | 'reports';

// Legacy types kept for backward compatibility
export interface HRUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface HRAuthContext {
  currentUser: HRUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<HRUser>;
  logout: () => void;
}

// Learning Path Type
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[];
  enrolledCount: number;
  skillLevel: string;
  duration: string;
}

// Activity Type for Recent Activities
export interface Activity {
  type: 'enrollment' | 'completion' | 'feedback' | 'alert';
  user: string;
  course?: string;
  comment?: string;
  rating?: number;
  issue?: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Notification type
export interface Notification {
  id: string;
  recipientId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionLink?: string;
}

// Employee Progress tracking type for detailed monitoring
export interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  programName: string;
  currentStatus: RAGStatus;
  progress: number;
  lastActivityDate: string;
  upcomingDeadlines?: {
    title: string;
    date: string;
    completed: boolean;
  }[];
  notes?: string;
} 