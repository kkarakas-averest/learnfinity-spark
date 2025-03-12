/**
 * Agent Service
 * Provides a centralized way to access and utilize AI agents in the application
 */
export class AgentService {
  private static instance: AgentService;
  
  /**
   * Get the singleton instance of the AgentService
   */
  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }
  
  /**
   * Generate a personalized learning path for a user
   */
  async generateLearningPath(userProfile: {
    userId: string;
    role: string;
    department: string;
    skills: string[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Create an employee profile object from the user data
      const employeeProfile = {
        id: userProfile.userId,
        role: userProfile.role,
        department: userProfile.department,
        skills: userProfile.skills,
        level: 'intermediate', // Default value, could be passed in
        learningStyle: 'visual', // Default value, could be personalized
        goals: [`Become proficient in ${userProfile.role} role in ${userProfile.department}`]
      };
      
      // Default learning path for testing (replace with actual AI integration)
      const defaultPath = {
        name: `${userProfile.role} Development Path`,
        description: `Customized learning path for ${userProfile.role} in ${userProfile.department}`,
        courses: [
          {
            id: '1',
            title: 'Introduction to Professional Skills',
            description: 'Learn the fundamentals of professional development',
            estimatedHours: 10
          },
          {
            id: '2',
            title: `${userProfile.department} Fundamentals`,
            description: `Core concepts for ${userProfile.department} professionals`,
            estimatedHours: 15
          },
          {
            id: '3',
            title: `Advanced ${userProfile.role} Skills`,
            description: `Specialized skills for ${userProfile.role} positions`,
            estimatedHours: 20
          }
        ],
        estimatedCompletionTime: '45 hours',
        skillsAddressed: [...userProfile.skills, 'communication', 'problem-solving'],
        generatedBy: 'AI Learning Path Designer'
      };
      
      // TODO: Replace with actual AI agent call when integrated
      return {
        success: true,
        data: {
          learningPath: defaultPath,
          userId: userProfile.userId
        }
      };
    } catch (error: any) {
      console.error('Error generating learning path:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate learning path'
      };
    }
  }
  
  /**
   * Determine RAG (Red-Amber-Green) status for a learner's course enrollment
   * This helps identify learners who may need intervention
   */
  async determineRAGStatus(params: {
    enrollmentId: string;
    userId: string;
    courseId: string;
    currentProgress: number;
    recentActivity: Date | null;
  }): Promise<{ success: boolean; ragStatus: 'red' | 'amber' | 'green'; reasoning: string }> {
    try {
      const { currentProgress, recentActivity } = params;
      
      // Simple RAG determination logic (can be replaced with more sophisticated AI analysis)
      let ragStatus: 'red' | 'amber' | 'green' = 'green';
      let reasoning = '';
      
      // If no activity in the last 14 days, that's concerning
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      if (!recentActivity || recentActivity < twoWeeksAgo) {
        if (currentProgress < 30) {
          ragStatus = 'red';
          reasoning = 'Low progress and no recent activity - learner may have abandoned the course';
        } else {
          ragStatus = 'amber';
          reasoning = 'No recent activity despite previous progress - learner may need re-engagement';
        }
      } else {
        // Recent activity exists
        if (currentProgress < 20) {
          ragStatus = 'amber';
          reasoning = 'Limited progress despite recent activity - learner may be struggling';
        } else if (currentProgress < 10) {
          ragStatus = 'red';
          reasoning = 'Very low progress despite activity - learner may need significant help';
        } else {
          ragStatus = 'green';
          reasoning = 'Satisfactory progress with recent activity - learner is on track';
        }
      }
      
      return {
        success: true,
        ragStatus,
        reasoning
      };
    } catch (error: any) {
      console.error('Error determining RAG status:', error);
      return {
        success: false,
        ragStatus: 'amber', // Default to amber when there's an error - indicates attention needed
        reasoning: `Error determining status: ${error.message}`
      };
    }
  }
  
  /**
   * Suggest interventions for learners who need support
   * This provides actionable recommendations for HR or managers
   */
  async suggestInterventions(params: {
    userId: string;
    enrollmentId: string;
    courseId: string;
    ragStatus: string;
    progress: number;
    lastActivity: Date | null;
  }): Promise<{ 
    success: boolean; 
    interventions?: Array<{
      type: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    error?: string;
  }> {
    try {
      const { ragStatus, progress, lastActivity } = params;
      const interventions = [];
      
      // Generate different interventions based on RAG status and other factors
      if (ragStatus === 'red') {
        interventions.push({
          type: 'direct_contact',
          description: 'Schedule a one-on-one meeting to discuss learning challenges',
          priority: 'high'
        });
        
        interventions.push({
          type: 'course_adjustment',
          description: 'Consider reassigning to a more appropriate course or providing prerequisites',
          priority: 'medium'
        });
      } else if (ragStatus === 'amber') {
        interventions.push({
          type: 'check_in',
          description: 'Send a supportive email checking on progress and offering assistance',
          priority: 'medium'
        });
        
        // If progress is low but there is recent activity
        if (progress < 30 && lastActivity) {
          const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceActivity < 7) {
            interventions.push({
              type: 'additional_resources',
              description: 'Provide supplementary learning materials for the current module',
              priority: 'medium'
            });
          }
        }
      } else {
        // Green status - still can provide enhancement interventions
        interventions.push({
          type: 'positive_reinforcement',
          description: 'Acknowledge good progress and encourage continued engagement',
          priority: 'low'
        });
        
        if (progress > 75) {
          interventions.push({
            type: 'next_steps',
            description: 'Suggest advanced courses to take after completion',
            priority: 'low'
          });
        }
      }
      
      // Always include this for all statuses
      interventions.push({
        type: 'peer_connection',
        description: 'Connect with other learners taking the same course for study groups',
        priority: ragStatus === 'red' ? 'medium' : 'low'
      });
      
      return {
        success: true,
        interventions
      };
    } catch (error: any) {
      console.error('Error suggesting interventions:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate intervention suggestions'
      };
    }
  }
} 