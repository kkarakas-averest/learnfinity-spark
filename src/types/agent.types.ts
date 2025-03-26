/**
 * Agent system related types
 */

import type { EmployeeProfile, LearningPath } from './hr.types';

export interface BaseAgent {
  name: string;
  role: string;
  goal: string;
  backstory: string;
}

export interface PersonalizationAgent extends BaseAgent {
  createEmployeeProfile(data: {
    id: string;
    name: string;
    role: string;
    department: string;
    skills: string[];
    experience?: string;
    learningPreferences?: Record<string, any>;
  }): Promise<any>;
  
  generateLearningPath(profile: any): Promise<any>;
  
  suggestIntervention(
    employeeId: string,
    ragStatus: 'green' | 'amber' | 'red',
    learningHistory: any
  ): Promise<{
    type: 'high_priority' | 'medium_priority' | 'low_priority' | 'unknown';
    actions: Array<{
      type: string;
      description: string;
      details?: string;
      resources?: any[];
    }>;
    message: string;
  }>;
}

export interface ContentCreationAgent extends BaseAgent {
  createInitialContent(profile: any, learningPath: any): Promise<void>;
  adaptContent(options: {
    currentContent: any;
    progress: any;
    ragStatus: 'green' | 'amber' | 'red';
  }): Promise<any>;
} 