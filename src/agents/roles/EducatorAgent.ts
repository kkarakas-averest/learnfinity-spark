/**
 * Educator Agent
 * 
 * Responsible for generating educational content recommendations,
 * adapting learning paths, and providing pedagogical expertise.
 */

import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig } from '../types';
import { RAGStatus } from '@/types/hr.types';

export interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'exercise' | 'course';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  duration: number; // in minutes
  description: string;
  url?: string;
}

export interface LearningPathAdjustment {
  employeeId: string;
  adjustmentType: 'add' | 'remove' | 'replace' | 'reorder';
  resources: LearningResource[];
  reason: string;
}

export class EducatorAgent extends BaseAgent {
  private resourceLibrary: LearningResource[] = [];
  
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Educator Agent",
      role: "Learning Path Designer",
      goal: "Create personalized and adaptive learning experiences",
      backstory: "You specialize in educational science and curriculum design, with expertise in adapting content to individual needs.",
      ...config
    });
  }
  
  /**
   * Process incoming messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    // Simple message processing for now
    const responseContent = `I've reviewed the learning requirements: "${message.content.substring(0, 50)}..." and am preparing recommendations.`;
    
    return {
      id: message.id + "_response",
      from: this.id,
      to: message.from,
      content: responseContent,
      timestamp: new Date()
    };
  }
  
  /**
   * Process tasks related to learning path creation/adjustment
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'generate_learning_path':
        return this.generateLearningPath(task.data.employeeProfile, task.data.courseLibrary);
        
      case 'recommend_resources':
        return this.recommendResources(
          task.data.employeeId, 
          task.data.currentStatus, 
          task.data.topics, 
          task.data.count || 3
        );
        
      case 'adapt_content':
        return this.adaptContent(
          task.data.employeeId, 
          task.data.contentId, 
          task.data.learnerData
        );
        
      case 'suggest_intervention':
        return this.suggestIntervention(
          task.data.employeeId, 
          task.data.ragStatus, 
          task.data.learningHistory
        );
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Initialize the agent with resource library
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    try {
      await super.initialize();
      
      // Load mock resource library for now
      // In a real implementation, this would come from a database
      this.resourceLibrary = this.getMockResourceLibrary();
      
      return { 
        success: true, 
        message: `${this.config.name} initialized with ${this.resourceLibrary.length} resources` 
      };
    } catch (error) {
      console.error(`Error initializing ${this.config.name}:`, error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : `Unknown error initializing ${this.config.name}`
      };
    }
  }
  
  /**
   * Generate a complete learning path for an employee
   */
  async generateLearningPath(employeeProfile: any, courseLibrary?: any[]): Promise<any> {
    // Use our internal library if no external one is provided
    const library = courseLibrary || this.resourceLibrary;
    
    // Extract relevant information from the profile
    const { 
      role = '',
      department = '',
      skills = [],
      interests = [],
      learningStyle = 'visual',
      currentLevel = 'beginner'
    } = employeeProfile;
    
    // Filter resources based on employee's level and role
    const relevantResources = library.filter(resource => {
      // Match difficulty to current level
      const levelMatch = 
        (currentLevel === 'beginner' && resource.difficulty === 'beginner') ||
        (currentLevel === 'intermediate' && ['beginner', 'intermediate'].includes(resource.difficulty)) ||
        (currentLevel === 'advanced');
      
      // Check if any topics match the employee's skills or interests
      const topicMatch = resource.topics.some(topic => 
        skills.includes(topic) || 
        interests.includes(topic) ||
        topic.toLowerCase().includes(role.toLowerCase()) ||
        topic.toLowerCase().includes(department.toLowerCase())
      );
      
      return levelMatch && topicMatch;
    });
    
    // Organize into a structured learning path
    // Start with fundamentals, then advanced topics
    const sortedResources = [...relevantResources].sort((a, b) => {
      // Sort by difficulty first
      const difficultyOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
      const diffDiff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      if (diffDiff !== 0) return diffDiff;
      
      // Then by type (put courses first, quizzes last)
      const typeOrder = { 'course': 0, 'video': 1, 'article': 2, 'exercise': 3, 'quiz': 4 };
      return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    });
    
    // Create learning path with modules
    const learningPath = {
      employeeId: employeeProfile.id,
      name: `${role} Development Path`,
      description: `Personalized learning path for ${role} in ${department}`,
      createdAt: new Date().toISOString(),
      estimatedDuration: sortedResources.reduce((acc, res) => acc + res.duration, 0),
      modules: this.groupIntoModules(sortedResources, employeeProfile)
    };
    
    return learningPath;
  }
  
  /**
   * Recommend learning resources based on current status
   */
  async recommendResources(
    employeeId: string,
    currentStatus: RAGStatus,
    topics: string[],
    count: number = 3
  ): Promise<LearningResource[]> {
    // Filter resources by the requested topics
    const topicResources = this.resourceLibrary.filter(resource => 
      resource.topics.some(topic => topics.includes(topic))
    );
    
    // Adjust recommendations based on RAG status
    let recommendations: LearningResource[] = [];
    
    switch (currentStatus) {
      case 'red':
        // For red status, recommend beginner content and shorter items
        recommendations = topicResources
          .filter(r => r.difficulty === 'beginner' && r.duration <= 30)
          .sort((a, b) => a.duration - b.duration);
        break;
        
      case 'amber':
        // For amber status, mix of beginner and intermediate, prioritize engaging types
        recommendations = topicResources
          .filter(r => ['beginner', 'intermediate'].includes(r.difficulty))
          .sort((a, b) => {
            // Prioritize videos and exercises over articles for engagement
            const typeScore = (type: string) => {
              switch (type) {
                case 'video': return 0;
                case 'exercise': return 1;
                case 'quiz': return 2;
                case 'article': return 3;
                case 'course': return 4;
                default: return 5;
              }
            };
            return typeScore(a.type) - typeScore(b.type);
          });
        break;
        
      case 'green':
        // For green status, can include advanced content, prioritize by relevance
        recommendations = topicResources
          .sort((a, b) => {
            // Prioritize more advanced content for green status
            const difficultyScore = (diff: string) => {
              switch (diff) {
                case 'advanced': return 0;
                case 'intermediate': return 1;
                case 'beginner': return 2;
                default: return 3;
              }
            };
            return difficultyScore(a.difficulty) - difficultyScore(b.difficulty);
          });
        break;
        
      default:
        // Fallback to a balanced mix
        recommendations = [...topicResources];
    }
    
    // Return the top N recommendations
    return recommendations.slice(0, count);
  }
  
  /**
   * Adapt content for a specific learner
   */
  async adaptContent(
    employeeId: string,
    contentId: string,
    learnerData: any
  ): Promise<any> {
    // Find the original content
    const content = this.resourceLibrary.find(r => r.id === contentId);
    
    if (!content) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    // Basic adaptations based on learner preferences
    const adaptations = {
      original: content,
      adapted: {
        ...content,
        title: content.title, // Keep the same title
        difficulty: this.adaptDifficulty(content.difficulty, learnerData),
        duration: this.adaptDuration(content.duration, learnerData),
        supplementaryMaterials: this.getSupplementaryMaterials(content, learnerData),
        format: this.adaptFormat(content.type, learnerData.learningStyle)
      },
      adaptationReason: `Content adapted to match ${learnerData.learningStyle} learning style and ${learnerData.currentLevel} proficiency level.`
    };
    
    return adaptations;
  }
  
  /**
   * Suggest intervention for an employee based on RAG status
   */
  async suggestIntervention(
    employeeId: string,
    ragStatus: RAGStatus,
    learningHistory: any
  ): Promise<any> {
    // Different intervention strategies based on RAG status
    switch (ragStatus) {
      case 'red':
        return {
          type: 'high_priority',
          actions: [
            {
              type: 'learning_path_adjustment',
              description: 'Simplify immediate learning path',
              details: 'Break down current module into smaller components with more frequent check-ins'
            },
            {
              type: 'manager_meeting',
              description: 'Schedule meeting with manager',
              details: 'Discuss blockers and provide additional support'
            },
            {
              type: 'alternative_content',
              description: 'Provide alternative learning formats',
              resources: this.recommendAlternativeFormats(learningHistory, 2)
            }
          ],
          message: "This employee is significantly behind and requires immediate intervention to get back on track."
        };
        
      case 'amber':
        return {
          type: 'medium_priority',
          actions: [
            {
              type: 'check_in',
              description: 'Conduct informal check-in',
              details: 'Discuss any challenges and offer assistance'
            },
            {
              type: 'deadline_extension',
              description: 'Consider extending upcoming deadlines',
              details: 'Provide additional time for current modules if needed'
            },
            {
              type: 'supplementary_resources',
              description: 'Offer supplementary learning resources',
              resources: this.recommendSupplementaryResources(learningHistory, 2)
            }
          ],
          message: "This employee is showing signs of falling behind. Proactive intervention now can prevent further disengagement."
        };
        
      case 'green':
        return {
          type: 'low_priority',
          actions: [
            {
              type: 'positive_reinforcement',
              description: 'Provide positive feedback',
              details: 'Acknowledge good progress and encourage continued engagement'
            },
            {
              type: 'advanced_content',
              description: 'Offer advanced content options',
              resources: this.recommendAdvancedResources(learningHistory, 2)
            }
          ],
          message: "This employee is performing well. Consider offering additional challenges to maintain engagement."
        };
        
      default:
        return {
          type: 'unknown',
          actions: [
            {
              type: 'assessment',
              description: 'Conduct learning assessment',
              details: 'Evaluate current status and learning preferences'
            }
          ],
          message: "Unable to determine appropriate intervention without status information."
        };
    }
  }
  
  // Helper methods
  
  /**
   * Group resources into logical modules
   */
  private groupIntoModules(resources: LearningResource[], profile: any): any[] {
    const modules = [];
    const moduleSize = 3; // Number of resources per module
    
    // Group by difficulty level first
    const difficultyGroups: Record<string, LearningResource[]> = {
      'beginner': [],
      'intermediate': [],
      'advanced': []
    };
    
    resources.forEach(resource => {
      difficultyGroups[resource.difficulty].push(resource);
    });
    
    // Create modules for each difficulty level
    Object.entries(difficultyGroups).forEach(([difficulty, diffResources]) => {
      // Skip empty levels
      if (diffResources.length === 0) return;
      
      // Create chunks of resources for modules
      for (let i = 0; i < diffResources.length; i += moduleSize) {
        const moduleResources = diffResources.slice(i, i + moduleSize);
        const moduleTopics = new Set<string>();
        
        moduleResources.forEach(resource => {
          resource.topics.forEach(topic => moduleTopics.add(topic));
        });
        
        modules.push({
          name: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - ${Array.from(moduleTopics)[0] || 'General'} Module`,
          difficulty,
          resources: moduleResources,
          estimatedDuration: moduleResources.reduce((sum, r) => sum + r.duration, 0),
          topics: Array.from(moduleTopics)
        });
      }
    });
    
    return modules;
  }
  
  /**
   * Adapt content difficulty based on learner data
   */
  private adaptDifficulty(originalDifficulty: string, learnerData: any): string {
    const currentLevel = learnerData.currentLevel || 'beginner';
    
    // Adjust difficulty based on learner's level
    if (currentLevel === 'beginner' && originalDifficulty !== 'beginner') {
      return 'beginner'; // Simplify content for beginners
    }
    
    if (currentLevel === 'advanced' && originalDifficulty === 'beginner') {
      return 'intermediate'; // Make it more challenging for advanced learners
    }
    
    return originalDifficulty; // Keep original difficulty in other cases
  }
  
  /**
   * Adapt content duration based on learner data
   */
  private adaptDuration(originalDuration: number, learnerData: any): number {
    const attentionSpan = learnerData.attentionSpan || 'medium';
    
    // Adjust duration based on attention span
    switch (attentionSpan) {
      case 'short':
        return Math.min(originalDuration, 15); // Cap at 15 minutes
      case 'medium':
        return Math.min(originalDuration, 30); // Cap at 30 minutes
      case 'long':
        return originalDuration; // Keep original duration
      default:
        return originalDuration;
    }
  }
  
  /**
   * Get supplementary materials based on content and learner data
   */
  private getSupplementaryMaterials(content: LearningResource, learnerData: any): any[] {
    // Find resources on the same topics
    return this.resourceLibrary
      .filter(r => 
        r.id !== content.id && // Not the same resource
        r.topics.some(topic => content.topics.includes(topic)) && // Related topics
        r.type !== content.type // Different format
      )
      .slice(0, 2) // Limit to 2 supplementary resources
      .map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        duration: r.duration
      }));
  }
  
  /**
   * Adapt content format based on learning style
   */
  private adaptFormat(originalType: string, learningStyle: string): string {
    // Map learning styles to preferred content types
    const styleToTypeMap: Record<string, string> = {
      'visual': 'video',
      'auditory': 'video', // Videos have audio
      'reading': 'article',
      'kinesthetic': 'exercise'
    };
    
    // Return the preferred type for the learning style, or the original if not found
    return styleToTypeMap[learningStyle] || originalType;
  }
  
  /**
   * Recommend alternative formats for the same topics
   */
  private recommendAlternativeFormats(learningHistory: any, count: number): LearningResource[] {
    // Extract topics from recent learning activities
    const recentTopics = (learningHistory.recentActivities || [])
      .flatMap((activity: any) => activity.topics || []);
    
    // Find resources on the same topics but in different formats
    const recentFormats = new Set(
      (learningHistory.recentActivities || []).map((a: any) => a.contentType)
    );
    
    return this.resourceLibrary
      .filter(resource => 
        // Match topics
        resource.topics.some(topic => recentTopics.includes(topic)) &&
        // Different format than recent ones
        !recentFormats.has(resource.type) &&
        // Prefer shorter content
        resource.duration <= 20
      )
      .slice(0, count);
  }
  
  /**
   * Recommend supplementary resources
   */
  private recommendSupplementaryResources(learningHistory: any, count: number): LearningResource[] {
    const currentTopics = new Set(
      (learningHistory.currentModule?.topics || [])
    );
    
    return this.resourceLibrary
      .filter(resource => 
        // Match current module topics
        resource.topics.some(topic => currentTopics.has(topic)) &&
        // Beginner or intermediate difficulty
        ['beginner', 'intermediate'].includes(resource.difficulty) &&
        // Prefer engaging formats
        ['video', 'exercise'].includes(resource.type)
      )
      .slice(0, count);
  }
  
  /**
   * Recommend advanced resources
   */
  private recommendAdvancedResources(learningHistory: any, count: number): LearningResource[] {
    // Get topics the learner is interested in
    const interestTopics = new Set(
      [...(learningHistory.completedModules || [])
        .flatMap((m: any) => m.topics || []),
       ...(learningHistory.interests || [])]
    );
    
    return this.resourceLibrary
      .filter(resource => 
        // Match interest topics
        resource.topics.some(topic => interestTopics.has(topic)) &&
        // Advanced difficulty
        resource.difficulty === 'advanced'
      )
      .slice(0, count);
  }
  
  /**
   * Get mock learning resources
   */
  private getMockResourceLibrary(): LearningResource[] {
    return [
      {
        id: "1",
        title: "Introduction to JavaScript",
        type: "course",
        difficulty: "beginner",
        topics: ["javascript", "web development", "programming"],
        duration: 120,
        description: "Learn the basics of JavaScript programming"
      },
      {
        id: "2",
        title: "Advanced React Concepts",
        type: "video",
        difficulty: "advanced",
        topics: ["react", "javascript", "web development"],
        duration: 45,
        description: "Deep dive into React hooks, context, and performance optimization"
      },
      {
        id: "3",
        title: "Python for Data Analysis",
        type: "course",
        difficulty: "intermediate",
        topics: ["python", "data science", "analytics"],
        duration: 180,
        description: "Learn how to analyze data using Python libraries"
      },
      {
        id: "4",
        title: "SQL Fundamentals",
        type: "article",
        difficulty: "beginner",
        topics: ["database", "sql", "data"],
        duration: 30,
        description: "Basic SQL queries and database concepts"
      },
      {
        id: "5",
        title: "Machine Learning Basics",
        type: "video",
        difficulty: "intermediate",
        topics: ["machine learning", "ai", "data science"],
        duration: 60,
        description: "Introduction to machine learning concepts"
      },
      {
        id: "6",
        title: "Project Management Best Practices",
        type: "course",
        difficulty: "intermediate",
        topics: ["project management", "leadership", "agile"],
        duration: 150,
        description: "Learn effective project management techniques"
      },
      {
        id: "7",
        title: "Communication Skills for Managers",
        type: "video",
        difficulty: "beginner",
        topics: ["communication", "management", "leadership"],
        duration: 40,
        description: "Improve your communication as a manager"
      },
      {
        id: "8",
        title: "Advanced Excel for Business",
        type: "exercise",
        difficulty: "advanced",
        topics: ["excel", "data analysis", "business"],
        duration: 90,
        description: "Master advanced Excel functions and data analysis"
      },
      {
        id: "9",
        title: "Cybersecurity Fundamentals",
        type: "quiz",
        difficulty: "beginner",
        topics: ["security", "it", "technology"],
        duration: 20,
        description: "Test your knowledge of basic cybersecurity principles"
      },
      {
        id: "10",
        title: "Cloud Architecture Patterns",
        type: "article",
        difficulty: "advanced",
        topics: ["cloud", "architecture", "technology"],
        duration: 25,
        description: "Best practices for cloud architecture design"
      }
    ];
  }
} 