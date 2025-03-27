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
      hr_employees: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          hire_date: string | null
          department_id: string | null
          position_id: string | null
          manager_id: string | null
          status: string
          profile_image_url: string | null
          resume_url: string | null
          last_active_at: string | null
          created_at: string
          updated_at: string
          hr_departments?: {
            id: string
            name: string
          } | null
          hr_positions?: {
            id: string
            title: string
          } | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          hire_date?: string | null
          department_id?: string | null
          position_id?: string | null
          manager_id?: string | null
          status?: string
          profile_image_url?: string | null
          resume_url?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          hire_date?: string | null
          department_id?: string | null
          position_id?: string | null
          manager_id?: string | null
          status?: string
          profile_image_url?: string | null
          resume_url?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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