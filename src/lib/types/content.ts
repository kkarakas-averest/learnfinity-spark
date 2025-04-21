/**
 * Types for AI generated and personalized course content
 */

/**
 * AI Course Content representing a personalized version of a course
 */
export interface AICourseContent {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  created_for_user_id?: string;
  employee_id?: string;
  learning_objectives?: any[];
  personalization_context?: {
    [key: string]: any;
  };
  personalization_params?: {
    [key: string]: any;
  };
  metadata?: {
    [key: string]: any;
  };
  is_active?: boolean;
  version?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Section of AI Course Content
 */
export interface AICourseContentSection {
  id: string;
  content_id: string;
  title: string;
  content: string;
  module_id: string;
  section_id: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  case_study?: string;
  actionable_takeaway?: string;
  quiz?: {
    question: string;
    answer: string;
  };
}

/**
 * Quiz question in AI Course Content
 */
export interface AICourseQuizQuestion {
  id: string;
  content_id: string;
  module_id: string;
  question: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  difficulty?: string;
  created_at?: string;
}
