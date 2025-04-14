
/**
 * Interface for AI generated course content
 */
export interface AICourseContent {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  version: string;
  created_for_user_id?: string;
  learning_objectives?: string[];
  personalization_context?: any;
  personalization_params?: any;
  metadata?: any;
}

/**
 * Interface for AI generated course content sections
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
