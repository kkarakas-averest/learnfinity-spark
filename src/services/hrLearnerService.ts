import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { AgentService } from '@/services/agent.service';

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
export const hrLearnerService = {
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
  },
  
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
      
      // Now enroll the learner in all courses from this learning path
      const { data: pathCourses, error: coursesError } = await supabase
        .from('learning_path_courses')
        .select('course_id')
        .eq('learning_path_id', assignment.learning_path_id);
        
      if (coursesError) throw coursesError;
      
      // Enroll in each course if they aren't already enrolled
      for (const { course_id } of pathCourses) {
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: assignment.user_id,
            course_id,
            progress: 0,
            rag_status: 'amber',
            sections: 0,  // This will be updated when they first open the course
            completed_sections: 0
          })
          .onConflict(['user_id', 'course_id'])
          .ignore();
          
        if (enrollError && enrollError.code !== '23505') { // Ignore duplicate error
          console.error(`Error enrolling user in course ${course_id}:`, enrollError);
        }
      }
      
      return result;
    } catch (error) {
      return handleError(error, 'Failed to assign learning path');
    }
  },
  
  /**
   * Get all learning path assignments for a learner
   */
  async getLearnerAssignments(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('learning_path_assignments')
        .select(`
          id,
          learning_path_id,
          due_date,
          priority,
          mandatory,
          notes,
          created_at,
          updated_at,
          learning_paths (
            id,
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return handleError(error, 'Failed to fetch learner assignments');
    }
  },
  
  /**
   * Generate a personalized learning path for an employee
   */
  async generatePersonalizedPath(employeeId: string, hrUserId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First get the employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', employeeId)
        .single();
        
      if (employeeError) throw employeeError;
      
      // Get the user_id from the email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', employeeData.email)
        .single();
        
      if (userError) throw userError;
      
      const userId = userData.id;
      
      // Initialize the agent service
      const agentService = new AgentService();
      
      // Call the agent to generate a learning path
      const result = await agentService.generateLearningPath({
        userId,
        role: employeeData.position || 'Employee',
        department: employeeData.department || 'General',
        skills: employeeData.skills || []
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate learning path');
      }
      
      // Create a new learning path
      const { data: learningPath, error: pathError } = await supabase
        .from('learning_paths')
        .insert({
          user_id: userId,
          name: result.data.name,
          description: result.data.description,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();
        
      if (pathError) throw pathError;
      
      // Now add the recommended courses to the learning path
      for (const [index, course] of result.data.courses.entries()) {
        // Check if the course exists, create it if not
        let courseId;
        const { data: existingCourse, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('title', course.title)
          .single();
          
        if (courseError && courseError.code !== 'PGRST116') {
          throw courseError;
        }
        
        if (existingCourse) {
          courseId = existingCourse.id;
        } else {
          // Create the course
          const { data: newCourse, error: createError } = await supabase
            .from('courses')
            .insert({
              title: course.title,
              description: course.description,
              estimated_duration: course.duration,
              skills: course.skills,
              created_at: new Date(),
              updated_at: new Date()
            })
            .select()
            .single();
            
          if (createError) throw createError;
          courseId = newCourse.id;
        }
        
        // Add the course to the learning path
        const { error: mappingError } = await supabase
          .from('learning_path_courses')
          .insert({
            learning_path_id: learningPath.id,
            course_id: courseId,
            match_score: course.matchScore || 80,
            rag_status: 'amber',
            progress: 0,
            sections: course.sections || 10,
            completed_sections: 0
          });
          
        if (mappingError) throw mappingError;
      }
      
      // Finally, assign this learning path to the user
      await this.assignLearningPath({
        user_id: userId,
        learning_path_id: learningPath.id,
        assigned_by: hrUserId,
        priority: 'medium',
        mandatory: true,
        notes: 'Automatically generated personalized learning path'
      });
      
      return {
        success: true,
        data: {
          learningPathId: learningPath.id,
          name: learningPath.name,
          courses: result.data.courses.length
        }
      };
    } catch (error) {
      return handleError(error, 'Failed to generate personalized learning path');
    }
  },
  
  /**
   * Get a summary of learner progress for all employees
   */
  async getLearnerProgressSummary(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get the count of all users
      const { count: totalUsers, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Get counts of users with learning paths
      const { count: usersWithPaths, error: pathError } = await supabase
        .from('learning_paths')
        .select('user_id', { count: 'exact', head: true })
        .not('user_id', 'is', null);
        
      if (pathError) throw pathError;
      
      // Get counts of users who have completed at least one course
      const { count: usersWithCompletions, error: completionError } = await supabase
        .from('course_enrollments')
        .select('user_id', { count: 'exact', head: true })
        .eq('progress', 100);
        
      if (completionError) throw completionError;
      
      // Get average progress across all enrollments
      const { data: progressData, error: progressError } = await supabase
        .from('course_enrollments')
        .select('progress');
        
      if (progressError) throw progressError;
      
      const averageProgress = progressData.length > 0
        ? progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length
        : 0;
      
      // Get RAG status distribution
      const { data: ragData, error: ragError } = await supabase
        .from('course_enrollments')
        .select('rag_status, count', { count: 'exact' })
        .neq('rag_status', null)
        .groupBy('rag_status');
        
      if (ragError) throw ragError;
      
      const ragDistribution = {
        green: 0,
        amber: 0,
        red: 0
      };
      
      ragData.forEach(item => {
        if (item.rag_status in ragDistribution) {
          ragDistribution[item.rag_status as keyof typeof ragDistribution] = item.count;
        }
      });
      
      return {
        success: true,
        data: {
          totalUsers,
          usersWithPaths,
          usersWithCompletions,
          averageProgress: Math.round(averageProgress),
          coveragePercentage: totalUsers > 0 ? Math.round((usersWithPaths / totalUsers) * 100) : 0,
          completionPercentage: usersWithPaths > 0 ? Math.round((usersWithCompletions / usersWithPaths) * 100) : 0,
          ragDistribution
        }
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch learner progress summary');
    }
  }
}; 