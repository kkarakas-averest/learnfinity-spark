import { Employee, RAGStatus } from './hr.types';

/**
 * Enhanced employee profile type definitions to support personalized learning
 */

// Learning style preferences
export type LearningStylePreference = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

// Learning time preferences
export type LearningTimePreference = 'morning' | 'afternoon' | 'evening' | 'weekend' | 'flexible';

// Device preferences
export type DevicePreference = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'multiple';

// Content format preferences
export type ContentFormatPreference = 'video' | 'article' | 'interactive' | 'simulation' | 'quiz' | 'discussion';

// Skill proficiency level
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Skill item with proficiency
export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  isRequired: boolean;
  lastAssessed?: string;
}

// Career goal
export interface CareerGoal {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
  requiredSkills: string[]; // Skill IDs
}

// Course completion record
export interface CourseCompletion {
  courseId: string;
  courseName: string;
  completionDate: string;
  score?: number;
  feedbackProvided: boolean;
  certificateUrl?: string;
}

// Learning activity record
export interface LearningActivity {
  id: string;
  type: 'course_progress' | 'assessment' | 'resource_access' | 'forum_activity' | 'exercise_completion';
  timestamp: string;
  details: {
    resourceId?: string;
    resourceName?: string;
    duration?: number; // in minutes
    progress?: number; // percentage
    score?: number;
    comments?: string;
  };
}

// Intervention record
export interface InterventionRecord {
  id: string;
  date: string;
  type: 'content_adjustment' | 'remedial_assignment' | 'mentor_session' | 'feedback_session';
  initiatedBy: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  outcome?: string;
  ragStatusBefore?: RAGStatus;
  ragStatusAfter?: RAGStatus;
}

// Learning preferences
export interface LearningPreferences {
  learningStyle: LearningStylePreference;
  preferredTimes: LearningTimePreference[];
  preferredDevice: DevicePreference;
  preferredContentFormats: ContentFormatPreference[];
  preferredLanguages: string[];
  averageSessionDuration: number; // in minutes
  prefersDifficulty: 'easy' | 'moderate' | 'challenging' | 'mixed';
  prefersCollaboration: boolean;
  prefersDeadlines: boolean;
  additionalPreferences?: string;
}

// Add these interfaces
export interface LearningPathCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  matchScore: number;
  ragStatus: RAGStatus;
  progress: number;
  sections: number;
  completedSections: number;
  skills: string[];
  requiredForCertification: boolean;
}

export interface LearningPath {
  courses: LearningPathCourse[];
  updatedAt: string;
}

export interface AgentActivity {
  type: 'recommendation' | 'alert' | 'update';
  description: string;
  agent: string;
  timestamp: string;
}

// Complete enhanced employee profile
export interface EnhancedEmployeeProfile extends Employee {
  // Basic profile extensions
  profilePictureUrl?: string;
  phoneNumber?: string;
  startDate: string;
  manager?: string;
  bio?: string;
  
  // Learning preferences
  learningPreferences: LearningPreferences;
  
  // Skills inventory
  skills: Skill[];
  
  // Career development
  careerGoals: CareerGoal[];
  
  // Learning history
  completedCourses: CourseCompletion[];
  learningActivities: LearningActivity[];
  
  // Intervention history
  interventions: InterventionRecord[];
  
  // Feedback data
  contentFeedback: {
    preferredTopics: string[];
    dislikedTopics: string[];
    averageRating: number;
    feedbackHistory: {
      contentId: string;
      contentType: string;
      rating: number;
      comments?: string;
      date: string;
    }[];
  };
  
  // Add the new properties for AI-driven learning
  learningPath?: LearningPath;
  agentActivity?: AgentActivity[];
}

// For creating/updating profiles
export type EmployeeProfileInput = Omit<EnhancedEmployeeProfile, 'id' | 'ragStatus'>; 