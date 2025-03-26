import { BaseAgent } from './BaseAgent';
import type { EmployeeProfile, LearningPath } from '@/types/hr.types';
import { LLMService } from '@/lib/llm/llm-service';

export class PersonalizationAgent extends BaseAgent {
  private llmService: LLMService;

  constructor() {
    super({
      name: 'PersonalizationAgent',
      role: 'AI Agent for Personalization',
      goal: 'Create personalized employee profiles and learning paths',
      backstory: 'An AI agent specialized in analyzing employee data and creating tailored learning paths'
    });
    this.llmService = LLMService.getInstance();
  }

  /**
   * Creates an AI-enhanced employee profile based on initial data
   */
  public async createEmployeeProfile(profile: EmployeeProfile): Promise<EmployeeProfile> {
    try {
      this.log('Creating employee profile for', profile.name);
      
      // In a full implementation, this would send the profile to the LLM 
      // and receive back an enhanced profile with additional insights
      // For now, we'll just simulate this by returning the profile with some default values
      
      const enhancedProfile: EmployeeProfile = {
        ...profile,
        skills: [...profile.skills, 'communication', 'problem solving'],
        experience: {
          ...profile.experience,
          level: profile.experience.level || 'junior'
        },
        learningPreferences: {
          ...profile.learningPreferences,
          preferredLearningStyle: profile.learningPreferences?.preferredLearningStyle || 'visual',
          preferredContentTypes: profile.learningPreferences?.preferredContentTypes || ['video', 'interactive'],
          learningGoals: profile.learningPreferences?.learningGoals || ['skill improvement', 'career growth']
        }
      };
      
      return enhancedProfile;
    } catch (error) {
      this.logError('Error creating employee profile:', error);
      // If there's an error, return the original profile
      return profile;
    }
  }

  /**
   * Generates a personalized learning path based on the employee profile
   */
  public async generateLearningPath(profile: EmployeeProfile): Promise<LearningPath> {
    try {
      this.log('Generating learning path for', profile.name);
      
      // This would normally call the LLM to generate a customized learning path
      const learningPath: LearningPath = {
        id: `lp-${Date.now()}`,
        title: `${profile.role} Development Path`,
        description: `A personalized learning path for ${profile.name} to develop skills as a ${profile.role}`,
        duration: '12 weeks',
        objectives: ['Master key concepts', 'Develop practical skills', 'Build portfolio projects'],
        modules: [
          {
            id: `module-1-${Date.now()}`,
            title: 'Fundamentals',
            description: 'Core concepts and foundational knowledge',
            duration: '2 weeks',
            content: [],
            assessments: []
          },
          {
            id: `module-2-${Date.now()}`,
            title: 'Intermediate Skills',
            description: 'Building on the fundamentals',
            duration: '4 weeks',
            content: [],
            assessments: []
          },
          {
            id: `module-3-${Date.now()}`,
            title: 'Advanced Applications',
            description: 'Applying skills to real-world scenarios',
            duration: '6 weeks',
            content: [],
            assessments: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published',
        difficulty: 'intermediate',
        category: profile.department,
        author: 'Learnfinity AI'
      };
      
      return learningPath;
    } catch (error) {
      this.logError('Error generating learning path:', error);
      throw new Error(`Failed to generate learning path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Suggests learning interventions based on employee status
   */
  public async suggestIntervention(
    employeeId: string,
    ragStatus: 'green' | 'amber' | 'red',
    learningHistory: any
  ): Promise<{
    type: 'high_priority' | 'medium_priority' | 'low_priority' | 'unknown';
    actions: Array<{
      type: string;
      description: string;
      details?: string;
      resources?: any[];
    }>;
    message: string;
  }> {
    try {
      this.log('Suggesting intervention for', employeeId, 'with status', ragStatus);
      
      // Map RAG status to priority
      const priorityMap = {
        red: 'high_priority',
        amber: 'medium_priority',
        green: 'low_priority'
      } as const;
      
      // This would normally call the LLM to generate personalized interventions
      return {
        type: priorityMap[ragStatus] || 'unknown',
        actions: [
          {
            type: 'schedule_meeting',
            description: 'Schedule a check-in meeting with the employee',
            details: 'Discuss current progress and identify any challenges'
          },
          {
            type: 'provide_resources',
            description: 'Provide additional learning resources',
            resources: [
              { id: 'res-1', name: 'Video tutorial', url: 'https://example.com/tutorial' },
              { id: 'res-2', name: 'Practice exercises', url: 'https://example.com/exercises' }
            ]
          }
        ],
        message: `Based on the employee's learning history and RAG status of ${ragStatus}, we recommend a ${priorityMap[ragStatus]} intervention.`
      };
    } catch (error) {
      this.logError('Error suggesting intervention:', error);
      throw new Error(`Failed to suggest intervention: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 