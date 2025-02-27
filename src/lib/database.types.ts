
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'learner' | 'hr' | 'mentor' | 'superadmin'
export type RagStatus = 'green' | 'amber' | 'red'
export type ContentStatus = 'draft' | 'published' | 'archived'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          role: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          role?: UserRole
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          created_at?: string
        }
      }
      learners: {
        Row: {
          id: string
          company_id: string | null
          progress_status: Json
          preferences: Json
          certifications: Json
        }
        Insert: {
          id: string
          company_id?: string | null
          progress_status?: Json
          preferences?: Json
          certifications?: Json
        }
        Update: {
          id?: string
          company_id?: string | null
          progress_status?: Json
          preferences?: Json
          certifications?: Json
        }
      }
      mentors: {
        Row: {
          id: string
          expertise: string | null
          availability: Json
          rating: number
        }
        Insert: {
          id: string
          expertise?: string | null
          availability?: Json
          rating?: number
        }
        Update: {
          id?: string
          expertise?: string | null
          availability?: Json
          rating?: number
        }
      }
      hr_users: {
        Row: {
          id: string
          company_id: string | null
        }
        Insert: {
          id: string
          company_id?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
        }
      }
      super_admins: {
        Row: {
          id: string
          permissions: Json
        }
        Insert: {
          id: string
          permissions?: Json
        }
        Update: {
          id?: string
          permissions?: Json
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          company_id: string | null
          ai_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          company_id?: string | null
          ai_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          company_id?: string | null
          ai_generated?: boolean
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          content: Json
          sequence_order: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content?: Json
          sequence_order: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          content?: Json
          sequence_order?: number
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          module_id: string
          questions: Json
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          questions: Json
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          questions?: Json
          created_at?: string
        }
      }
      learning_paths: {
        Row: {
          id: string
          learner_id: string
          course_id: string
          ai_adaptation: Json
          created_at: string
        }
        Insert: {
          id?: string
          learner_id: string
          course_id: string
          ai_adaptation?: Json
          created_at?: string
        }
        Update: {
          id?: string
          learner_id?: string
          course_id?: string
          ai_adaptation?: Json
          created_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          name: string
          description: string | null
          last_active: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          last_active?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          last_active?: string
        }
      }
      ai_generated_content: {
        Row: {
          id: string
          ai_agent_id: string | null
          module_id: string
          content: Json
          status: ContentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ai_agent_id?: string | null
          module_id: string
          content: Json
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ai_agent_id?: string | null
          module_id?: string
          content?: Json
          status?: ContentStatus
          created_at?: string
          updated_at?: string
        }
      }
      progress_tracking: {
        Row: {
          id: string
          learner_id: string
          module_id: string
          rag_status: RagStatus
          updated_at: string
        }
        Insert: {
          id?: string
          learner_id: string
          module_id: string
          rag_status?: RagStatus
          updated_at?: string
        }
        Update: {
          id?: string
          learner_id?: string
          module_id?: string
          rag_status?: RagStatus
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          learner_id: string
          course_id: string
          rating: number
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          learner_id: string
          course_id: string
          rating: number
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          learner_id?: string
          course_id?: string
          rating?: number
          comments?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          timestamp: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          timestamp?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          timestamp?: string
          metadata?: Json | null
        }
      }
      hr_uploads: {
        Row: {
          id: string
          company_id: string
          file_path: string
          processed: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          company_id: string
          file_path: string
          processed?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          file_path?: string
          processed?: boolean
          uploaded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      get_my_company: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
    }
    Enums: {
      user_role: UserRole
      rag_status: RagStatus
      content_status: ContentStatus
    }
  }
}
