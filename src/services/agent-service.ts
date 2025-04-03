import { 
  ContentGenerationRequest, 
  PersonalizationParams,
  ContentType,
  DifficultyLevel
} from "@/types/ai-content.types";
import { z } from "zod";
import { LLMService } from '@/lib/llm/llm-service';
import envConfig from '@/lib/env-config';

// Simulated agent interfaces to avoid importing problematic files
interface SimulatedAgent {
  id: string;
  name: string;
  role: string;
  initialize: () => Promise<void>;
  processTask: (task: any) => Promise<any>;
}

class SimulatedManagerAgent implements SimulatedAgent {
  id: string;
  name: string;
  role: string;
  
  constructor(config: any) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
  }
  
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
  }
  
  async processTask(task: any): Promise<any> {
    console.log(`[${this.name}] Processing task: ${JSON.stringify(task)}`);
    return { success: true };
  }
  
  async registerAgent(agent: SimulatedAgent): Promise<void> {
    console.log(`[${this.name}] Registering agent: ${agent.name}`);
  }
  
  async submitTask(task: any): Promise<string> {
    const taskId = `task-${Date.now()}`;
    console.log(`[${this.name}] Task submitted: ${taskId}`);
    return taskId;
  }
  
  async getTaskStatus(taskId: string): Promise<string> {
    return "completed";
  }
  
  async getTaskResult(taskId: string): Promise<any> {
    return { success: true, data: { generatedContent: "Simulated content" } };
  }
}

class SimulatedEducatorAgent implements SimulatedAgent {
  id: string;
  name: string;
  role: string;
  private llmService: LLMService | null = null;
  private useGroqLLM: boolean;
  
  constructor(config: any) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.useGroqLLM = envConfig.enableLLM && envConfig.groqApiKey !== null;
  }
  
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
    
    // Initialize LLM service if Groq is available
    if (this.useGroqLLM) {
      try {
        this.llmService = LLMService.getInstance({
          provider: 'groq',
          model: 'llama3-8b-8192',
          debugMode: true
        });
        console.log(`[${this.name}] LLM Service initialized with Groq API`);
      } catch (error) {
        console.error(`[${this.name}] Failed to initialize LLM Service:`, error);
        this.useGroqLLM = false;
      }
    }
  }
  
  async processTask(task: any): Promise<any> {
    console.log(`[${this.name}] Processing task: ${JSON.stringify(task.type || 'unknown')}`);
    
    // If LLM is available, use it for content generation
    if (this.useGroqLLM && this.llmService && task.type === "Content Generation") {
      return await this.generateContentWithLLM(task.data);
    }
    
    // Fallback to simulated response
    return { 
      success: true,
      data: { 
        generatedContent: `Simulated content for ${task.data?.topic || 'unknown topic'}`,
        modules: this.createSimulatedModules(task.data)
      } 
    };
  }
  
  private async generateContentWithLLM(contentRequest: ContentGenerationRequest): Promise<any> {
    try {
      console.log(`[${this.name}] Generating content with Groq LLM for topic: ${contentRequest.topic}`);
      
      // Create a detailed prompt for the LLM
      const prompt = this.createContentGenerationPrompt(contentRequest);
      
      // Get response from LLM
      const response = await this.llmService!.complete(prompt, {
        system: 'You are an expert educational content creator specialized in creating personalized learning materials. Your task is to create comprehensive, engaging, and tailored course content.',
        temperature: 0.7,
        maxTokens: 4000
      });
      
      // Parse the response
      try {
        // The response should be a JSON string
        // First attempt to extract JSON if it's wrapped in other text
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/\{[\s\S]*\}/);
                          
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsedResponse = JSON.parse(jsonString);
        
        return {
          success: true,
          data: parsedResponse
        };
      } catch (error) {
        console.error(`[${this.name}] Error parsing LLM response:`, error);
        // Fallback to simulated content
        return {
          success: true,
          data: {
            generatedContent: `Content for ${contentRequest.topic}`,
            modules: this.createSimulatedModules(contentRequest)
          }
        };
      }
    } catch (error) {
      console.error(`[${this.name}] Error generating content with LLM:`, error);
      return {
        success: false,
        error: `Failed to generate content: ${error}`
      };
    }
  }
  
  private createContentGenerationPrompt(request: ContentGenerationRequest): string {
    return `
      Generate a detailed, personalized course on "${request.topic}".
      
      Course Information:
      - Title: ${request.topic}
      - Target audience skill level: ${request.targetAudience?.skillLevel || 'intermediate'}
      - Learning objectives: ${JSON.stringify(request.learningObjectives || [])}
      
      Content requirements:
      - Create ${request.options?.moduleCount || 3} modules
      ${request.options?.includeQuizzes ? '- Include quizzes for assessment' : ''}
      ${request.options?.includeAssignments ? '- Include practical assignments' : ''}
      ${request.options?.includeResources ? '- Include additional learning resources' : ''}
      
      ${request.personalization ? `
      Personalization details:
      - Learning style adaptation: ${request.personalization.adaptToLearningStyle ? 'Yes' : 'No'}
      - Difficulty level: ${request.personalization.difficultyLevel || 'adaptive'}
      - Learning pace: ${request.personalization.paceAdjustment || 'moderate'}
      - Interest areas: ${JSON.stringify(request.personalization.interestAreas || [])}
      - Prior knowledge: ${JSON.stringify(request.personalization.priorKnowledge || {})}
      ` : ''}
      
      Return a complete course in JSON format with:
      - Course metadata (id, title, description, etc.)
      - Detailed modules with titles, descriptions, and content
      - Quizzes with questions and answers
      - Assignments with clear instructions
      - Additional resources
      
      Format the response as a valid JSON object.
    `;
  }
  
  private createSimulatedModules(contentRequest: any): any[] {
    const moduleCount = contentRequest?.options?.moduleCount || 3;
    const topic = contentRequest?.topic || 'Course Topic';
    
    return Array.from({ length: moduleCount }, (_, i) => ({
      id: `module_${i + 1}`,
      title: i === 0 
        ? `Introduction to ${topic}` 
        : i === moduleCount - 1 
          ? `Advanced Topics in ${topic}`
          : `${topic} - Module ${i + 1}`,
      description: `This module covers important concepts related to ${topic}.`,
      topics: [
        `Topic ${i + 1}.1`,
        `Topic ${i + 1}.2`,
        `Topic ${i + 1}.3`,
      ],
      content: `# Module ${i + 1}: ${i === 0 ? 'Introduction to' : `Key Concepts in`} ${topic}\n\nThis section covers essential information about the topic...`
    }));
  }
}

class SimulatedRAGSystemAgent implements SimulatedAgent {
  id: string;
  name: string;
  role: string;
  private llmService: LLMService | null = null;
  private useGroqLLM: boolean;
  
  constructor(config: any) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.useGroqLLM = envConfig.enableLLM && envConfig.groqApiKey !== null;
  }
  
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
    
    // Initialize LLM service if Groq is available
    if (this.useGroqLLM) {
      try {
        this.llmService = LLMService.getInstance({
          provider: 'groq',
          model: 'llama3-8b-8192',
          debugMode: true
        });
        console.log(`[${this.name}] LLM Service initialized with Groq API`);
      } catch (error) {
        console.error(`[${this.name}] Failed to initialize LLM Service:`, error);
        this.useGroqLLM = false;
      }
    }
  }
  
  async processTask(task: any): Promise<any> {
    console.log(`[${this.name}] Processing task: ${JSON.stringify(task)}`);
    
    if (this.useGroqLLM && this.llmService && task.type === "RAG Analysis") {
      return await this.analyzeProgressWithLLM(task.data);
    }
    
    return { success: true };
  }
  
  private async analyzeProgressWithLLM(progressData: any): Promise<any> {
    try {
      console.log(`[${this.name}] Analyzing learner progress with Groq LLM`);
      
      // Create a detailed prompt for the LLM
      const prompt = `
        Analyze the following learner progress data and determine the appropriate RAG (Red, Amber, Green) status:
        
        ${JSON.stringify(progressData, null, 2)}
        
        Provide a detailed analysis with:
        1. Overall RAG status (RED, AMBER, or GREEN)
        2. Justification for this status
        3. Key metrics analysis
        4. Recommended actions to improve learner progress
        5. Follow-up timeline
        
        Format your response as a JSON object.
      `;
      
      // Get response from LLM
      const response = await this.llmService!.complete(prompt, {
        system: 'You are an expert learning analytics system specializing in evaluating learner progress and recommending interventions.',
        temperature: 0.3,
        maxTokens: 2000
      });
      
      // Parse the response
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/\{[\s\S]*\}/);
                          
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const parsedResponse = JSON.parse(jsonString);
        
        return {
          success: true,
          data: parsedResponse
        };
      } catch (error) {
        console.error(`[${this.name}] Error parsing LLM response:`, error);
        // Fallback
        return {
          success: true,
          data: {
            ragStatus: "AMBER",
            justification: "Default analysis due to processing error",
            recommendations: ["Review progress manually"]
          }
        };
      }
    } catch (error) {
      console.error(`[${this.name}] Error analyzing progress with LLM:`, error);
      return {
        success: false,
        error: `Failed to analyze progress: ${error}`
      };
    }
  }
}

/**
 * Service for interacting with the multi-agent system
 */
export class AgentService {
  private static instance: AgentService;
  private managerAgent: SimulatedManagerAgent | null = null;
  private educatorAgent: SimulatedEducatorAgent | null = null;
  private ragSystemAgent: SimulatedRAGSystemAgent | null = null;
  private initialized = false;
  private initializing = false;

  private constructor() {}

  /**
   * Get the singleton instance of AgentService
   */
  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Initialize the agent system
   */
  public async initialize(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    try {
      console.log("Initializing agent system...");
      
      // Create the manager agent
      this.managerAgent = new SimulatedManagerAgent({
        id: "manager-agent",
        name: "Manager Agent",
        role: "System Orchestrator",
        verbose: true
      });

      // Initialize the manager agent
      await this.managerAgent.initialize();

      // Create and register the educator agent
      this.educatorAgent = new SimulatedEducatorAgent({
        id: "educator-agent",
        name: "Educator Agent",
        role: "Content Generator",
        verbose: true
      });
      
      await this.educatorAgent.initialize();
      await this.managerAgent.registerAgent(this.educatorAgent);

      // Create and register the RAG system agent
      this.ragSystemAgent = new SimulatedRAGSystemAgent({
        id: "rag-system-agent",
        name: "RAG System Agent",
        role: "Learning Progress Tracker",
        verbose: true
      });
      
      await this.ragSystemAgent.initialize();
      await this.managerAgent.registerAgent(this.ragSystemAgent);

      this.initialized = true;
      console.log("Agent system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize agent system:", error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Generate course content using the multi-agent system
   */
  public async generateCourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
    if (!this.managerAgent || !this.initialized) {
      await this.initialize();
    }

    if (!this.managerAgent) {
      throw new Error("Agent system not initialized");
    }

    try {
      // Convert the course request to a content generation request
      const contentRequest: ContentGenerationRequest = {
        contentType: "course" as ContentType,
        topic: request.title,
        targetAudience: {
          skillLevel: request.targetAudience as DifficultyLevel,
          roles: ["learner"]
        },
        learningObjectives: request.learningObjectives,
        keywords: request.description ? request.description.split(/\s+/).filter(word => word.length > 4) : [],
        options: {
          format: "markdown",
          includeQuizzes: request.includeQuizzes,
          includeAssignments: request.includeAssignments,
          includeResources: request.includeResources,
          moduleCount: request.moduleCount,
          depth: request.generationMode === 'complete' ? 'comprehensive' : 'overview'
        }
      };

      if (request.personalization) {
        contentRequest.personalization = request.personalization;
      }

      // For direct content generation using the educator agent (bypassing manager)
      if (this.educatorAgent && envConfig.enableLLM) {
        console.log("Using Educator Agent directly for content generation with LLM");
        const result = await this.educatorAgent.processTask({
          type: "Content Generation",
          data: contentRequest
        });
        
        if (!result || !result.success) {
          throw new Error("Failed to generate course content with Educator Agent");
        }
        
        return this.mapToGeneratedCourse(result.data, request);
      }

      // Execute the content generation workflow
      const taskId = await this.managerAgent.submitTask({
        type: "workflow",
        name: "Content Generation",
        data: contentRequest
      });

      // Poll for the task result
      const result = await this.pollTaskCompletion(taskId);
      
      if (!result || !result.success) {
        throw new Error("Failed to generate course content");
      }

      // Map the raw result to the GeneratedCourse type
      return this.mapToGeneratedCourse(result.data, request);
    } catch (error) {
      console.error("Error generating course:", error);
      throw error;
    }
  }

  /**
   * Poll for task completion
   */
  private async pollTaskCompletion(taskId: string, maxAttempts = 60, intervalMs = 1000): Promise<any> {
    if (!this.managerAgent) {
      throw new Error("Agent system not initialized");
    }

    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.managerAgent.getTaskStatus(taskId);
      
      if (status === "completed") {
        return await this.managerAgent.getTaskResult(taskId);
      }
      
      if (status === "failed") {
        throw new Error(`Task ${taskId} failed`);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Task ${taskId} timed out after ${maxAttempts} attempts`);
  }

  /**
   * Get default personalization parameters
   */
  private getDefaultPersonalization(): PersonalizationParams {
    return {
      difficultyLevel: "adaptive" as DifficultyLevel,
      paceAdjustment: "moderate",
      interestAreas: [],
      priorKnowledge: {}
    };
  }

  /**
   * Map the raw result to the GeneratedCourse type
   */
  private mapToGeneratedCourse(data: any, request: CourseGenerationRequest): GeneratedCourse {
    // First try to extract data from the LLM response if it's in the expected format
    if (data.title && data.modules && Array.isArray(data.modules)) {
      return {
        id: data.id || `course_${request.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`,
        title: data.title,
        description: data.description || request.description || `This course provides a comprehensive introduction to ${request.title}.`,
        targetAudience: data.targetAudience || request.targetAudience,
        estimatedDuration: data.estimatedDuration || this.getDurationText(request.duration),
        learningObjectives: data.learningObjectives || request.learningObjectives,
        modules: data.modules.map((module: any) => ({
          id: module.id || `module_${Math.random().toString(36).substr(2, 9)}`,
          title: module.title,
          description: module.description,
          topics: module.topics || [],
          content: module.content || `Content for ${module.title}`
        })),
        quizzes: data.quizzes || this.createDefaultQuizzes(request),
        assignments: data.assignments || this.createDefaultAssignments(request),
        resources: data.resources || this.createDefaultResources(request)
      };
    }
    
    // Fallback to default format
    return {
      id: `course_${request.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`,
      title: request.title,
      description: request.description || `This course provides a comprehensive introduction to ${request.title}, covering fundamental concepts, techniques, and real-world applications.`,
      targetAudience: request.targetAudience,
      estimatedDuration: request.duration === 'short' ? '1-2 hours' : request.duration === 'medium' ? '4-5 hours' : '6+ hours',
      learningObjectives: request.learningObjectives.length > 0 
        ? request.learningObjectives
        : [
            `Understand the foundational concepts of ${request.title}`,
            "Learn about key techniques and methodologies",
            "Explore real-world applications and cases",
            "Gain practical experience through exercises and assignments"
          ],
      modules: Array.from({ length: request.moduleCount }, (_, i) => ({
        id: `module_${i + 1}`,
        title: i === 0 
          ? `Introduction to ${request.title}` 
          : i === request.moduleCount - 1 
            ? `Advanced Topics and Future Directions`
            : `Core Concepts - Part ${i + 1}`,
        description: `This module ${i === 0 ? 'introduces' : 'explores'} ${i === 0 ? 'the fundamental concepts' : 'key aspects'} of ${request.title}.`,
        topics: [
          `Topic ${i + 1}.1`,
          `Topic ${i + 1}.2`,
          `Topic ${i + 1}.3`,
          `Topic ${i + 1}.4`,
        ],
        content: `# ${i === 0 ? 'Introduction to' : 'Core Concepts of'} ${request.title}\n\nThis section explores important concepts related to the subject...`
      })),
      quizzes: this.createDefaultQuizzes(request),
      assignments: this.createDefaultAssignments(request),
      resources: this.createDefaultResources(request)
    };
  }
  
  /**
   * Get duration text from duration value
   */
  private getDurationText(duration: string): string {
    switch (duration) {
      case 'short': return '1-2 hours';
      case 'medium': return '3-5 hours';
      case 'long': return '6+ hours';
      default: return '3-5 hours';
    }
  }
  
  /**
   * Create default quizzes for fallback
   */
  private createDefaultQuizzes(request: CourseGenerationRequest): any[] {
    return request.includeQuizzes ? [
      {
        id: "quiz_1",
        title: `${request.title} Basics`,
        questions: [
          {
            question: `What is the primary focus of ${request.title}?`,
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            correctAnswer: 0
          },
          {
            question: "When was this field first established?",
            options: [
              "1930s",
              "1950s",
              "1970s",
              "1990s"
            ],
            correctAnswer: 1
          }
        ]
      }
    ] : [];
  }
  
  /**
   * Create default assignments for fallback
   */
  private createDefaultAssignments(request: CourseGenerationRequest): any[] {
    return request.includeAssignments ? [
      {
        id: "assignment_1",
        title: `Practical Application of ${request.title}`,
        description: "In this assignment, you will apply the concepts learned in the course to solve a real-world problem.",
        tasks: [
          "Research the problem domain",
          "Apply appropriate techniques",
          "Document your approach",
          "Present your findings"
        ],
        submission: "Submit a report of 2-3 pages detailing your approach and results."
      }
    ] : [];
  }
  
  /**
   * Create default resources for fallback
   */
  private createDefaultResources(request: CourseGenerationRequest): any[] {
    return request.includeResources ? [
      {
        id: "resource_1",
        title: `${request.title} Textbook`,
        type: "book",
        url: "#",
        description: "A comprehensive textbook covering all aspects of the subject."
      },
      {
        id: "resource_2",
        title: `Video Tutorials for ${request.title}`,
        type: "video",
        url: "#",
        description: "A series of video tutorials demonstrating key concepts."
      }
    ] : [];
  }
  
  /**
   * Generate personalized content for employee with HR integration
   */
  public async generateEmployeePersonalizedContent(
    employeeId: string, 
    courseRequest: CourseGenerationRequest
  ): Promise<GeneratedCourse> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log(`Generating personalized content for employee ${employeeId}`);
      
      // Get employee data from HR database
      const { data: employeeData, error: employeeError } = await fetch(`/api/hr/employees/${employeeId}`).then(res => res.json());
      
      if (employeeError || !employeeData) {
        throw new Error(`Failed to get employee data: ${employeeError || 'Employee not found'}`);
      }
      
      // Get employee skills
      const { data: skillsData, error: skillsError } = await fetch(`/api/hr/employees/${employeeId}/skills`).then(res => res.json());
      
      // Enhance course request with employee data
      const enhancedRequest: CourseGenerationRequest = {
        ...courseRequest,
        personalization: {
          ...courseRequest.personalization,
          adaptToLearningStyle: true,
          difficultyLevel: 'adaptive',
          interestAreas: employeeData.interests || [],
          priorKnowledge: {}
        }
      };
      
      // Add employee skills as prior knowledge
      if (skillsData && Array.isArray(skillsData)) {
        const priorKnowledge: Record<string, string> = {};
        skillsData.forEach((skill: any) => {
          priorKnowledge[skill.name] = skill.level;
        });
        enhancedRequest.personalization!.priorKnowledge = priorKnowledge;
      }
      
      // Generate course with enhanced request
      const course = await this.generateCourse(enhancedRequest);
      
      return course;
    } catch (error) {
      console.error("Error generating personalized content for employee:", error);
      throw error;
    }
  }
}

/**
 * Course generation request schema
 */
export const courseGenerationRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetAudience: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.enum(["short", "medium", "long"]),
  learningObjectives: z.array(z.string()),
  includeQuizzes: z.boolean().default(true),
  includeAssignments: z.boolean().default(true),
  includeResources: z.boolean().default(true),
  moduleCount: z.number().int().min(1).max(10).default(3),
  generationMode: z.enum(["draft", "complete"]).default("draft"),
  personalization: z.object({
    adaptToLearningStyle: z.boolean().default(true),
    difficultyLevel: z.enum(["easy", "medium", "hard", "adaptive"]).default("adaptive"),
    paceAdjustment: z.enum(["slow", "moderate", "fast"]).default("moderate"),
    interestAreas: z.array(z.string()).default([]),
    priorKnowledge: z.object({}).passthrough().default({})
  }).optional()
});

/**
 * Type for course generation request
 */
export type CourseGenerationRequest = {
  title: string;
  description?: string;
  targetAudience: "beginner" | "intermediate" | "advanced";
  duration: "short" | "medium" | "long";
  learningObjectives: string[];
  includeQuizzes: boolean;
  includeAssignments: boolean;
  includeResources: boolean;
  moduleCount: number;
  generationMode: "draft" | "complete";
  personalization?: {
    adaptToLearningStyle: boolean;
    difficultyLevel: "easy" | "medium" | "hard" | "adaptive";
    paceAdjustment: "slow" | "moderate" | "fast";
    interestAreas: string[];
    priorKnowledge: Record<string, string>;
  }
};

/**
 * Type for a generated course
 */
export interface GeneratedCourse {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: string;
  learningObjectives: string[];
  modules: Array<{
    id: string;
    title: string;
    description: string;
    topics: string[];
    content: string;
  }>;
  quizzes?: Array<{
    id: string;
    title: string;
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
  }>;
  assignments?: Array<{
    id: string;
    title: string;
    description: string;
    tasks: string[];
    submission: string;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    url: string;
    description: string;
  }>;
} 