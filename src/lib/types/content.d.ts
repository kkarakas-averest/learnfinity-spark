/**
 * Types for the AI content personalization system
 */

import { Json } from "@/integrations/supabase/types";

/**
 * AI-generated course content record in the database
 */
export interface AICourseContent {
  id: string;
  course_id: string;
  version: string;
  created_for_user_id: string;
  metadata: any;
  personalization_context: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * AI-generated course section record in the database
 */
export interface AICourseContentSection {
  id: string;
  content_id: string;
  module_id: string;
  section_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * AI-generated quiz question record in the database
 */
export interface AICourseQuizQuestion {
  id: string;
  content_id: string;
  module_id: string;
  question: string;
  options: string[] | any;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  created_at: string;
}

/**
 * Learner profile for content personalization
 */
export interface LearnerProfile {
  id: string;
  user_id: string;
  preferences: Json;
  career_goals?: string;
  prior_experience?: string;
  completed_onboarding?: boolean;
  department?: string;
  title?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Learner preferences for content personalization
 */
export interface LearnerPreferences {
  preferred_learning_style?: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'multimodal';
  preferred_content_types?: ('text' | 'video' | 'interactive' | 'quiz')[];
  learning_goals?: string[];
  interests?: string[];
  pace?: 'slow' | 'moderate' | 'fast';
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Content personalization request parameters
 */
export interface ContentPersonalizationParams {
  userId: string;
  courseId: string;
  learningStyle?: string;
  roleContext?: string;
  departmentContext?: string;
  interestAreas?: string[];
  difficultyLevel?: string;
  priorKnowledge?: any;
  includedTopics?: string[];
  excludedTopics?: string[];
}

/**
 * Personalization context stored with generated content
 */
export interface PersonalizationContext {
  userProfile: {
    role: string;
    department?: string;
    preferences: any;
  };
  courseContext: {
    title: string;
    level: string;
    learningObjectives: string[];
  };
  employeeContext?: {
    hire_date?: string;
    department?: string;
    position?: string;
  } | null;
} 