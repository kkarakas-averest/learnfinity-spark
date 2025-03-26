/**
 * Agent system related types
 */

import type { EmployeeProfile, LearningPath } from './hr.types';

export interface BaseAgentConfig {
  name: string;
  role: string;
  goal: string;
  backstory: string;
}

export interface PersonalizationAgent {
  createEmployeeProfile(profile: EmployeeProfile): Promise<EmployeeProfile>;
  generateLearningPath(profile: EmployeeProfile): Promise<LearningPath>;
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

export interface ContentCreationAgent {
  createInitialContent(
    profile: EmployeeProfile,
    learningPath: LearningPath
  ): Promise<void>;
  
  adaptContent(
    profileId: string,
    contentId: string,
    performance: 'struggling' | 'on_track' | 'excelling',
    feedback?: string
  ): Promise<boolean>;
  
  createAssessments(
    moduleId: string,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced',
    topics: string[]
  ): Promise<any[]>;
} 