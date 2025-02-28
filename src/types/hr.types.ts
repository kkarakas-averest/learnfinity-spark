/**
 * HR Module Types
 * 
 * This file contains all type definitions related to the HR module
 */

// HR User Type
export interface HRUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Employee Type
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  courses: number;
  coursesCompleted: number;
  progress: number;
  lastActivity: string;
  status: string;
}

// Course Type
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  skillLevel: string;
  enrolledCount: number;
  completionRate: number;
  duration: string;
  isAIGenerated: boolean;
  lastUpdate: string;
  rating: number;
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

// Key Metric Type for Dashboard
export interface KeyMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any; // Using any for icon component type
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
  icon: any; // Using any for icon component type
}

// HR Authentication context
export interface HRAuthContext {
  currentUser: HRUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<HRUser>;
  logout: () => void;
} 