import { supabase } from '@/lib/supabase';

export interface AgentTaskRequest {
  user_id: string;
  agent_type: 'personalization' | 'content_creation' | 'feedback' | 'adaptation';
  task_type: string;
  priority: 'low' | 'medium' | 'high';
  data: Record<string, any>;
}

export interface AgentTaskResponse {
  success: boolean;
  task_id?: string;
  error?: string;
}

export interface LearningTask {
  id: string;
  user_id: string;
  agent_type: string;
  task_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: string;
  created_at: string;
  completed_at?: string;
  result?: Record<string, any>;
}

/**
 * Service for interacting with AI agents in the system
 */
export class AIAgentService {
  /**
   * Create a task for an AI agent to process
   */
  public async createAgentTask(request: AgentTaskRequest): Promise<AgentTaskResponse> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_tasks')
        .insert({
          user_id: request.user_id,
          agent_type: request.agent_type,
          task_type: request.task_type,
          status: 'pending',
          priority: request.priority,
          data: request.data,
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      // Attempt to notify the agent about the new task
      this.notifyAgent(data.id, request.agent_type);
      
      return {
        success: true,
        task_id: data.id
      };
    } catch (error: any) {
      console.error('Failed to create agent task:', error);
      return {
        success: false,
        error: error.message || 'Failed to create agent task'
      };
    }
  }

  /**
   * Get all tasks for a specific user
   */
  public async getUserTasks(userId: string): Promise<LearningTask[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to get user tasks:', error);
      return [];
    }
  }
  
  /**
   * Get a specific task by ID
   */
  public async getTaskById(taskId: string): Promise<LearningTask | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Failed to get task by ID:', error);
      return null;
    }
  }
  
  /**
   * Create a personalized learning path for a user based on their profile
   */
  public async createPersonalizedLearningPath(userId: string): Promise<AgentTaskResponse> {
    try {
      // First, get the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      if (!profileData) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }
      
      // Create a task for the personalization agent
      return this.createAgentTask({
        user_id: userId,
        agent_type: 'personalization',
        task_type: 'generate_learning_path',
        priority: 'high',
        data: {
          profile: profileData,
          learning_preferences: profileData.learning_preferences,
        }
      });
    } catch (error: any) {
      console.error('Failed to create personalized learning path:', error);
      return {
        success: false,
        error: error.message || 'Failed to create personalized learning path'
      };
    }
  }
  
  /**
   * Generate course content for a specific learning path
   */
  public async generateCourseContent(userId: string, courseId: string): Promise<AgentTaskResponse> {
    try {
      // First, get the course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (courseError) throw courseError;
      
      if (!courseData) {
        return {
          success: false,
          error: 'Course not found'
        };
      }
      
      // Get user profile for personalization
      const { data: profileData, error: profileError } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      // Create a task for the content creation agent
      return this.createAgentTask({
        user_id: userId,
        agent_type: 'content_creation',
        task_type: 'generate_course_content',
        priority: 'medium',
        data: {
          course: courseData,
          profile: profileData || null,
        }
      });
    } catch (error: any) {
      console.error('Failed to generate course content:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate course content'
      };
    }
  }
  
  /**
   * Analyze learner progress and adapt learning path if needed
   */
  public async adaptLearningPath(userId: string): Promise<AgentTaskResponse> {
    try {
      // Get recent progress data
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (progressError) throw progressError;
      
      // Create a task for the adaptation agent
      return this.createAgentTask({
        user_id: userId,
        agent_type: 'adaptation',
        task_type: 'adapt_learning_path',
        priority: 'high',
        data: {
          recent_progress: progressData || [],
        }
      });
    } catch (error: any) {
      console.error('Failed to adapt learning path:', error);
      return {
        success: false,
        error: error.message || 'Failed to adapt learning path'
      };
    }
  }
  
  /**
   * Provide feedback on a learner's submission
   */
  public async provideFeedback(userId: string, submissionId: string): Promise<AgentTaskResponse> {
    try {
      // Get the submission details
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
        
      if (submissionError) throw submissionError;
      
      if (!submissionData) {
        return {
          success: false,
          error: 'Submission not found'
        };
      }
      
      // Create a task for the feedback agent
      return this.createAgentTask({
        user_id: userId,
        agent_type: 'feedback',
        task_type: 'provide_submission_feedback',
        priority: 'high',
        data: {
          submission: submissionData,
        }
      });
    } catch (error: any) {
      console.error('Failed to generate feedback:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate feedback'
      };
    }
  }
  
  /**
   * Notify the agent about a new task (implementation depends on your agent architecture)
   */
  private async notifyAgent(taskId: string, agentType: string): Promise<void> {
    // This could be implemented in different ways:
    // - If agents are serverless functions, trigger them
    // - If agents are microservices, send a message to a queue
    // - If agents are scheduled tasks, update a task status in the database
    
    try {
      // For this example, we'll update a table that tells the agents to look for work
      const { error } = await supabase
        .from('agent_notifications')
        .insert({
          task_id: taskId,
          agent_type: agentType,
          status: 'new',
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Failed to notify agent:', error);
      // Not throwing the error as this is a best-effort notification
    }
  }
}

// Export a singleton instance
export const aiAgentService = new AIAgentService(); 