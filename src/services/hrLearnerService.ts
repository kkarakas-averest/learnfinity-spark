import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { AgentService } from '@/services/agent.service';
import { checkRequiredTables } from '@/utils/database/tableExists';

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
  async getLearnerProgressSummary(): Promise<{ success: boolean; data?: any; error?: string; missingTables?: string[] }> {
    try {
      // First check if required tables exist
      const { success: tablesExist, missingTables } = await this.checkRequiredTablesExist();
      
      if (!tablesExist) {
        return {
          success: false,
          error: 'Required database tables do not exist',
          missingTables
        };
      }
      
      // Get all employees with their department info
      const { data: employees, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          id,
          name,
          email,
          department_id (
            id,
            name
          )
        `);
        
      if (employeeError) throw employeeError;
      
      // Get all learning path assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('learning_path_assignments')
        .select('*');
        
      if (assignmentError) throw assignmentError;
      
      // Get all course enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*');
        
      if (enrollmentError) throw enrollmentError;
      
      // Get recent completions
      const { data: recentCompletions, error: completionError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
      if (completionError) throw completionError;
      
      // Calculate statistics
      const totalEmployees = employees?.length || 0;
      const activePathsCount = assignments?.length || 0;
      const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0;
      const totalCourses = enrollments?.length || 0;
      const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
      
      // Count at-risk employees based on their progress and overdue assignments
      const atRiskCount = employees?.filter(emp => {
        const empEnrollments = enrollments?.filter(e => e.user_id === emp.id) || [];
        const avgProgress = empEnrollments.length > 0
          ? empEnrollments.reduce((sum, enr) => sum + (enr.progress || 0), 0) / empEnrollments.length
          : 0;
        return avgProgress < 30 || empEnrollments.some(e => e.status === 'overdue');
      }).length || 0;
      
      // Calculate average progress across all employees
      const avgProgress = employees?.reduce((acc, emp) => {
        const empEnrollments = enrollments?.filter(e => e.user_id === emp.id) || [];
        const empProgress = empEnrollments.reduce((sum, enr) => sum + (enr.progress || 0), 0);
        return acc + (empProgress / (empEnrollments.length || 1));
      }, 0) / (employees?.length || 1);
      
      // Process employee progress data
      const employeeProgress = await Promise.all(employees?.map(async (employee) => {
        // Get active learning paths for this employee
        const activePathCount = assignments?.filter(a => a.user_id === employee.id).length || 0;
        
        // Calculate average progress for this employee
        const employeeEnrollments = enrollments?.filter(e => e.user_id === employee.id) || [];
        const employeeAvgProgress = employeeEnrollments.length > 0
          ? employeeEnrollments.reduce((sum, enr) => sum + (enr.progress || 0), 0) / employeeEnrollments.length
          : 0;
        
        // Determine RAG status based on progress and completion
        let overallRagStatus: 'red' | 'amber' | 'green' = 'green';
        
        if (employeeAvgProgress < 30 || employeeEnrollments.some(e => e.status === 'overdue')) {
          overallRagStatus = 'red';
        } else if (employeeAvgProgress < 70) {
          overallRagStatus = 'amber';
        }
        
        // Get most recent activity
        const { data: recentActivity, error: activityError } = await supabase
          .from('agent_activities')
          .select('description, created_at')
          .eq('user_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (activityError) {
          console.error(`Error fetching recent activity for employee ${employee.id}:`, activityError);
        }
        
        // Format the last active date
        const lastActive = recentActivity?.length > 0
          ? new Date(recentActivity[0].created_at).toLocaleDateString()
          : 'Never';
          
        return {
          user_id: employee.id,
          name: employee.name,
          email: employee.email,
          department: 
            typeof employee.department_id === 'object' && employee.department_id && 'name' in employee.department_id 
              ? employee.department_id.name 
              : 'Unknown',
          active_paths: activePathCount || 0,
          avg_progress: employeeAvgProgress,
          rag_status: overallRagStatus,
          recent_activity: recentActivity?.length > 0
            ? recentActivity[0].description
            : 'No recent activity',
          last_active: lastActive
        };
      }));
      
      // Return the complete data
      return {
        success: true,
        data: {
          statistics: {
            total_employees: totalEmployees || 0,
            active_paths: activePathsCount,
            completion_rate: completionRate,
            at_risk_count: atRiskCount,
            avg_progress: avgProgress,
            recent_completions: recentCompletions?.length || 0
          },
          employees: employeeProgress
        }
      };
    } catch (error) {
      return handleError(error, 'Failed to get learner progress summary');
    }
  }
}

// Create and export the singleton instance
const hrLearnerService = new HRLearnerService();
export { hrLearnerService }; 