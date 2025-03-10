import { EducatorAgent } from '@/agents/roles/EducatorAgent';

/**
 * Agent Service
 * Provides a centralized way to access and utilize AI agents in the application
 */
export class AgentService {
  private educatorAgent: EducatorAgent;
  
  constructor() {
    this.educatorAgent = new EducatorAgent();
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
      
      // Generate the learning path
      const learningPath = await this.educatorAgent.generateLearningPath(employeeProfile);
      
      // Transform the agent's response into a consistent format
      return {
        success: true,
        data: {
          name: learningPath.name || `${userProfile.role} Development Path`,
          description: learningPath.description || `Custom learning path for ${userProfile.role} in ${userProfile.department}`,
          courses: learningPath.modules.flatMap(module => 
            module.resources.map(resource => ({
              title: resource.title,
              description: resource.description,
              duration: resource.duration || 60, // Default to 60 minutes if not specified
              skills: resource.skills || [],
              sections: 10, // Default value
              matchScore: resource.matchScore || 85 // Default match score
            }))
          )
        }
      };
    } catch (error) {
      console.error('Error generating learning path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate learning path'
      };
    }
  }
  
  /**
   * Determine the RAG status for a course based on current progress
   */
  async determineRAGStatus(
    userId: string,
    courseProgress: number,
    previousStatus: 'red' | 'amber' | 'green',
    metadata: any
  ): Promise<{ 
    success: boolean; 
    data?: { 
      status: 'red' | 'amber' | 'green';
      reason: string;
    };
    error?: string 
  }> {
    try {
      // Simple rules-based logic for now - this could be enhanced with ML/AI
      let newStatus: 'red' | 'amber' | 'green';
      let reason: string;
      
      if (courseProgress < 25) {
        newStatus = 'red';
        reason = 'Progress is significantly behind schedule';
      } else if (courseProgress < 60) {
        newStatus = 'amber';
        reason = 'Progress is slightly behind schedule';
      } else {
        newStatus = 'green';
        reason = 'Progress is on track or ahead of schedule';
      }
      
      return {
        success: true,
        data: {
          status: newStatus,
          reason
        }
      };
    } catch (error) {
      console.error('Error determining RAG status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to determine RAG status'
      };
    }
  }
} 