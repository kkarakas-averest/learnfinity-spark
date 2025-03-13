/**
 * Educator Agent
 * 
 * Responsible for generating educational content recommendations,
 * adapting learning paths, and providing pedagogical expertise.
 */

import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig, ContentCreatorAgent, ContentGenerationRequest, GeneratedContent, GeneratedQuiz, LearnerProfile, PersonalizationParams } from '../types';
import { RAGStatus } from '@/types/hr.types';
import { ContentType, DifficultyLevel } from '@/types/course.types';
import { LLMService } from '@/lib/llm/llm-service';
import { v4 as uuidv4 } from 'uuid';

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

export class EducatorAgent extends BaseAgent implements ContentCreatorAgent {
  private resourceLibrary: LearningResource[] = [];
  private llmService: LLMService;
  private useLLM: boolean;
  
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Educator Agent",
      role: "Learning Path Designer",
      goal: "Create personalized and adaptive learning experiences",
      backstory: "You specialize in educational science and curriculum design, with expertise in adapting content to individual needs.",
      ...config
    });
    
    // Initialize LLM service
    this.llmService = LLMService.getInstance({
      debugMode: process.env.NODE_ENV === 'development'
    });

    // Check if we have a configured LLM
    this.useLLM = this.llmService.isConfigured();
    if (!this.useLLM && process.env.NODE_ENV === 'development') {
      console.warn('EducatorAgent: LLM not configured, using rule-based approach');
    }
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
   * Adapt existing content to meet a user's needs
   * Implementation for ContentCreatorAgent interface
   */
  async adaptContent(
    contentId: string, 
    learnerData: any
  ): Promise<any> {
    if (!contentId || !learnerData) {
      throw new Error('Missing required parameters');
    }
    
    // Convert learnerData to our LearnerProfile format
    const learnerProfile: LearnerProfile = {
      id: learnerData.id || 'unknown',
      name: learnerData.name || 'Anonymous Learner',
      role: learnerData.role || '',
      department: learnerData.department || '',
      skills: learnerData.skills || [],
      interests: learnerData.interests || [],
      learningStyle: this.mapLearningStyle(learnerData.preferredLearningStyle),
      experienceLevel: this.mapExperienceLevel(learnerData.experienceLevel),
      completedCourses: learnerData.completedCourses || [],
      engagementMetrics: learnerData.metrics || {}
    };
    
    // Create personalization parameters
    const params: PersonalizationParams = {
      learnerProfile,
      originalContentId: contentId,
      adaptationType: this.determineAdaptationType(learnerProfile, contentId),
      targetLevel: this.determineTargetLevel(learnerProfile, contentId),
      focusAreas: learnerData.focusAreas || []
    };
    
    return this.personalizeContent(params);
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

  /**
   * Generate remediation content for a specific learning gap
   */
  async generateRemediationContent(
    learningGap: string, 
    learnerPreferences: any
  ): Promise<any> {
    if (!this.useLLM) {
      return this.generateMockRemediationContent(learningGap, learnerPreferences);
    }

    const prompt = `
      As an educational content creator, generate remediation content to address the following learning gap:
      "${learningGap}"

      Learner preferences and background:
      ${JSON.stringify(learnerPreferences, null, 2)}

      Create content that:
      1. Addresses the specific gap identified
      2. Is tailored to the learner's preferences and background
      3. Includes practical examples and exercises
      4. Provides clear explanations of concepts
      5. Includes suggestions for further learning

      Format the output as markdown.
    `;

    try {
      const content = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 2000
      });

      return {
        id: uuidv4(),
        title: `Remediation for ${learningGap}`,
        content,
        contentType: this.determineContentType(learnerPreferences),
        format: 'markdown',
        createdAt: new Date(),
        metadata: {
          targetGap: learningGap,
          generationPrompt: prompt
        }
      };
    } catch (error) {
      console.error('Error generating remediation content:', error);
      return this.generateMockRemediationContent(learningGap, learnerPreferences);
    }
  }

  /**
   * Generate content based on a specific request
   */
  async generateContentForRequest(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (!this.useLLM) {
      return this.generateMockContent(request);
    }

    const prompt = `
      As an educational content creator, generate learning content with the following specifications:

      Content Type: ${request.contentType}
      Topic: ${request.topic}
      Target Audience:
        Roles: ${request.targetAudience.roles?.join(', ') || 'Any'}
        Departments: ${request.targetAudience.departments?.join(', ') || 'Any'}
        Skill Level: ${request.targetAudience.skillLevel}

      Learning Objectives:
      ${request.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

      ${request.keywords?.length ? `Keywords: ${request.keywords.join(', ')}` : ''}
      ${request.tone ? `Tone: ${request.tone}` : ''}
      ${request.contentLength ? `Content Length: ${request.contentLength}` : ''}
      ${request.includeExamples ? 'Please include practical examples.' : ''}

      ${request.includeQuizQuestions ? 'Include 3-5 quiz questions at the end with answers and explanations.' : ''}

      Format the content using markdown, with appropriate headings, bullet points, code blocks, and other formatting as needed.
      Include a title for the content at the top.
    `;

    try {
      const generatedText = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 4000
      });

      // Extract title from the generated content (first line)
      const contentLines = generatedText.trim().split('\n');
      const title = contentLines[0].replace(/^#\s*/, '').trim();
      const content = contentLines.slice(1).join('\n').trim();

      // Generate quiz if requested
      let quiz: GeneratedQuiz | undefined;
      if (request.includeQuizQuestions) {
        quiz = await this.extractQuizFromContent(content) || 
               await this.generateQuiz(request.topic, request.targetAudience.skillLevel, 3);
      }

      const response: GeneratedContent = {
        id: uuidv4(),
        originalRequest: request,
        title,
        content,
        contentType: request.contentType,
        format: 'markdown',
        metadata: {
          generatedAt: new Date(),
          model: "llm-model", // Simplify to avoid getModel() error
          version: '1.0',
          tokensUsed: this.estimateTokenCount(prompt) + this.estimateTokenCount(generatedText),
          generationParams: {
            temperature: 0.7,
            contentLength: request.contentLength || 'standard'
          }
        },
        suggestedNextSteps: await this.generateNextSteps(request.topic, content),
        relatedTopics: await this.identifyRelatedTopics(request.topic, content),
        quiz,
        summary: await this.generateSummary(content)
      };

      return response;
    } catch (error) {
      console.error('Error generating content:', error);
      return this.generateMockContent(request);
    }
  }

  /**
   * Personalize content for a specific learner
   */
  async personalizeContent(params: PersonalizationParams): Promise<GeneratedContent> {
    if (!this.useLLM) {
      return this.generateMockPersonalizedContent(params);
    }

    // Fetch the original content first
    const originalContent = await this.fetchContentById(params.originalContentId);
    if (!originalContent) {
      throw new Error(`Content with ID ${params.originalContentId} not found`);
    }

    const prompt = `
      As an educational content personalizer, adapt the following content to suit the learner's profile and adaptation requirements.

      Original Content:
      ${originalContent.content}

      Learner Profile:
      ${JSON.stringify(params.learnerProfile, null, 2)}

      Adaptation Type: ${params.adaptationType}
      ${params.targetLevel ? `Target Difficulty Level: ${params.targetLevel}` : ''}
      ${params.focusAreas?.length ? `Focus Areas: ${params.focusAreas.join(', ')}` : ''}
      ${params.preserveStructure ? 'Preserve the original structure of the content.' : 'You may restructure the content as needed.'}

      Adaptation Guidelines:
      - For 'simplify', reduce complexity and use more basic language and concepts
      - For 'elaborate', add more details, examples, and explanations
      - For 'restyle', adapt to the learner's preferred learning style (${params.learnerProfile.learningStyle})
      - For 'supplement', add additional information focused on the learner's interests and goals

      Format the content using markdown, preserving appropriate headings, bullet points, code blocks, and other formatting.
      Include a title for the adapted content at the top.
    `;

    try {
      const generatedText = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 4000
      });

      // Extract title from the generated content (first line)
      const contentLines = generatedText.trim().split('\n');
      const title = contentLines[0].replace(/^#\s*/, '').trim();
      const content = contentLines.slice(1).join('\n').trim();

      const response: GeneratedContent = {
        id: uuidv4(),
        originalRequest: originalContent.originalRequest,
        title,
        content,
        contentType: originalContent.contentType,
        format: 'markdown',
        metadata: {
          generatedAt: new Date(),
          model: "llm-model", // Simplify to avoid getModel() error
          version: '1.0',
          tokensUsed: this.estimateTokenCount(prompt) + this.estimateTokenCount(generatedText),
          generationParams: {
            adaptationType: params.adaptationType,
            targetLevel: params.targetLevel,
            learnerProfile: params.learnerProfile.id
          }
        },
        suggestedNextSteps: originalContent.suggestedNextSteps,
        relatedTopics: originalContent.relatedTopics,
        quiz: originalContent.quiz ? await this.personalizeQuiz(originalContent.quiz, params) : undefined,
        summary: await this.generateSummary(content)
      };

      return response;
    } catch (error) {
      console.error('Error personalizing content:', error);
      return this.generateMockPersonalizedContent(params);
    }
  }

  /**
   * Generate a quiz for a specific topic
   */
  async generateQuiz(
    topic: string, 
    difficultyLevel: DifficultyLevel, 
    questionCount: number = 5
  ): Promise<GeneratedQuiz> {
    if (!this.useLLM) {
      return this.generateMockQuiz(topic, difficultyLevel, questionCount);
    }

    const prompt = `
      As an educational assessment designer, create a quiz on the topic of "${topic}" at a ${difficultyLevel} level.
      
      Generate ${questionCount} questions with the following specifications:
      - Mix of multiple-choice, true-false, and short-answer questions
      - For multiple-choice questions, provide 4 options (labeled A, B, C, D)
      - Include the correct answer for each question
      - Provide a brief explanation for why the answer is correct
      - Ensure questions test different aspects of the topic
      - Vary the difficulty of questions appropriately for the ${difficultyLevel} level

      Format the output as valid JSON matching this structure:
      {
        "questions": [
          {
            "id": "unique-id",
            "type": "multiple-choice",
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B",
            "explanation": "Explanation for why this is the correct answer",
            "difficulty": "${difficultyLevel}"
          },
          ...
        ]
      }

      IMPORTANT: Please provide ONLY valid JSON in your response, with no additional text.
    `;

    try {
      const response = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 2500,
        system: "You are an educational quiz designer. You respond with valid JSON following the specified format."
      });

      // Extract JSON from the response
      let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, response];

      let jsonString = jsonMatch[1] || response;
      
      // Clean up the string - remove potential text before or after JSON
      jsonString = jsonString.trim();
      
      // Find the first '{' and the last '}'
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      
      // Try to parse the JSON
      try {
        const parsedQuiz = JSON.parse(jsonString);
        
        // Validate and fix the quiz structure if needed
        return this.validateAndFixQuiz(parsedQuiz, topic, difficultyLevel, questionCount);
      } catch (parseError) {
        console.error('Error parsing quiz JSON:', parseError);
        // If JSON parsing fails, generate a quiz from scratch
        return this.generateMockQuiz(topic, difficultyLevel, questionCount);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      return this.generateMockQuiz(topic, difficultyLevel, questionCount);
    }
  }

  /**
   * Estimate the number of tokens in a string
   */
  private estimateTokenCount(text: string): number {
    // Simple approximation: about 4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Retrieve content by ID
   */
  private async fetchContentById(contentId: string): Promise<GeneratedContent> {
    try {
      // Import the database client (imported here to avoid circular dependencies)
      const { db } = await import('@/db');
      const { eq } = await import('drizzle-orm');
      const { generatedContents } = await import('@/db/schema');
      
      // Query the database
      const content = await db.query.generatedContents.findFirst({
        where: eq(generatedContents.id, contentId),
      });
      
      if (!content) {
        // Fall back to mock content if not found
        console.warn(`Content with ID ${contentId} not found, returning mock content`);
        return this.createMockContent(contentId);
      }
      
      // Convert database record to GeneratedContent
      return {
        id: content.id,
        originalRequest: content.originalRequest as any,
        title: content.title,
        content: content.content,
        contentType: content.contentType as any,
        format: content.format as 'html' | 'markdown' | 'json' | 'plain',
        metadata: content.metadata as any,
        suggestedNextSteps: content.suggestedNextSteps as string[] || [],
        relatedTopics: content.relatedTopics as string[] || [],
        quiz: content.quiz as any,
        summary: content.summary || undefined
      };
    } catch (error) {
      console.error('Error fetching content from database:', error);
      return this.createMockContent(contentId);
    }
  }
  
  /**
   * Create mock content for fallback
   */
  private createMockContent(contentId: string): GeneratedContent {
    return {
      id: contentId,
      originalRequest: {
        contentType: ContentType.TEXT,
        topic: "Introduction to Learning Frameworks",
        targetAudience: {
          skillLevel: DifficultyLevel.INTERMEDIATE
        },
        learningObjectives: [
          "Understand basic learning frameworks",
          "Apply frameworks to practical situations"
        ]
      },
      title: "Introduction to Learning Frameworks",
      content: "# Introduction to Learning Frameworks\n\nLearning frameworks provide structure to the educational process...",
      contentType: ContentType.TEXT,
      format: 'markdown',
      metadata: {
        generatedAt: new Date(),
        model: "mock-model",
        version: "1.0",
        tokensUsed: 500
      },
      suggestedNextSteps: [],
      relatedTopics: []
    };
  }

  /**
   * Generate a summary of content
   */
  private async generateSummary(content: string): Promise<string> {
    if (!this.useLLM) {
      return "This is a summary of the content.";
    }

    const prompt = `
      Summarize the following educational content in 2-3 sentences:
      
      ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}
    `;

    try {
      return await this.llmService.complete(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      return "This is a summary of the content.";
    }
  }

  /**
   * Extract quiz questions from content
   */
  private async extractQuizFromContent(content: string): Promise<GeneratedQuiz | null> {
    // Look for a quiz section in the content
    const quizSectionMatch = content.match(/#+\s*Quiz[\s\S]*$/i);
    
    if (!quizSectionMatch) {
      return null;
    }

    if (!this.useLLM) {
      return null; // Fall back to generating a new quiz
    }

    const quizSection = quizSectionMatch[0];
    
    const prompt = `
      Extract the quiz questions from the following section and format them as JSON:
      
      ${quizSection}
      
      Format the output as valid JSON matching this structure:
      {
        "questions": [
          {
            "id": "unique-id",
            "type": "multiple-choice",
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B",
            "explanation": "Explanation for why this is the correct answer",
            "difficulty": "intermediate"
          },
          ...
        ]
      }
    `;

    try {
      const response = await this.llmService.complete(prompt, {
        temperature: 0.3,
        maxTokens: 1500
      });

      // Extract and parse JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, response];
      
      const jsonString = jsonMatch[1] || response;
      
      try {
        const parsedQuiz = JSON.parse(jsonString);
        if (parsedQuiz.questions && Array.isArray(parsedQuiz.questions)) {
          return parsedQuiz;
        }
      } catch (e) {
        console.error('Error parsing extracted quiz:', e);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting quiz:', error);
      return null;
    }
  }

  /**
   * Generate next steps based on content
   */
  private async generateNextSteps(topic: string, content: string): Promise<string[]> {
    if (!this.useLLM) {
      return [
        "Review related materials",
        "Practice with exercises",
        "Apply concepts to real-world scenarios"
      ];
    }

    const prompt = `
      Based on the following educational content about "${topic}", suggest 3-5 next steps or follow-up activities for the learner:
      
      ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}
      
      Provide each next step as a brief action item, one per line.
    `;

    try {
      const response = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
    } catch (error) {
      console.error('Error generating next steps:', error);
      return [
        "Review related materials",
        "Practice with exercises",
        "Apply concepts to real-world scenarios"
      ];
    }
  }

  /**
   * Identify related topics
   */
  private async identifyRelatedTopics(topic: string, content: string): Promise<string[]> {
    if (!this.useLLM) {
      return [
        `${topic} fundamentals`,
        `Advanced ${topic}`,
        `${topic} in practice`
      ];
    }

    const prompt = `
      Based on the following educational content about "${topic}", identify 3-5 related topics that would be worth exploring next:
      
      ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}
      
      Provide each related topic as a brief phrase, one per line.
    `;

    try {
      const response = await this.llmService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
    } catch (error) {
      console.error('Error identifying related topics:', error);
      return [
        `${topic} fundamentals`,
        `Advanced ${topic}`,
        `${topic} in practice`
      ];
    }
  }

  /**
   * Personalize a quiz based on learner profile
   */
  private async personalizeQuiz(quiz: GeneratedQuiz, params: PersonalizationParams): Promise<GeneratedQuiz> {
    if (!this.useLLM) {
      return quiz; // Return the original quiz if LLM not available
    }

    // Only adapt quiz if necessary based on adaptation type
    if (params.adaptationType === 'simplify' || params.adaptationType === 'elaborate' || params.targetLevel) {
      const prompt = `
        Adapt the following quiz to make it ${params.adaptationType === 'simplify' ? 'simpler' : 'more detailed'} 
        for a learner with the following profile:
        
        Learning Style: ${params.learnerProfile.learningStyle}
        Experience Level: ${params.learnerProfile.experienceLevel}
        ${params.targetLevel ? `Target Difficulty Level: ${params.targetLevel}` : ''}
        
        Original Quiz:
        ${JSON.stringify(quiz, null, 2)}
        
        Modify the questions while keeping the same structure. You can:
        - Adjust the difficulty
        - Clarify or elaborate on questions
        - Simplify language if needed
        - Add more context to explanations
        - Keep the same number of questions
        
        Return only the valid JSON with the updated quiz.
      `;

      try {
        const response = await this.llmService.complete(prompt, {
          temperature: 0.5,
          maxTokens: 2000
        });
        
        // Extract and parse JSON
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                          response.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, response];
        
        const jsonString = jsonMatch[1] || response;
        
        try {
          const parsedQuiz = JSON.parse(jsonString);
          if (parsedQuiz.questions && Array.isArray(parsedQuiz.questions)) {
            return parsedQuiz;
          }
        } catch (e) {
          console.error('Error parsing personalized quiz:', e);
        }
      } catch (error) {
        console.error('Error personalizing quiz:', error);
      }
    }
    
    return quiz; // Return the original quiz if adaptation failed
  }

  /**
   * Validate and fix a generated quiz
   */
  private validateAndFixQuiz(
    quiz: any, 
    topic: string, 
    difficultyLevel: DifficultyLevel, 
    questionCount: number
  ): GeneratedQuiz {
    // Ensure the quiz has a questions array
    if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
      return this.generateMockQuiz(topic, difficultyLevel, questionCount);
    }
    
    // Fix each question
    const fixedQuestions = quiz.questions.map((q: any, index: number) => {
      return {
        id: q.id || uuidv4(),
        type: this.validateQuestionType(q.type),
        question: q.question || `Question about ${topic}?`,
        options: q.type === 'multiple-choice' ? this.validateOptions(q.options) : undefined,
        correctAnswer: q.correctAnswer || (q.type === 'multiple-choice' ? 0 : 'True'),
        explanation: q.explanation || `Explanation for question ${index + 1}`,
        difficulty: this.validateDifficulty(q.difficulty, difficultyLevel)
      };
    });
    
    // Limit to requested number of questions
    const limitedQuestions = fixedQuestions.slice(0, questionCount);
    
    // Pad with mock questions if needed
    while (limitedQuestions.length < questionCount) {
      limitedQuestions.push(this.generateMockQuestion(topic, difficultyLevel, limitedQuestions.length));
    }
    
    return { questions: limitedQuestions };
  }

  /**
   * Validate question type
   */
  private validateQuestionType(type: string): 'multiple-choice' | 'true-false' | 'short-answer' {
    const validTypes = ['multiple-choice', 'true-false', 'short-answer'];
    return validTypes.includes(type) ? 
      type as 'multiple-choice' | 'true-false' | 'short-answer' : 
      'multiple-choice';
  }

  /**
   * Validate options for multiple-choice questions
   */
  private validateOptions(options: any): string[] {
    if (Array.isArray(options) && options.length >= 2) {
      return options.map(o => String(o));
    }
    return ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  /**
   * Validate difficulty level
   */
  private validateDifficulty(difficulty: string, defaultLevel: DifficultyLevel): DifficultyLevel {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return DifficultyLevel.BEGINNER;
      case 'intermediate':
        return DifficultyLevel.INTERMEDIATE;
      case 'advanced':
        return DifficultyLevel.ADVANCED;
      case 'expert':
        return DifficultyLevel.EXPERT;
      default:
        return defaultLevel;
    }
  }

  /**
   * Generate a mock question
   */
  private generateMockQuestion(
    topic: string, 
    difficultyLevel: DifficultyLevel, 
    index: number
  ): GeneratedQuiz['questions'][0] {
    const types: Array<'multiple-choice' | 'true-false' | 'short-answer'> = [
      'multiple-choice', 'true-false', 'short-answer'
    ];
    
    const type = types[index % types.length];
    
    return {
      id: uuidv4(),
      type,
      question: `Mock question ${index + 1} about ${topic}?`,
      options: type === 'multiple-choice' ? [
        'Option A', 'Option B', 'Option C', 'Option D'
      ] : undefined,
      correctAnswer: type === 'multiple-choice' ? 0 : (type === 'true-false' ? 'True' : 'Answer'),
      explanation: `This is an explanation for question ${index + 1}`,
      difficulty: difficultyLevel
    };
  }

  /**
   * Generate mock remediation content
   */
  private generateMockRemediationContent(learningGap: string, learnerPreferences: any): any {
    return {
      id: uuidv4(),
      title: `Remediation for ${learningGap}`,
      content: `# Remediation Content for ${learningGap}

This is mock remediation content generated for the identified learning gap.

## Key Concepts

1. First concept related to ${learningGap}
2. Second concept related to ${learningGap}
3. Third concept related to ${learningGap}

## Examples

Here are some examples that illustrate the concepts...

## Practice Exercises

Try these exercises to reinforce your understanding...`,
      contentType: this.determineContentType(learnerPreferences),
      format: 'markdown',
      createdAt: new Date(),
      metadata: {
        targetGap: learningGap,
        mockGenerated: true
      }
    };
  }

  /**
   * Generate mock content for a request
   */
  private generateMockContent(request: ContentGenerationRequest): GeneratedContent {
    return {
      id: uuidv4(),
      originalRequest: request,
      title: `Content about ${request.topic}`,
      content: `# ${request.topic}

## Introduction

This is mock content about ${request.topic} generated for ${request.targetAudience.skillLevel} level learners.

## Key Concepts

1. First concept related to ${request.topic}
2. Second concept related to ${request.topic}
3. Third concept related to ${request.topic}

## Examples

Here are some examples that illustrate the concepts...

## Summary

In conclusion, ${request.topic} involves several important principles...`,
      contentType: request.contentType,
      format: 'markdown',
      metadata: {
        generatedAt: new Date(),
        model: 'mock-model',
        version: '1.0',
        tokensUsed: 500,
        generationParams: {
          mockGenerated: true
        }
      },
      suggestedNextSteps: [
        "Review related materials",
        "Practice with exercises",
        "Apply concepts to real-world scenarios"
      ],
      relatedTopics: [
        `${request.topic} fundamentals`,
        `Advanced ${request.topic}`,
        `${request.topic} in practice`
      ],
      quiz: this.generateMockQuiz(request.topic, request.targetAudience.skillLevel, 3),
      summary: `This is a summary of the content about ${request.topic}.`
    };
  }

  /**
   * Generate mock personalized content
   */
  private generateMockPersonalizedContent(params: PersonalizationParams): GeneratedContent {
    // Create a mock original content directly instead of trying to fetch it
    const mockOriginalContent = {
      id: params.originalContentId,
      originalRequest: {
        contentType: ContentType.TEXT,
        topic: "Mock Topic",
        targetAudience: {
          skillLevel: DifficultyLevel.INTERMEDIATE
        },
        learningObjectives: ["Mock objective"]
      },
      title: "Original Content",
      content: "Original content goes here",
      contentType: ContentType.TEXT,
      format: 'markdown',
      metadata: {
        generatedAt: new Date(),
        model: 'mock-model',
        version: '1.0',
        tokensUsed: 300
      },
      suggestedNextSteps: [],
      relatedTopics: []
    };
    
    return {
      id: uuidv4(),
      originalRequest: mockOriginalContent.originalRequest,
      title: `Personalized content for ${params.learnerProfile.name}`,
      content: `# Personalized Content

This content has been adapted to match your learning style (${params.learnerProfile.learningStyle}) 
and experience level (${params.learnerProfile.experienceLevel}).

## Key Concepts

The content has been ${params.adaptationType}d to better match your needs.

## Examples

Here are some examples that are relevant to your interests in ${params.learnerProfile.interests.join(', ')}...`,
      contentType: mockOriginalContent.contentType,
      format: 'markdown',
      metadata: {
        generatedAt: new Date(),
        model: 'mock-model',
        version: '1.0',
        tokensUsed: 500,
        generationParams: {
          adaptationType: params.adaptationType,
          mockGenerated: true
        }
      },
      suggestedNextSteps: [
        "Review this personalized content",
        "Apply concepts to your specific role",
        "Explore related topics"
      ],
      relatedTopics: params.learnerProfile.interests.slice(0, 3),
      quiz: this.generateMockQuiz("Personalized topic", 
                                 params.targetLevel || DifficultyLevel.INTERMEDIATE, 
                                 3),
      summary: "This is a personalized summary of the content."
    };
  }

  /**
   * Generate a mock quiz
   */
  private generateMockQuiz(
    topic: string, 
    difficultyLevel: DifficultyLevel, 
    questionCount: number
  ): GeneratedQuiz {
    const questions: GeneratedQuiz['questions'] = [];
    
    for (let i = 0; i < questionCount; i++) {
      questions.push(this.generateMockQuestion(topic, difficultyLevel, i));
    }
    
    return { questions };
  }

  /**
   * Determine content type based on learner preferences
   */
  private determineContentType(learnerPreferences: any): ContentType {
    // Map learning style to content type
    const learningStyle = learnerPreferences.learningStyle || 'visual';
    
    switch (learningStyle?.toLowerCase()) {
      case 'visual':
        return ContentType.VIDEO;
      case 'auditory':
        return ContentType.AUDIO;
      case 'reading':
        return ContentType.TEXT;
      case 'kinesthetic':
        return ContentType.INTERACTIVE;
      default:
        return ContentType.TEXT;
    }
  }

  /**
   * Map learning style string to our format
   */
  private mapLearningStyle(style: string): 'visual' | 'auditory' | 'reading' | 'kinesthetic' {
    if (!style) return 'visual';
    
    const styleMap: Record<string, 'visual' | 'auditory' | 'reading' | 'kinesthetic'> = {
      visual: 'visual',
      auditory: 'auditory',
      audio: 'auditory',
      reading: 'reading',
      text: 'reading',
      kinesthetic: 'kinesthetic',
      interactive: 'kinesthetic',
      hands: 'kinesthetic',
      'hands-on': 'kinesthetic'
    };
    
    return styleMap[style.toLowerCase()] || 'visual';
  }

  /**
   * Map experience level string to our format
   */
  private mapExperienceLevel(level: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (!level) return 'beginner';
    
    const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'> = {
      beginner: 'beginner',
      novice: 'beginner',
      basic: 'beginner',
      intermediate: 'intermediate',
      medium: 'intermediate',
      mid: 'intermediate',
      moderate: 'intermediate',
      advanced: 'advanced',
      expert: 'expert',
      master: 'expert',
      proficient: 'expert'
    };
    
    return levelMap[level.toLowerCase()] || 'beginner';
  }

  /**
   * Determine the appropriate adaptation type based on learner profile
   */
  private determineAdaptationType(
    profile: LearnerProfile, 
    contentId: string
  ): 'simplify' | 'elaborate' | 'restyle' | 'supplement' {
    // This would normally have more sophisticated logic
    // based on the content and the learner's profile
    
    if (profile.experienceLevel === 'beginner') {
      return 'simplify';
    } else if (profile.experienceLevel === 'expert') {
      return 'elaborate';
    } else if (profile.learningStyle === 'visual' || profile.learningStyle === 'auditory') {
      return 'restyle';
    } else {
      return 'supplement';
    }
  }

  /**
   * Determine target difficulty level based on learner profile
   */
  private determineTargetLevel(
    profile: LearnerProfile, 
    contentId: string
  ): DifficultyLevel | undefined {
    // Map experience level to difficulty level
    const levelMap: Record<string, DifficultyLevel> = {
      beginner: DifficultyLevel.BEGINNER,
      intermediate: DifficultyLevel.INTERMEDIATE,
      advanced: DifficultyLevel.ADVANCED,
      expert: DifficultyLevel.EXPERT
    };
    
    return levelMap[profile.experienceLevel];
  }
} 