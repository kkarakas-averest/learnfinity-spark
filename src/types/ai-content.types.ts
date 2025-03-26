
/**
 * Types for AI-generated content and personalization
 */

export type ContentType = 'text' | 'video' | 'quiz' | 'case_study' | 'interactive';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Represents a learner's profile for personalization
 */
export interface LearnerProfile {
  id: string;
  name: string;
  role?: string;
  department?: string;
  skillLevel?: DifficultyLevel;
  learningPreferences?: {
    contentTypes?: ContentType[];
    pace?: 'slow' | 'medium' | 'fast';
    visualLearner?: boolean;
    preferredTime?: string;
  };
  completedCourses?: string[];
  inProgressCourses?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  careerGoals?: string[];
}

/**
 * Parameters for content personalization
 */
export interface PersonalizationParams {
  learnerId: string;
  learnerProfile: LearnerProfile;
  contentId?: string;
  courseId?: string;
  moduleId?: string;
  difficultyLevel?: DifficultyLevel;
  topics?: string[];
  keywords?: string[];
  contentTypes?: ContentType[];
  length?: 'short' | 'medium' | 'long';
}

/**
 * Request for generating content
 */
export interface ContentGenerationRequest {
  contentType: ContentType;
  topic: string;
  targetAudience: {
    skillLevel: DifficultyLevel;
    role?: string;
    department?: string;
  };
  learningObjectives: string[];
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  includeCaseStudies?: boolean;
  includeExamples?: boolean;
  tonePreference?: 'formal' | 'conversational' | 'technical';
}

/**
 * Generated content response
 */
export interface GeneratedContent {
  id: string;
  contentType: ContentType;
  title: string;
  description?: string;
  content: string | Record<string, any>;
  metadata: {
    generatedAt: string;
    targetSkillLevel: DifficultyLevel;
    topics: string[];
    keywords: string[];
    estimatedDuration?: number; // in minutes
    agentId?: string;
  };
}

/**
 * Quiz specific generated content
 */
export interface GeneratedQuiz {
  id: string;
  title: string;
  description?: string;
  difficultyLevel: DifficultyLevel;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of the correct option
    explanation?: string;
    points: number;
  }>;
  passingScore: number;
  timeLimit?: number; // in minutes
  metadata: {
    generatedAt: string;
    topics: string[];
    estimatedDuration: number; // in minutes
  };
}
