import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { AgentService } from '@/services/agent.service';
import { checkRequiredTables } from '@/utils/database/tableExists';
import type { EmployeeProgress, LearningStatistics } from '@/types/hr.types';

// Type for learner profile
interface LearnerProfile {
  id?: string;
  user_id: string;
  email: string;
  name: string | null;
  bio: string | null;
  title: string | null;
  department: string | null;
  skills: string[] | null;
  learning_preferences: {
    preferred_learning_style: string | null;
    preferred_content_types: string[] | null;
    learning_goals: string[] | null;
  } | null;
}

// Learning path assignment interface
interface LearningPathAssignment {
  user_id: string;
  learning_path_id: string;
  assigned_by: string;
  due_date?: Date;
  priority?: 'high' | 'medium' | 'low';
  mandatory?: boolean;
  notes?: string;
}

// Required tables for the HR-Learner connection
const REQUIRED_TABLES = [
  'learning_paths',
  'learning_path_courses',
  'learning_path_assignments',
  'course_enrollments',
  'agent_activities',
  'hr_employees',
  'hr_departments'
];

// Helper function to handle errors
const handleError = (error: any, defaultMessage: string) => {
  console.error(`${defaultMessage}:`, error);
  toast({
    variant: 'destructive',
    title: 'Error',
    description: error.message || defaultMessage,
  });
  return { success: false, error: error.message || defaultMessage };
};

/**
 * HR Learner Service
 * Bridges the gap between HR employee management and learner profiles
 */
class HRLearnerService {
  /**
   * Check if all required tables exist for the HR-Learner connection
   * @returns {Promise<{success: boolean, missingTables?: string[]}>} Result with success status and any missing tables
   */
  async checkRequiredTablesExist(): Promise<{success: boolean, missingTables?: string[]}> {
    const result = await checkRequiredTables(REQUIRED_TABLES);
    return {
      success: result.success,
      missingTables: result.missingTables
    };
  }

  /**
   * Create a learner profile from HR employee data
   * This is called during employee onboarding or when updating an employee
   */
  async createOrUpdateLearnerProfile(employeeData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check if the user exists in the auth system
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', employeeData.email)
        .single();
      
      // If no user exists yet, we can't create a learner profile
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      const userId = userData?.id;
      
      // If no user exists, return a warning but don't fail
      if (!userId) {
        return {
          success: false,
          error: `User with email ${employeeData.email} does not exist. They must sign up first.`
        };
      }
      
      // Check if a learner profile already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('learner_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // Ignore not found error
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Prepare learner profile data
      const profileData: LearnerProfile = {
        user_id: userId,
        email: employeeData.email,
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        bio: employeeData.bio || null,
        title: employeeData.position || null,
        department: employeeData.department || null,
        skills: employeeData.skills || [],
        learning_preferences: {
          preferred_learning_style: null,
          preferred_content_types: [],
          learning_goals: []
        }
      };
      
      // Create or update the profile
      let result;
      if (existingProfile) {
        const { data, error } = await supabase
          .from('learner_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
          .select()
          .single();
          
        if (error) throw error;
        result = { success: true, data, action: 'updated' };
      } else {
        const { data, error } = await supabase
          .from('learner_profiles')
          .insert(profileData)
          .select()
          .single();
          
        if (error) throw error;
        result = { success: true, data, action: 'created' };
      }
      
      return result;
    } catch (error) {
      return handleError(error, 'Failed to create/update learner profile');
    }
  }
  
  /**
   * Assign a learning path to a learner
   */
  async assignLearningPath(assignment: LearningPathAssignment): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validate that the user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', assignment.user_id)
        .single();
        
      if (userError) throw userError;
      
      // Validate that the learning path exists
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths')
        .select('id, name')
        .eq('id', assignment.learning_path_id)
        .single();
        
      if (pathError) throw pathError;
      
      // Check if the assignment already exists
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from('learning_path_assignments')
        .select('id')
        .eq('user_id', assignment.user_id)
        .eq('learning_path_id', assignment.learning_path_id)
        .single();
        
      // Ignore not found error
      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }
      
      // Create or update the assignment
      let result;
      if (existingAssignment) {
        const { data, error } = await supabase
          .from('learning_path_assignments')
          .update({
            assigned_by: assignment.assigned_by,
            due_date: assignment.due_date,
            priority: assignment.priority,
            mandatory: assignment.mandatory,
            notes: assignment.notes,
            updated_at: new Date()
          })
          .eq('id', existingAssignment.id)
          .select()
          .single();
          
        if (error) throw error;
        result = { success: true, data, action: 'updated' };
      } else {
        const { data, error } = await supabase
          .from('learning_path_assignments')
          .insert({
            user_id: assignment.user_id,
            learning_path_id: assignment.learning_path_id,
            assigned_by: assignment.assigned_by,
            due_date: assignment.due_date,
            priority: assignment.priority,
            mandatory: assignment.mandatory,
            notes: assignment.notes,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();
          
        if (error) throw error;
        result = { success: true, data, action: 'created' };
        
        // Log this as an agent activity
        await supabase
          .from('agent_activities')
          .insert({
            user_id: assignment.user_id,
            agent_type: 'hr',
            agent_name: 'HR Manager',
            activity_type: 'learning_path_assignment',
            description: `Learning path "${pathData.name}" assigned by HR`,
            metadata: {
              learning_path_id: assignment.learning_path_id,
              learning_path_name: pathData.name,
              assigned_by: assignment.assigned_by,
              mandatory: assignment.mandatory || false,
              priority: assignment.priority || 'medium'
            }
          });
      }
      
      return result;
    } catch (error) {
      return handleError(error, 'Failed to assign learning path');
    }
  }
  
  /**
   * Get a summary of learner progress for HR dashboard
   */
  public async getLearnerProgressSummary(): Promise<{
    success: boolean;
    data?: {
      statistics: LearningStatistics;
      employees: EmployeeProgress[];
    };
    error?: string;
    missingTables?: string[];
  }> {
    try {
      // Check if required tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['employees', 'learning_paths', 'progress_tracking']);

      if (tablesError) {
        return {
          success: false,
          error: 'Failed to check database tables',
          missingTables: ['employees', 'learning_paths', 'progress_tracking']
        };
      }

      const existingTables = tables.map(t => t.table_name);
      const missingTables = ['employees', 'learning_paths', 'progress_tracking']
        .filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        return {
          success: false,
          error: 'Required database tables do not exist',
          missingTables
        };
      }

      // Fetch statistics
      const { data: stats, error: statsError } = await supabase
        .from('progress_tracking')
        .select('*')
        .single();

      if (statsError) {
        return {
          success: false,
          error: 'Failed to fetch learning statistics'
        };
      }

      // Fetch employee progress
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          email,
          department,
          learning_paths (
            progress,
            status
          ),
          last_activity
        `);

      if (employeesError) {
        return {
          success: false,
          error: 'Failed to fetch employee progress'
        };
      }

      // Map the raw employee data to the expected EmployeeProgress format
      const mappedEmployees: EmployeeProgress[] = employees.map(emp => {
        // Calculate average progress across learning paths
        const paths = emp.learning_paths || [];
        const avgProgress = paths.length > 0
          ? paths.reduce((sum, path) => sum + (path.progress || 0), 0) / paths.length
          : 0;
        
        // Determine RAG status based on progress
        let ragStatus: 'red' | 'amber' | 'green' = 'green';
        if (avgProgress < 30) {
          ragStatus = 'red';
        } else if (avgProgress < 70) {
          ragStatus = 'amber';
        }

        return {
          user_id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          active_paths: paths.length,
          avg_progress: Math.round(avgProgress),
          rag_status: ragStatus,
          recent_activity: 'Course progress updated', // Default value
          last_active: emp.last_activity || 'Never'
        };
      });

      return {
        success: true,
        data: {
          statistics: stats as LearningStatistics,
          employees: mappedEmployees
        }
      };
    } catch (error) {
      console.error('Error in getLearnerProgressSummary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Create and export the singleton instance
const hrLearnerService = new HRLearnerService();

export { HRLearnerService, hrLearnerService }; 