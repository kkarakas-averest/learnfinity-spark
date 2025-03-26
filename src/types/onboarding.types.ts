import type { Employee } from './hr.types';

export interface EmployeeOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  experience?: string;
  skills?: string[];
  learningPreferences?: {
    preferredLearningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
    preferredContentTypes?: string[];
    preferredSessionDuration?: number; // in minutes
  };
  temporaryPassword: string;
}

export interface OnboardingResult {
  success: boolean;
  employeeId?: string;
  error?: string;
}

export interface BulkOnboardingResult {
  success: boolean;
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}

export interface WelcomeEmailData {
  firstName: string;
  credentials: {
    email: string;
    temporaryPassword: string;
  };
  learningPath: {
    title: string;
    description: string;
    estimatedDuration: string;
  };
} 