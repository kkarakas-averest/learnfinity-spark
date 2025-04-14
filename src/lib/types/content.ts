
// Add or update the content type definitions
export interface AICourseContent {
  id: string;
  title: string;
  description: string;
  course_id: string;
  is_active: boolean;
  created_for_user_id?: string;
  employee_id?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  learning_objectives?: string[];
  metadata?: Record<string, any>;
  personalization_context?: Record<string, any>;
  personalization_params?: Record<string, any>;
  content?: Record<string, any>;
}

export interface AICourseContentSection {
  id: string;
  title: string;
  content: string;
  content_id: string;
  module_id: string;
  section_id: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface PersonalizationParams {
  userId: string;
  employeeId?: string;
  learningStyle?: string;
  skillLevel?: string;
  role?: string;
  department?: string;
  interests?: string[];
  priorExperience?: string;
  moduleCount?: number;
  sectionsPerModule?: number;
}
