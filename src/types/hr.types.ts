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