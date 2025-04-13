export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_activities: {
        Row: {
          activity_type: string
          agent_name: string
          agent_type: string
          description: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          agent_name: string
          agent_type: string
          description: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          agent_name?: string
          agent_type?: string
          description?: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_config: {
        Row: {
          config: Json
          createdAt: string | null
          id: string
          name: string
          type: string
          updatedAt: string | null
        }
        Insert: {
          config: Json
          createdAt?: string | null
          id?: string
          name: string
          type: string
          updatedAt?: string | null
        }
        Update: {
          config?: Json
          createdAt?: string | null
          id?: string
          name?: string
          type?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      agent_decisions: {
        Row: {
          agent_id: string
          confidence: number | null
          context: Json
          created_at: string | null
          decision: Json
          decision_type: string
          execution_time: number | null
          id: string
          reasoning: string | null
        }
        Insert: {
          agent_id: string
          confidence?: number | null
          context: Json
          created_at?: string | null
          decision: Json
          decision_type: string
          execution_time?: number | null
          id?: string
          reasoning?: string | null
        }
        Update: {
          agent_id?: string
          confidence?: number | null
          context?: Json
          created_at?: string | null
          decision?: Json
          decision_type?: string
          execution_time?: number | null
          id?: string
          reasoning?: string | null
        }
        Relationships: []
      }
      agent_execution: {
        Row: {
          agentId: string
          createdAt: string | null
          executionTime: number
          id: string
          input: Json
          output: Json
          status: string
          tokenUsage: number
          userId: string | null
        }
        Insert: {
          agentId: string
          createdAt?: string | null
          executionTime: number
          id?: string
          input: Json
          output: Json
          status: string
          tokenUsage: number
          userId?: string | null
        }
        Update: {
          agentId?: string
          createdAt?: string | null
          executionTime?: number
          id?: string
          input?: Json
          output?: Json
          status?: string
          tokenUsage?: number
          userId?: string | null
        }
        Relationships: []
      }
      agent_knowledge_items: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          message_type: string
          processed: boolean | null
          processed_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          message_type: string
          processed?: boolean | null
          processed_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          message_type?: string
          processed?: boolean | null
          processed_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      agent_metrics: {
        Row: {
          agent_id: string
          average_response_time: number | null
          error_count: number | null
          last_error: Json | null
          last_updated: string | null
          metrics_by_task_type: Json | null
          requests_processed: number | null
          success_rate: number | null
        }
        Insert: {
          agent_id: string
          average_response_time?: number | null
          error_count?: number | null
          last_error?: Json | null
          last_updated?: string | null
          metrics_by_task_type?: Json | null
          requests_processed?: number | null
          success_rate?: number | null
        }
        Update: {
          agent_id?: string
          average_response_time?: number | null
          error_count?: number | null
          last_error?: Json | null
          last_updated?: string | null
          metrics_by_task_type?: Json | null
          requests_processed?: number | null
          success_rate?: number | null
        }
        Relationships: []
      }
      agent_states: {
        Row: {
          agent_id: string
          agent_type: string
          created_at: string | null
          id: string
          last_active: string | null
          memory: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          agent_type: string
          created_at?: string | null
          id?: string
          last_active?: string | null
          memory?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          agent_type?: string
          created_at?: string | null
          id?: string
          last_active?: string | null
          memory?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          description: string | null
          id: string
          last_active: string | null
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          last_active?: string | null
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          last_active?: string | null
          name?: string
        }
        Relationships: []
      }
      ai_content_templates: {
        Row: {
          content_type: string
          created_at: string | null
          created_by: string | null
          default_parameters: Json | null
          description: string | null
          example_output: string | null
          id: string
          is_active: boolean | null
          name: string
          tags: Json | null
          template_text: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          created_by?: string | null
          default_parameters?: Json | null
          description?: string | null
          example_output?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tags?: Json | null
          template_text: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          default_parameters?: Json | null
          description?: string | null
          example_output?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tags?: Json | null
          template_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_course_content: {
        Row: {
          course_id: string | null
          created_at: string | null
          created_for_user_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json
          personalization_context: Json | null
          updated_at: string | null
          version: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          created_for_user_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json
          personalization_context?: Json | null
          updated_at?: string | null
          version: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          created_for_user_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json
          personalization_context?: Json | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_course_content_sections: {
        Row: {
          content: string
          content_id: string | null
          created_at: string | null
          id: string
          module_id: string
          order_index: number
          section_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          module_id: string
          order_index?: number
          section_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          module_id?: string
          order_index?: number
          section_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_course_content_sections_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_course_quiz_questions: {
        Row: {
          content_id: string | null
          correct_answer: string | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          module_id: string
          options: Json | null
          question: string
        }
        Insert: {
          content_id?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id: string
          options?: Json | null
          question: string
        }
        Update: {
          content_id?: string | null
          correct_answer?: string | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          module_id?: string
          options?: Json | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_course_quiz_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          ai_agent_id: string | null
          content: Json | null
          content_id: string | null
          id: string
          module_id: string | null
          status: Database["public"]["Enums"]["content_status"] | null
        }
        Insert: {
          ai_agent_id?: string | null
          content?: Json | null
          content_id?: string | null
          id?: string
          module_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
        }
        Update: {
          ai_agent_id?: string | null
          content?: Json | null
          content_id?: string | null
          id?: string
          module_id?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_course_content: {
        Row: {
          content: Json
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          personalization_params: Json | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content: Json
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          personalization_params?: Json | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          personalization_params?: Json | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_history: {
        Row: {
          error_message: string | null
          generation_time: string | null
          generation_type: string
          id: string
          input_parameters: Json | null
          output_content_id: string | null
          processing_time: number | null
          success: boolean | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          error_message?: string | null
          generation_time?: string | null
          generation_type: string
          id?: string
          input_parameters?: Json | null
          output_content_id?: string | null
          processing_time?: number | null
          success?: boolean | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          error_message?: string | null
          generation_time?: string | null
          generation_type?: string
          id?: string
          input_parameters?: Json | null
          output_content_id?: string | null
          processing_time?: number | null
          success?: boolean | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_id: string | null
          attempt_number: number
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          passed: boolean | null
          percentage: number | null
          responses: Json
          score: number | null
          started_at: string | null
          submitted_at: string | null
          time_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          attempt_number: number
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          responses: Json
          score?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          attempt_number?: number
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          passed?: boolean | null
          percentage?: number | null
          responses?: Json
          score?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          assessment_id: string
          attempts_per_user: Json | null
          average_score: number | null
          average_time_spent: number | null
          last_updated: string | null
          most_missed_questions: Json | null
          pass_rate: number | null
          score_distribution: Json | null
          total_attempts: number | null
        }
        Insert: {
          assessment_id: string
          attempts_per_user?: Json | null
          average_score?: number | null
          average_time_spent?: number | null
          last_updated?: string | null
          most_missed_questions?: Json | null
          pass_rate?: number | null
          score_distribution?: Json | null
          total_attempts?: number | null
        }
        Update: {
          assessment_id?: string
          attempts_per_user?: Json | null
          average_score?: number | null
          average_time_spent?: number | null
          last_updated?: string | null
          most_missed_questions?: Json | null
          pass_rate?: number | null
          score_distribution?: Json | null
          total_attempts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          course_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          grading_criteria: Json
          id: string
          is_published: boolean | null
          module_id: string | null
          questions: Json
          questions_per_attempt: number | null
          randomize_questions: boolean | null
          section_id: string | null
          time_limit: number | null
          title: string
          total_points: number
          type: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grading_criteria: Json
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          questions: Json
          questions_per_attempt?: number | null
          randomize_questions?: boolean | null
          section_id?: string | null
          time_limit?: number | null
          title: string
          total_points: number
          type: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grading_criteria?: Json
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          questions?: Json
          questions_per_attempt?: number | null
          randomize_questions?: boolean | null
          section_id?: string | null
          time_limit?: number | null
          title?: string
          total_points?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      career_goals: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: string | null
          id: string
          progress: number | null
          related_skills: Json | null
          required_courses: Json | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          progress?: number | null
          related_skills?: Json | null
          required_courses?: Json | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          progress?: number | null
          related_skills?: Json | null
          required_courses?: Json | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          industry: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry?: string | null
          name?: string
        }
        Relationships: []
      }
      content_metadata: {
        Row: {
          author_id: string | null
          content_id: string
          content_type: string
          created_at: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          keywords: Json | null
          last_updated: string | null
          prerequisites: Json | null
          skills: Json | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author_id?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          keywords?: Json | null
          last_updated?: string | null
          prerequisites?: Json | null
          skills?: Json | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author_id?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          keywords?: Json | null
          last_updated?: string | null
          prerequisites?: Json | null
          skills?: Json | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      content_modifications: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          intervention_id: string | null
          modified_content: string
          original_content: string | null
          reason: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          modified_content: string
          original_content?: string | null
          reason?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          modified_content?: string
          original_content?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_modifications_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          content_id: string
          created_at: string | null
          employee_id: string
          id: string
          metrics: Json
        }
        Insert: {
          content_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          metrics: Json
        }
        Update: {
          content_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          metrics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "dynamic_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_update_decisions: {
        Row: {
          content_id: string
          created_at: string | null
          decision: string
          id: string
          metrics_snapshot: Json | null
          reasoning: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          decision: string
          id?: string
          metrics_snapshot?: Json | null
          reasoning?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          decision?: string
          id?: string
          metrics_snapshot?: Json | null
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_update_decisions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "dynamic_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_variants: {
        Row: {
          content: string | null
          content_type: string
          created_at: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          original_content_id: string
          target_learning_style: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          original_content_id: string
          target_learning_style: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          original_content_id?: string
          target_learning_style?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          changes: Json
          content_id: string
          created_at: string | null
          id: string
          reason: string | null
          version_number: number
        }
        Insert: {
          changes: Json
          content_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          version_number: number
        }
        Update: {
          changes?: Json
          content_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "dynamic_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          employee_id: string
          hr_user_id: string
          id: string
          last_message_at: string | null
          metadata: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          hr_user_id: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          hr_user_id?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      course_completion_records: {
        Row: {
          average_score: number | null
          certificate_id: string | null
          completion_date: string | null
          course_id: string | null
          course_name: string
          created_at: string | null
          employee_id: string | null
          feedback: string | null
          id: string
          rating: number | null
          start_date: string | null
          total_time_spent: number | null
        }
        Insert: {
          average_score?: number | null
          certificate_id?: string | null
          completion_date?: string | null
          course_id?: string | null
          course_name: string
          created_at?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          start_date?: string | null
          total_time_spent?: number | null
        }
        Update: {
          average_score?: number | null
          certificate_id?: string | null
          completion_date?: string | null
          course_id?: string | null
          course_name?: string
          created_at?: string | null
          employee_id?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          start_date?: string | null
          total_time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_completion_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_content_sections: {
        Row: {
          content: string
          content_id: string
          created_at: string
          id: string
          module_id: string
          order_index: number
          section_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_id: string
          created_at?: string
          id?: string
          module_id: string
          order_index: number
          section_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_id?: string
          created_at?: string
          id?: string
          module_id?: string
          order_index?: number
          section_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_content_sections_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completion_date: string | null
          course_id: string
          created_at: string | null
          employee_id: string
          id: string
          progress: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completion_date?: string | null
          course_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          progress?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completion_date?: string | null
          course_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          progress?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_metrics: {
        Row: {
          average_quiz_scores: Json | null
          average_rating: number | null
          average_time_to_complete: number | null
          completion_rate: number | null
          completions_by_department: Json | null
          course_id: string
          dropped_off_at: Json | null
          enrolled_count: number | null
          last_updated: string | null
          most_challenging: Json | null
          review_count: number | null
          top_feedback_keywords: Json | null
        }
        Insert: {
          average_quiz_scores?: Json | null
          average_rating?: number | null
          average_time_to_complete?: number | null
          completion_rate?: number | null
          completions_by_department?: Json | null
          course_id: string
          dropped_off_at?: Json | null
          enrolled_count?: number | null
          last_updated?: string | null
          most_challenging?: Json | null
          review_count?: number | null
          top_feedback_keywords?: Json | null
        }
        Update: {
          average_quiz_scores?: Json | null
          average_rating?: number | null
          average_time_to_complete?: number | null
          completion_rate?: number | null
          completions_by_department?: Json | null
          course_id?: string
          dropped_off_at?: Json | null
          enrolled_count?: number | null
          last_updated?: string | null
          most_challenging?: Json | null
          review_count?: number | null
          top_feedback_keywords?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "course_metrics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_module_quizzes: {
        Row: {
          content_id: string
          created_at: string
          id: string
          module_id: string
          quiz_data: Json
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          module_id: string
          quiz_data: Json
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          module_id?: string
          quiz_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_module_quizzes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_duration: number | null
          description: string | null
          id: string
          name: string
          structure: Json
          target_audience: Json | null
          target_skill_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          name: string
          structure: Json
          target_audience?: Json | null
          target_skill_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_duration?: number | null
          description?: string | null
          id?: string
          name?: string
          structure?: Json
          target_audience?: Json | null
          target_skill_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          ai_generated: boolean | null
          approved_by: string | null
          author_id: string | null
          banner_image: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          generated_by: string | null
          generation_id: string | null
          id: string
          is_published: boolean | null
          level: string | null
          personalization_factors: Json | null
          published_at: string | null
          reviewed_by: string | null
          short_description: string | null
          skills_gained: Json | null
          tags: Json | null
          thumbnail: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          approved_by?: string | null
          author_id?: string | null
          banner_image?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          is_published?: boolean | null
          level?: string | null
          personalization_factors?: Json | null
          published_at?: string | null
          reviewed_by?: string | null
          short_description?: string | null
          skills_gained?: Json | null
          tags?: Json | null
          thumbnail?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          approved_by?: string | null
          author_id?: string | null
          banner_image?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          is_published?: boolean | null
          level?: string | null
          personalization_factors?: Json | null
          published_at?: string | null
          reviewed_by?: string | null
          short_description?: string | null
          skills_gained?: Json | null
          tags?: Json | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_employee_id: string | null
          id: string
          name: string
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_employee_id?: string | null
          id?: string
          name: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_employee_id?: string | null
          id?: string
          name?: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_employee_id_fkey"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_course_content: {
        Row: {
          content: Json
          course_id: string
          created_at: string | null
          employee_id: string
          id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          content: Json
          course_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          content?: Json
          course_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      employee_quizzes: {
        Row: {
          completed_at: string | null
          course_id: string | null
          created_at: string | null
          difficulty_level: string
          employee_id: string | null
          id: string
          passing_score: number
          questions: Json
          score: number | null
          title: string
          topic: string
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          difficulty_level: string
          employee_id?: string | null
          id?: string
          passing_score?: number
          questions: Json
          score?: number | null
          title: string
          topic: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          difficulty_level?: string
          employee_id?: string | null
          id?: string
          passing_score?: number
          questions?: Json
          score?: number | null
          title?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_quizzes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rag_history: {
        Row: {
          created_at: string | null
          created_by: string
          employee_id: string
          id: string
          previous_status: string | null
          reason: string | null
          related_intervention_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          employee_id: string
          id?: string
          previous_status?: string | null
          reason?: string | null
          related_intervention_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          employee_id?: string
          id?: string
          previous_status?: string | null
          reason?: string | null
          related_intervention_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_rag_history_related_intervention_id_fkey"
            columns: ["related_intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_intervention"
            columns: ["related_intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_user_mapping: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_user_mapping_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_number: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          profile_image_url: string | null
          rag_status: string | null
          rag_status_last_updated: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_number?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          profile_image_url?: string | null
          rag_status?: string | null
          rag_status_last_updated?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_number?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          profile_image_url?: string | null
          rag_status?: string | null
          rag_status_last_updated?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comments: string | null
          course_id: string | null
          id: string
          learner_id: string | null
          rating: number | null
        }
        Insert: {
          comments?: string | null
          course_id?: string | null
          id?: string
          learner_id?: string | null
          rating?: number | null
        }
        Update: {
          comments?: string | null
          course_id?: string | null
          id?: string
          learner_id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_course_enrollments: {
        Row: {
          completed_modules: number | null
          completion_date: string | null
          course_id: string | null
          course_type: string | null
          due_date: string | null
          employee_id: string | null
          enrollment_date: string | null
          id: string
          last_accessed: string | null
          personalized_content_generation_status: string | null
          personalized_content_id: string | null
          personalized_content_started_at: string | null
          progress: number | null
          rag_status: string | null
          score: number | null
          status: string | null
          total_modules: number | null
        }
        Insert: {
          completed_modules?: number | null
          completion_date?: string | null
          course_id?: string | null
          course_type?: string | null
          due_date?: string | null
          employee_id?: string | null
          enrollment_date?: string | null
          id?: string
          last_accessed?: string | null
          personalized_content_generation_status?: string | null
          personalized_content_id?: string | null
          personalized_content_started_at?: string | null
          progress?: number | null
          rag_status?: string | null
          score?: number | null
          status?: string | null
          total_modules?: number | null
        }
        Update: {
          completed_modules?: number | null
          completion_date?: string | null
          course_id?: string | null
          course_type?: string | null
          due_date?: string | null
          employee_id?: string | null
          enrollment_date?: string | null
          id?: string
          last_accessed?: string | null
          personalized_content_generation_status?: string | null
          personalized_content_id?: string | null
          personalized_content_started_at?: string | null
          progress?: number | null
          rag_status?: string | null
          score?: number | null
          status?: string | null
          total_modules?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hr_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_course_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_course_enrollments_personalized_content_id_fkey"
            columns: ["personalized_content_id"]
            isOneToOne: false
            referencedRelation: "ai_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_courses: {
        Row: {
          category: string | null
          created_at: string | null
          department_id: string | null
          description: string | null
          difficulty_level: string | null
          duration: number | null
          duration_hours: number | null
          estimated_duration: number | null
          id: string
          module_count: number | null
          skill_level: string | null
          skills: Json | null
          status: string | null
          thumbnail: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          duration_hours?: number | null
          estimated_duration?: number | null
          id?: string
          module_count?: number | null
          skill_level?: string | null
          skills?: Json | null
          status?: string | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          duration_hours?: number | null
          estimated_duration?: number | null
          id?: string
          module_count?: number | null
          skill_level?: string | null
          skills?: Json | null
          status?: string | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_employee_activities: {
        Row: {
          activity_type: string
          course_id: string | null
          created_at: string | null
          createdAt: string | null
          description: string | null
          employee_id: string | null
          id: string
          timestamp: string | null
        }
        Insert: {
          activity_type: string
          course_id?: string | null
          created_at?: string | null
          createdAt?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          activity_type?: string
          course_id?: string | null
          created_at?: string | null
          createdAt?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_activities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hr_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_activities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_cv_extractions: {
        Row: {
          employee_id: string | null
          extracted_data: Json | null
          extraction_date: string | null
          extraction_status: string | null
          id: string
          original_file_url: string | null
        }
        Insert: {
          employee_id?: string | null
          extracted_data?: Json | null
          extraction_date?: string | null
          extraction_status?: string | null
          id?: string
          original_file_url?: string | null
        }
        Update: {
          employee_id?: string | null
          extracted_data?: Json | null
          extraction_date?: string | null
          extraction_status?: string | null
          id?: string
          original_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_cv_extractions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_skills: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          is_in_progress: boolean | null
          proficiency_level: string
          skill_name: string
          updated_at: string | null
          verification_date: string | null
          verification_status: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_in_progress?: boolean | null
          proficiency_level: string
          skill_name: string
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_in_progress?: boolean | null
          proficiency_level?: string
          skill_name?: string
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          company_id: string | null
          created_at: string | null
          cv_extracted_data: Json | null
          cv_extraction_date: string | null
          cv_file_url: string | null
          department_id: string | null
          email: string
          hire_date: string | null
          id: string
          last_active_at: string | null
          manager_id: string | null
          name: string
          phone: string | null
          position_id: string | null
          profile_image_url: string | null
          rag_status: string | null
          rag_status_reason: string | null
          rag_status_updated_at: string | null
          rag_status_updated_by: string | null
          resume_url: string | null
          skills: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          cv_extracted_data?: Json | null
          cv_extraction_date?: string | null
          cv_file_url?: string | null
          department_id?: string | null
          email: string
          hire_date?: string | null
          id?: string
          last_active_at?: string | null
          manager_id?: string | null
          name: string
          phone?: string | null
          position_id?: string | null
          profile_image_url?: string | null
          rag_status?: string | null
          rag_status_reason?: string | null
          rag_status_updated_at?: string | null
          rag_status_updated_by?: string | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          cv_extracted_data?: Json | null
          cv_extraction_date?: string | null
          cv_file_url?: string | null
          department_id?: string | null
          email?: string
          hire_date?: string | null
          id?: string
          last_active_at?: string | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          position_id?: string | null
          profile_image_url?: string | null
          rag_status?: string | null
          rag_status_reason?: string | null
          rag_status_updated_at?: string | null
          rag_status_updated_by?: string | null
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "hr_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_learning_path_courses: {
        Row: {
          course_id: string
          learning_path_id: string
          sequence_order: number
        }
        Insert: {
          course_id: string
          learning_path_id: string
          sequence_order: number
        }
        Update: {
          course_id?: string
          learning_path_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hr_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "hr_learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_learning_path_enrollments: {
        Row: {
          completion_date: string | null
          employee_id: string | null
          enrollment_date: string | null
          estimated_completion_date: string | null
          id: string
          learning_path_id: string | null
          progress: number | null
          status: string | null
        }
        Insert: {
          completion_date?: string | null
          employee_id?: string | null
          enrollment_date?: string | null
          estimated_completion_date?: string | null
          id?: string
          learning_path_id?: string | null
          progress?: number | null
          status?: string | null
        }
        Update: {
          completion_date?: string | null
          employee_id?: string | null
          enrollment_date?: string | null
          estimated_completion_date?: string | null
          id?: string
          learning_path_id?: string | null
          progress?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_learning_path_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_learning_path_enrollments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "hr_learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_learning_paths: {
        Row: {
          course_count: number | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          skill_level: string | null
          skills: Json | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          skill_level?: string | null
          skills?: Json | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_count?: number | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          skill_level?: string | null
          skills?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_personalized_course_content: {
        Row: {
          content: Json
          course_id: string
          created_at: string
          employee_id: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          content: Json
          course_id: string
          created_at?: string
          employee_id: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          content?: Json
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hr_positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          salary_range_max: number | null
          salary_range_min: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          salary_range_max?: number | null
          salary_range_min?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_uploads: {
        Row: {
          company_id: string | null
          file_path: string
          id: string
          processed: boolean | null
        }
        Insert: {
          company_id?: string | null
          file_path: string
          id?: string
          processed?: boolean | null
        }
        Update: {
          company_id?: string | null
          file_path?: string
          id?: string
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_users: {
        Row: {
          company_id: string | null
          id: string
        }
        Insert: {
          company_id?: string | null
          id: string
        }
        Update: {
          company_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_templates: {
        Row: {
          content_template: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          reason_for_use: string
          resource_ids: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content_template?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reason_for_use: string
          resource_ids?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content_template?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reason_for_use?: string
          resource_ids?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          employee_id: string | null
          id: string
          intervention_type: string
          notes: string | null
          status: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          intervention_type: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          intervention_type?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_achievements: {
        Row: {
          achievement_type: string
          associated_item_id: string | null
          associated_item_type: string | null
          created_at: string | null
          description: string | null
          earned_at: string
          employee_id: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          title: string
        }
        Insert: {
          achievement_type: string
          associated_item_id?: string | null
          associated_item_type?: string | null
          created_at?: string | null
          description?: string | null
          earned_at: string
          employee_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title: string
        }
        Update: {
          achievement_type?: string
          associated_item_id?: string | null
          associated_item_type?: string | null
          created_at?: string | null
          description?: string | null
          earned_at?: string
          employee_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_learner_achievements_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_activity_log: {
        Row: {
          activity_timestamp: string | null
          activity_type: string
          completion_status: string | null
          device_info: Json | null
          duration_seconds: number | null
          employee_id: string | null
          id: string
          related_item_id: string | null
          related_item_type: string | null
          session_id: string | null
        }
        Insert: {
          activity_timestamp?: string | null
          activity_type: string
          completion_status?: string | null
          device_info?: Json | null
          duration_seconds?: number | null
          employee_id?: string | null
          id?: string
          related_item_id?: string | null
          related_item_type?: string | null
          session_id?: string | null
        }
        Update: {
          activity_timestamp?: string | null
          activity_type?: string
          completion_status?: string | null
          device_info?: Json | null
          duration_seconds?: number | null
          employee_id?: string | null
          id?: string
          related_item_id?: string | null
          related_item_type?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_learner_activity_log_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_course_progress: {
        Row: {
          completion_metrics: Json | null
          course_id: string | null
          created_at: string | null
          current_module_id: string | null
          current_section_id: string | null
          employee_id: string | null
          estimated_completion_date: string | null
          id: string
          last_activity_at: string | null
          progress_percentage: number | null
          rag_status: string | null
          status_justification: string | null
          status_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          completion_metrics?: Json | null
          course_id?: string | null
          created_at?: string | null
          current_module_id?: string | null
          current_section_id?: string | null
          employee_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          rag_status?: string | null
          status_justification?: string | null
          status_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_metrics?: Json | null
          course_id?: string | null
          created_at?: string | null
          current_module_id?: string | null
          current_section_id?: string | null
          employee_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          rag_status?: string | null
          status_justification?: string | null
          status_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_learner_course_progress_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_dashboard_preferences: {
        Row: {
          color_theme: string | null
          created_at: string | null
          dashboard_layout: Json | null
          default_view: string | null
          employee_id: string | null
          id: string
          notification_preferences: Json | null
          updated_at: string | null
          widget_configuration: Json | null
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          dashboard_layout?: Json | null
          default_view?: string | null
          employee_id?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          widget_configuration?: Json | null
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          dashboard_layout?: Json | null
          default_view?: string | null
          employee_id?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          widget_configuration?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_learner_dashboard_preferences_employee"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_milestones: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          learner_id: string
          name: string
          progress: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          learner_id: string
          name: string
          progress?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          learner_id?: string
          name?: string
          progress?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_milestones_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          career_goals: string | null
          completed_onboarding: boolean | null
          created_at: string | null
          department: string | null
          employee_id: string | null
          hire_date: string | null
          id: string
          last_hr_sync: string | null
          preferences: Json
          prior_experience: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_goals?: string | null
          completed_onboarding?: boolean | null
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          last_hr_sync?: string | null
          preferences: Json
          prior_experience?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_goals?: string | null
          completed_onboarding?: boolean | null
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          last_hr_sync?: string | null
          preferences?: Json
          prior_experience?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_recommendations: {
        Row: {
          created_at: string | null
          employee_id: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_enrolled: boolean | null
          is_viewed: boolean | null
          item_id: string
          item_type: string
          priority_level: number | null
          recommendation_reason: string | null
          recommendation_source: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_enrolled?: boolean | null
          is_viewed?: boolean | null
          item_id: string
          item_type: string
          priority_level?: number | null
          recommendation_reason?: string | null
          recommendation_source: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_enrolled?: boolean | null
          is_viewed?: boolean | null
          item_id?: string
          item_type?: string
          priority_level?: number | null
          recommendation_reason?: string | null
          recommendation_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_learner_recommendations_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_skills: {
        Row: {
          created_at: string | null
          id: string
          learner_id: string
          level: string | null
          name: string
          progress: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learner_id: string
          level?: string | null
          name: string
          progress?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learner_id?: string
          level?: string | null
          name?: string
          progress?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_skills_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_statistics: {
        Row: {
          assigned_courses: number | null
          average_score: number | null
          certificates_earned: number | null
          courses_completed: number | null
          courses_in_progress: number | null
          created_at: string | null
          employee_id: string | null
          id: string
          learning_paths_completed: number | null
          skills_acquired: number | null
          total_time_spent: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_courses?: number | null
          average_score?: number | null
          certificates_earned?: number | null
          courses_completed?: number | null
          courses_in_progress?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          learning_paths_completed?: number | null
          skills_acquired?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_courses?: number | null
          average_score?: number | null
          certificates_earned?: number | null
          courses_completed?: number | null
          courses_in_progress?: number | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          learning_paths_completed?: number | null
          skills_acquired?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_statistics_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learners: {
        Row: {
          certifications: Json | null
          company_id: string | null
          id: string
          preferences: Json | null
          progress_status: Json | null
        }
        Insert: {
          certifications?: Json | null
          company_id?: string | null
          id: string
          preferences?: Json | null
          progress_status?: Json | null
        }
        Update: {
          certifications?: Json | null
          company_id?: string | null
          id?: string
          preferences?: Json | null
          progress_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "learners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_history: {
        Row: {
          activity_date: string | null
          activity_type: string
          completion_status: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          related_item_id: string | null
          related_item_name: string | null
          score: number | null
          time_spent: number | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          completion_status?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          related_item_id?: string | null
          related_item_name?: string | null
          score?: number | null
          time_spent?: number | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          completion_status?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          related_item_id?: string | null
          related_item_name?: string | null
          score?: number | null
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_metadata: {
        Row: {
          average_quiz_score: number | null
          average_session_duration: number | null
          completion_rate: number | null
          created_at: string | null
          employee_id: string
          engagement_score: number | null
          last_active: string | null
          most_active_time_of_day: string | null
          most_used_device: string | null
          updated_at: string | null
        }
        Insert: {
          average_quiz_score?: number | null
          average_session_duration?: number | null
          completion_rate?: number | null
          created_at?: string | null
          employee_id: string
          engagement_score?: number | null
          last_active?: string | null
          most_active_time_of_day?: string | null
          most_used_device?: string | null
          updated_at?: string | null
        }
        Update: {
          average_quiz_score?: number | null
          average_session_duration?: number | null
          completion_rate?: number | null
          created_at?: string | null
          employee_id?: string
          engagement_score?: number | null
          last_active?: string | null
          most_active_time_of_day?: string | null
          most_used_device?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_metadata_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_assignments: {
        Row: {
          assigned_by: string
          created_at: string | null
          due_date: string | null
          id: string
          learning_path_id: string
          mandatory: boolean | null
          notes: string | null
          priority: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          learning_path_id: string
          mandatory?: boolean | null
          notes?: string | null
          priority?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          learning_path_id?: string
          mandatory?: boolean | null
          notes?: string | null
          priority?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_path_courses: {
        Row: {
          completed_sections: number
          course_id: string
          created_at: string | null
          id: string
          learning_path_id: string
          match_score: number
          position: number
          progress: number
          rag_status: string
          sections: number
          updated_at: string | null
        }
        Insert: {
          completed_sections?: number
          course_id: string
          created_at?: string | null
          id?: string
          learning_path_id: string
          match_score: number
          position: number
          progress?: number
          rag_status?: string
          sections?: number
          updated_at?: string | null
        }
        Update: {
          completed_sections?: number
          course_id?: string
          created_at?: string | null
          id?: string
          learning_path_id?: string
          match_score?: number
          position?: number
          progress?: number
          rag_status?: string
          sections?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_hours: number | null
          id: string
          name: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_preferences: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          preferred_content_formats: Json | null
          preferred_device: string | null
          preferred_learning_times: Json | null
          preferred_session_duration: number | null
          primary_style: string | null
          secondary_styles: Json | null
          self_reported: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          preferred_content_formats?: Json | null
          preferred_device?: string | null
          preferred_learning_times?: Json | null
          preferred_session_duration?: number | null
          primary_style?: string | null
          secondary_styles?: Json | null
          self_reported?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          preferred_content_formats?: Json | null
          preferred_device?: string | null
          preferred_learning_times?: Json | null
          preferred_session_duration?: number | null
          primary_style?: string | null
          secondary_styles?: Json | null
          self_reported?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_preferences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          availability: Json | null
          expertise: string | null
          id: string
          rating: number | null
        }
        Insert: {
          availability?: Json | null
          expertise?: string | null
          id: string
          rating?: number | null
        }
        Update: {
          availability?: Json | null
          expertise?: string | null
          id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          content: Json | null
          course_id: string | null
          generated_by: string | null
          generation_id: string | null
          id: string
          learning_objectives: Json | null
          title: string
        }
        Insert: {
          content?: Json | null
          course_id?: string | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          learning_objectives?: Json | null
          title: string
        }
        Update: {
          content?: Json | null
          course_id?: string | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          learning_objectives?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_link: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          recipient_id: string | null
          title: string
        }
        Insert: {
          action_link?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          recipient_id?: string | null
          title: string
        }
        Update: {
          action_link?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          recipient_id?: string | null
          title?: string
        }
        Relationships: []
      }
      prerequisite_relationships: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          rationale: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          rationale?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          rationale?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          id: string
          learner_id: string | null
          module_id: string | null
          rag_status: Database["public"]["Enums"]["rag_status"]
          updated_at: string | null
        }
        Insert: {
          id?: string
          learner_id?: string | null
          module_id?: string | null
          rag_status: Database["public"]["Enums"]["rag_status"]
          updated_at?: string | null
        }
        Update: {
          id?: string
          learner_id?: string | null
          module_id?: string | null
          rag_status?: Database["public"]["Enums"]["rag_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_tracking_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_tracking_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          content: Json
          created_at: string | null
          difficulty_level: string | null
          explanation: string | null
          hint: string | null
          id: string
          points: number | null
          skills: Json | null
          tags: Json | null
          text: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          hint?: string | null
          id?: string
          points?: number | null
          skills?: Json | null
          tags?: Json | null
          text: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          hint?: string | null
          id?: string
          points?: number | null
          skills?: Json | null
          tags?: Json | null
          text?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          completed_at: string | null
          content_id: string
          course_id: string
          created_at: string | null
          employee_id: string
          id: string
          quiz_data: Json
          score: number | null
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          course_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          quiz_data: Json
          score?: number | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          course_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          quiz_data?: Json
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "dynamic_course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_assignments: {
        Row: {
          assignment_reason: string
          created_at: string | null
          id: string
          intervention_id: string | null
          resource_id: string
          resource_name: string
          resource_type: string
          resource_url: string | null
        }
        Insert: {
          assignment_reason: string
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          resource_id: string
          resource_name: string
          resource_type: string
          resource_url?: string | null
        }
        Update: {
          assignment_reason?: string
          created_at?: string | null
          id?: string
          intervention_id?: string | null
          resource_id?: string
          resource_name?: string
          resource_type?: string
          resource_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_assignments_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content: string | null
          content_type: string
          content_variations: Json | null
          created_at: string | null
          description: string | null
          estimated_duration: number | null
          generated_by: string | null
          generation_id: string | null
          id: string
          is_optional: boolean | null
          module_id: string | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_type: string
          content_variations?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          is_optional?: boolean | null
          module_id?: string | null
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          content_variations?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_duration?: number | null
          generated_by?: string | null
          generation_id?: string | null
          id?: string
          is_optional?: boolean | null
          module_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_records: {
        Row: {
          associated_courses: Json | null
          created_at: string | null
          employee_id: string | null
          id: string
          last_demonstrated: string | null
          proficiency_level: string | null
          proficiency_score: number | null
          skill_name: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          associated_courses?: Json | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          last_demonstrated?: string | null
          proficiency_level?: string | null
          proficiency_score?: number | null
          skill_name: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          associated_courses?: Json | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          last_demonstrated?: string | null
          proficiency_level?: string | null
          proficiency_score?: number | null
          skill_name?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          id: string
          permissions: Json | null
        }
        Insert: {
          id: string
          permissions?: Json | null
        }
        Update: {
          id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          join_date: string | null
          role: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          join_date?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          join_date?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          name: string
          team_lead_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          team_lead_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          team_lead_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          createdAt: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          createdAt?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          createdAt?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          llm_config: Json | null
          ui_preferences: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          llm_config?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          llm_config?: Json | null
          ui_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          completed_courses: Json | null
          created_at: string | null
          department: string | null
          email: string | null
          experience_level: string | null
          id: string
          interests: Json | null
          learning_style: string | null
          name: string
          position: string | null
          role: string
          skills: Json | null
          updated_at: string | null
        }
        Insert: {
          completed_courses?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          experience_level?: string | null
          id: string
          interests?: Json | null
          learning_style?: string | null
          name: string
          position?: string | null
          role?: string
          skills?: Json | null
          updated_at?: string | null
        }
        Update: {
          completed_courses?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          experience_level?: string | null
          id?: string
          interests?: Json | null
          learning_style?: string | null
          name?: string
          position?: string | null
          role?: string
          skills?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_fix_column_names: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_confirmed_user: {
        Args: { user_email: string; user_password: string; user_data?: Json }
        Returns: Json
      }
      create_hr_content_table: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_hr_personalized_content_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notifications_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_required_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      content_status: "Draft" | "Published" | "Archived"
      rag_status: "Green" | "Amber" | "Red"
      user_role: "Learner" | "HR" | "Mentor" | "SuperAdmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["Draft", "Published", "Archived"],
      rag_status: ["Green", "Amber", "Red"],
      user_role: ["Learner", "HR", "Mentor", "SuperAdmin"],
    },
  },
} as const
