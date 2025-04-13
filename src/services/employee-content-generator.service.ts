import { LLMService } from '@/lib/llm/llm-service';
import { supabase } from '@/lib/supabase';
import { CourseGenerationRequest, GeneratedCourse } from '@/services/agent-service';
import { v4 as uuidv4 } from 'uuid';

// Shared logging function
function logEvent(category: string, action: string, details: any = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    action,
    details: typeof details === 'object' ? details : { message: details }
  };
  
  console.log(`[${timestamp}] [${category}] [${action}]`, JSON.stringify(logEntry.details, null, 2));
  
  // You could also save logs to a database table for later analysis
  try {
    supabase.from('system_logs').insert({
      timestamp,
      category,
      action,
      details: logEntry.details
    }).then(
      () => {},
      () => {} // Silently ignore errors
    );
  } catch (error) {
    // Silently fail if logging to DB fails
  }
}

/**
 * Service for generating personalized course content for employees
 * This service connects the HR employee data with the LLM-powered content generation
 */
export class EmployeeContentGeneratorService {
  private static instance: EmployeeContentGeneratorService;
  private llmService: LLMService;
  
  private constructor() {
    // Initialize LLM service with Groq provider
    this.llmService = LLMService.getInstance();
    
    logEvent('ContentGenerator', 'ServiceInitialized', {
      message: 'EmployeeContentGeneratorService initialized',
      llmProvider: 'groq',
      model: 'llama3-8b-8192'
    });
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EmployeeContentGeneratorService {
    if (!EmployeeContentGeneratorService.instance) {
      EmployeeContentGeneratorService.instance = new EmployeeContentGeneratorService();
    }
    return EmployeeContentGeneratorService.instance;
  }
  
  /**
   * Generate personalized course content for an employee
   */
  public async generatePersonalizedCourse(
    employeeId: string,
    courseRequest: CourseGenerationRequest
  ): Promise<GeneratedCourse> {
    const requestId = uuidv4().substring(0, 8);
    
    logEvent('ContentGenerator', 'GenerationStarted', {
      requestId,
      employeeId,
      courseTitle: courseRequest.title
    });
    
    try {
      // 1. Get employee data
      logEvent('ContentGenerator', 'FetchingEmployeeProfile', {
        requestId,
        employeeId
      });
      
      const employeeData = await this.getEmployeeProfile(employeeId);
      if (!employeeData) {
        const errorMsg = `Employee with ID ${employeeId} not found`;
        logEvent('ContentGenerator', 'EmployeeNotFound', {
          requestId,
          employeeId,
          error: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      logEvent('ContentGenerator', 'EmployeeProfileFetched', {
        requestId,
        employeeId,
        employeeName: employeeData.name,
        department: employeeData.hr_departments?.name,
        position: employeeData.hr_positions?.title,
        skillCount: employeeData.hr_employee_skills?.length || 0
      });
      
      // 2. Get learning preferences
      logEvent('ContentGenerator', 'FetchingLearningPreferences', {
        requestId,
        employeeId
      });
      
      const learningPreferences = await this.getLearningPreferences(employeeId);
      
      logEvent('ContentGenerator', 'LearningPreferencesFetched', {
        requestId,
        employeeId,
        preferences: learningPreferences
      });
      
      // 3. Enhance course request with employee data
      logEvent('ContentGenerator', 'EnhancingCourseRequest', {
        requestId,
        employeeId
      });
      
      const enhancedRequest = this.enhanceCourseRequest(courseRequest, employeeData, learningPreferences);
      
      logEvent('ContentGenerator', 'CourseRequestEnhanced', {
        requestId,
        employeeId,
        originalTitle: courseRequest.title,
        personalization: enhancedRequest.personalization
      });
      
      // 4. Generate course content using LLM
      logEvent('ContentGenerator', 'CallingLLM', {
        requestId,
        employeeId,
        courseTitle: enhancedRequest.title,
        model: 'llama3-8b-8192'
      });
      
      const generatedCourse = await this.generateCourseContent(enhancedRequest);
      
      logEvent('ContentGenerator', 'LLMGenerationCompleted', {
        requestId,
        employeeId,
        generatedTitle: generatedCourse.title,
        moduleCount: generatedCourse.modules.length,
        structure: {
          modules: generatedCourse.modules.map(m => m.title),
          quizCount: generatedCourse.quizzes?.length || 0
        }
      });
      
      return generatedCourse;
    } catch (error) {
      logEvent('ContentGenerator', 'GenerationError', {
        requestId,
        employeeId,
        courseTitle: courseRequest.title,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  /**
   * Save the generated course content to the database
   */
  public async saveGeneratedCourse(
    employeeId: string,
    course: GeneratedCourse
  ): Promise<{ success: boolean; courseId?: string; error?: string }> {
    const saveId = uuidv4().substring(0, 8);
    
    logEvent('ContentGenerator', 'SavingGeneratedCourse', {
      saveId,
      employeeId,
      courseTitle: course.title
    });
    
    try {
      // Save to ai_course_content table
      const contentId = uuidv4();
      
      const { data, error } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentId,
          created_for_user_id: employeeId,
          course_id: course.id,
          metadata: {
            title: course.title,
            description: course.description,
            moduleCount: course.modules.length,
            estimatedDuration: course.estimatedDuration
          },
          content: course,
          personalization_context: {
            targetAudience: course.targetAudience,
            objectives: course.learningObjectives
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1
        })
        .select('id')
        .single();
        
      if (error) {
        logEvent('ContentGenerator', 'SaveError', {
          saveId,
          employeeId,
          error: error.message,
          details: error
        });
        
        return {
          success: false,
          error: `Failed to save course content: ${error.message}`
        };
      }
      
      logEvent('ContentGenerator', 'SaveSuccess', {
        saveId,
        employeeId,
        courseContentId: data.id,
        moduleCount: course.modules.length
      });
      
      return {
        success: true,
        courseId: data.id
      };
    } catch (error) {
      logEvent('ContentGenerator', 'SaveException', {
        saveId,
        employeeId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        error: `Exception saving course content: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Get employee profile data
   */
  private async getEmployeeProfile(employeeId: string): Promise<any> {
    const { data, error } = await supabase
      .from('hr_employees')
      .select(`
        *,
        hr_departments(name),
        hr_positions(title),
        hr_employee_skills(skill_name, proficiency_level)
      `)
      .eq('id', employeeId)
      .single();
      
    if (error) {
      logEvent('ContentGenerator', 'GetEmployeeProfileError', {
        employeeId,
        error: error.message,
        details: error
      });
      throw error;
    }
    
    return data;
  }
  
  /**
   * Get employee learning preferences
   */
  private async getLearningPreferences(employeeId: string): Promise<any> {
    const { data, error } = await supabase
      .from('learner_dashboard_preferences')
      .select('preferences')
      .eq('employee_id', employeeId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      logEvent('ContentGenerator', 'GetLearningPreferencesError', {
        employeeId,
        error: error.message,
        details: error
      });
      throw error;
    }
    
    // Return default preferences if none exist
    return data?.preferences || {
      preferred_learning_style: 'visual',
      preferred_content_types: ['video', 'interactive'],
      learning_goals: ['Improve technical skills']
    };
  }
  
  /**
   * Enhance course request with employee data
   */
  private enhanceCourseRequest(
    request: CourseGenerationRequest,
    employeeData: any,
    learningPreferences: any
  ): CourseGenerationRequest {
    // Create a copy of the request
    const enhancedRequest = { ...request };
    
    // Add personalization data if not present
    if (!enhancedRequest.personalization) {
      enhancedRequest.personalization = {
        adaptToLearningStyle: true,
        difficultyLevel: 'adaptive',
        paceAdjustment: 'moderate',
        interestAreas: [],
        priorKnowledge: {}
      };
    }
    
    // Add learning style from preferences
    enhancedRequest.personalization.adaptToLearningStyle = true;
    
    // Add employee skills as prior knowledge
    const priorKnowledge: Record<string, string> = {};
    if (employeeData.hr_employee_skills && Array.isArray(employeeData.hr_employee_skills)) {
      employeeData.hr_employee_skills.forEach((skill: any) => {
        priorKnowledge[skill.skill_name] = skill.proficiency_level;
      });
    }
    enhancedRequest.personalization.priorKnowledge = priorKnowledge;
    
    // Add interests from learning preferences
    if (learningPreferences.learning_goals && Array.isArray(learningPreferences.learning_goals)) {
      enhancedRequest.personalization.interestAreas = [
        ...(enhancedRequest.personalization.interestAreas || []),
        ...learningPreferences.learning_goals
      ];
    }
    
    return enhancedRequest;
  }
  
  /**
   * Generate course content using LLM
   */
  private async generateCourseContent(request: CourseGenerationRequest): Promise<GeneratedCourse> {
    const generationId = uuidv4().substring(0, 8);
    
    // Convert to a format suitable for LLM processing
    const prompt = this.createCourseContentPrompt(request);
    
    logEvent('ContentGenerator', 'LLMPromptCreated', {
      generationId,
      courseTitle: request.title,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...'
    });
    
    // Get response from LLM
    try {
      logEvent('ContentGenerator', 'LLMRequestStarted', {
        generationId,
        courseTitle: request.title,
        model: 'llama3-8b-8192',
        temperature: 0.7,
        maxTokens: 4000
      });
      
      const startTime = Date.now();
      const response = await this.llmService.complete(prompt, {
        system: 'You are an expert educational content creator. Your task is to create comprehensive, engaging, and personalized course content.',
        temperature: 0.7,
        maxTokens: 4000
      });
      const endTime = Date.now();
      
      logEvent('ContentGenerator', 'LLMResponseReceived', {
        generationId,
        courseTitle: request.title,
        responseTimeMs: endTime - startTime,
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + '...'
      });
      
      // Parse the response
      try {
        // The response should be a JSON string
        // First attempt to extract JSON if it's wrapped in other text
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/\{[\s\S]*\}/);
                          
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        
        logEvent('ContentGenerator', 'ParsingLLMResponse', {
          generationId,
          courseTitle: request.title,
          jsonStringLength: jsonString.length,
          extractedJson: jsonMatch !== null
        });
        
        const parsedResponse = JSON.parse(jsonString);
        
        // Map to GeneratedCourse structure
        const mappedCourse = this.mapResponseToGeneratedCourse(parsedResponse, request);
        
        logEvent('ContentGenerator', 'ResponseParsedSuccessfully', {
          generationId,
          courseTitle: request.title,
          resultModules: mappedCourse.modules.length,
          success: true
        });
        
        return mappedCourse;
      } catch (error) {
        logEvent('ContentGenerator', 'ResponseParsingError', {
          generationId,
          courseTitle: request.title,
          error: error instanceof Error ? error.message : String(error),
          rawResponsePreview: response.substring(0, 200) + '...'
        });
        
        // Fallback to a basic structure
        const fallbackCourse = this.createFallbackCourse(request);
        
        logEvent('ContentGenerator', 'UsingFallbackCourse', {
          generationId,
          courseTitle: request.title,
          fallbackModules: fallbackCourse.modules.length
        });
        
        return fallbackCourse;
      }
    } catch (llmError) {
      logEvent('ContentGenerator', 'LLMRequestFailed', {
        generationId,
        courseTitle: request.title,
        error: llmError instanceof Error ? llmError.message : String(llmError),
        stack: llmError instanceof Error ? llmError.stack : undefined
      });
      
      throw llmError;
    }
  }
  
  /**
   * Create a detailed prompt for course generation
   */
  private createCourseContentPrompt(request: CourseGenerationRequest): string {
    return `
      Generate a detailed, personalized course on "${request.title}".
      
      Course Information:
      - Title: ${request.title}
      - Description: ${request.description || 'A comprehensive course on this topic'}
      - Target audience skill level: ${request.targetAudience}
      - Desired duration: ${request.duration}
      - Learning objectives: ${JSON.stringify(request.learningObjectives)}
      
      Content requirements:
      - Create ${request.moduleCount} modules
      ${request.includeQuizzes ? '- Include quizzes for assessment' : ''}
      ${request.includeAssignments ? '- Include practical assignments' : ''}
      ${request.includeResources ? '- Include additional learning resources' : ''}
      
      Personalization details:
      ${request.personalization ? `
      - Learning style adaptation: ${request.personalization.adaptToLearningStyle ? 'Yes' : 'No'}
      - Difficulty level: ${request.personalization.difficultyLevel}
      - Learning pace: ${request.personalization.paceAdjustment}
      - Interest areas: ${JSON.stringify(request.personalization.interestAreas)}
      - Prior knowledge: ${JSON.stringify(request.personalization.priorKnowledge)}
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
  
  /**
   * Map LLM response to expected GeneratedCourse format
   */
  private mapResponseToGeneratedCourse(response: any, request: CourseGenerationRequest): GeneratedCourse {
    // Extract data from the response or use defaults
    return {
      id: response.id || `course_${Date.now()}`,
      title: response.title || request.title,
      description: response.description || request.description || '',
      targetAudience: response.targetAudience || request.targetAudience,
      estimatedDuration: response.estimatedDuration || this.getDurationText(request.duration),
      learningObjectives: response.learningObjectives || request.learningObjectives,
      modules: response.modules || this.createDefaultModules(request),
      quizzes: response.quizzes || (request.includeQuizzes ? this.createDefaultQuizzes(request) : []),
      assignments: response.assignments || (request.includeAssignments ? this.createDefaultAssignments(request) : []),
      resources: response.resources || (request.includeResources ? this.createDefaultResources(request) : [])
    };
  }
  
  /**
   * Create a fallback course structure if parsing fails
   */
  private createFallbackCourse(request: CourseGenerationRequest): GeneratedCourse {
    return {
      id: `course_${Date.now()}`,
      title: request.title,
      description: request.description || `A comprehensive course on ${request.title}`,
      targetAudience: request.targetAudience,
      estimatedDuration: this.getDurationText(request.duration),
      learningObjectives: request.learningObjectives,
      modules: this.createDefaultModules(request),
      quizzes: request.includeQuizzes ? this.createDefaultQuizzes(request) : [],
      assignments: request.includeAssignments ? this.createDefaultAssignments(request) : [],
      resources: request.includeResources ? this.createDefaultResources(request) : []
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
   * Create default modules for fallback
   */
  private createDefaultModules(request: CourseGenerationRequest): any[] {
    return Array.from({ length: request.moduleCount }, (_, i) => ({
      id: `module_${i + 1}`,
      title: i === 0 
        ? `Introduction to ${request.title}` 
        : i === request.moduleCount - 1 
          ? `Advanced Topics in ${request.title}`
          : `${request.title} - Module ${i + 1}`,
      description: `This module covers important concepts related to ${request.title}.`,
      topics: [
        `Topic ${i + 1}.1`,
        `Topic ${i + 1}.2`,
        `Topic ${i + 1}.3`,
      ],
      content: `# Module ${i + 1}: ${i === 0 ? 'Introduction to' : `Key Concepts in`} ${request.title}\n\nThis section covers essential information about the topic...`
    }));
  }
  
  /**
   * Create default quizzes for fallback
   */
  private createDefaultQuizzes(request: CourseGenerationRequest): any[] {
    return [
      {
        id: `quiz_1`,
        title: `${request.title} Assessment`,
        questions: [
          {
            question: `What is the primary purpose of ${request.title}?`,
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            correctAnswer: 0
          },
          {
            question: `Which best describes the key benefit of ${request.title}?`,
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            correctAnswer: 1
          }
        ]
      }
    ];
  }
  
  /**
   * Create default assignments for fallback
   */
  private createDefaultAssignments(request: CourseGenerationRequest): any[] {
    return [
      {
        id: `assignment_1`,
        title: `Practical Application of ${request.title}`,
        description: "Apply the concepts learned in this course to solve a real-world problem.",
        tasks: [
          "Identify a relevant problem in your work",
          "Apply the principles from the course",
          "Document your approach and results",
          "Reflect on the effectiveness of the solution"
        ],
        submission: "Submit a 1-2 page report describing your approach and results."
      }
    ];
  }
  
  /**
   * Create default resources for fallback
   */
  private createDefaultResources(request: CourseGenerationRequest): any[] {
    return [
      {
        id: `resource_1`,
        title: `${request.title} Reference Guide`,
        type: "document",
        url: "#",
        description: "A comprehensive reference guide for this topic."
      },
      {
        id: `resource_2`,
        title: `${request.title} Best Practices`,
        type: "link",
        url: "#",
        description: "Industry best practices for applying these concepts."
      }
    ];
  }
}

export const employeeContentGeneratorService = EmployeeContentGeneratorService.getInstance(); 