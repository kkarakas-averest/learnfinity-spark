import { GroqAPI } from './groq-api';
import { MockLLMProvider } from './mock-provider';
import { defaultLLMConfig, fallbackLLMConfig, LLMConfig, systemPrompts } from './config';
import envConfig, { isApiConfigured, isFeatureEnabled } from '../env-config';
import { GROQ_API_KEY } from '../env';
import type { SystemPromptType } from './types';

// Define a common interface that all LLM providers will implement
export interface LLMProvider {
  complete(prompt: string, options?: any): Promise<{ 
    text: string, 
    usage: { 
      prompt_tokens: number, 
      completion_tokens: number, 
      total_tokens: number 
    } 
  }>;
  isConfigured(): boolean;
  getModel(): string;
  setModel(model: string): void;
}

/**
 * LLMService class for managing different LLM providers
 */
export class LLMService {
  private static instance: LLMService | null = null;
  private provider: LLMProvider;
  private config: LLMConfig;
  private usageTotals = {
    total_tokens: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    requests: 0
  };
  private availableModels: string[] = [
    'llama3-8b-8192',
    'llama3-70b-8192',
    'gemma-7b-it'
  ];
  
  /**
   * Initialize the LLM service with a specific provider
   */
  private constructor(config: Partial<LLMConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...defaultLLMConfig, ...config };
    
    // Update with environment config
    if (envConfig.groqApiKey) {
      this.config.apiKey = envConfig.groqApiKey;
      if (envConfig.debug) {
        console.log(`Loaded Groq API key from environment: ${this.config.apiKey.substring(0, 4)}...${this.config.apiKey.substring(this.config.apiKey.length - 4)} (${this.config.apiKey.length} chars)`);
      }
    } else if (GROQ_API_KEY) {
      // Fallback to direct API key from env.js
      this.config.apiKey = GROQ_API_KEY;
      if (envConfig.debug) {
        console.log(`Loaded Groq API key from direct import: ${this.config.apiKey.substring(0, 4)}...${this.config.apiKey.substring(this.config.apiKey.length - 4)} (${this.config.apiKey.length} chars)`);
      }
    } else if (envConfig.debug) {
      console.warn('No Groq API key found in environment variables');
    }
    
    // Only use LLM if the feature flag is enabled
    if (!isFeatureEnabled('enableLLM')) {
      this.config.provider = 'mock';
      if (envConfig.debug) {
        console.log('LLM feature disabled, using mock provider');
      }
    }
    
    // Initialize the appropriate provider
    try {
      switch (this.config.provider) {
        case 'groq':
          if (this.config.apiKey) {
            // Validate if model is in the available models list
            if (!this.availableModels.includes(this.config.model)) {
              console.warn(`Model ${this.config.model} is not in the list of known available models. Attempting to use it anyway, but may fall back if unavailable.`);
            }
            
            this.provider = new GroqAPI(
              this.config.apiKey, 
              this.config.model,
              { 
                maxRetries: this.config.retryAttempts,
                debug: this.config.debugMode
              }
            );
            if (envConfig.debug) {
              console.log(`Initialized Groq provider with model: ${this.config.model}`);
            }
          } else {
            console.warn('Groq API key not provided, falling back to mock provider');
            this.provider = new MockLLMProvider();
            this.config.provider = 'mock';
          }
          break;
          
        case 'mock':
        default:
          this.provider = new MockLLMProvider();
          if (envConfig.debug && this.config.provider !== 'mock') {
            console.warn(`Provider ${this.config.provider} not supported, using mock provider`);
          } else if (envConfig.debug) {
            console.log('Using mock LLM provider');
          }
          this.config.provider = 'mock';
      }
    } catch (error) {
      console.error('Error initializing LLM provider, falling back to mock provider:', error);
      this.provider = new MockLLMProvider();
      this.config.provider = 'mock';
    }
  }
  
  /**
   * Get a singleton instance of the LLM service
   */
  public static getInstance(config: Partial<LLMConfig> = {}): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(config);
    }
    return LLMService.instance;
  }
  
  /**
   * Try to get a completion, falling back to alternative models if needed
   */
  private async tryWithFallbacks(
    prompt: string, 
    options: any
  ): Promise<{ text: string; usage: any }> {
    // First try with the configured model
    try {
      return await this.provider.complete(prompt, options);
    } catch (error) {
      if (this.config.provider === 'groq' && error.message?.includes('model')) {
        console.warn(`Error with model ${this.config.model}: ${error.message}`);
        
        // Try alternative models if available
        for (const alternativeModel of this.availableModels) {
          if (alternativeModel !== this.config.model) {
            try {
              console.log(`Trying alternative model: ${alternativeModel}`);
              // Create a temporary provider with the alternative model
              const tempProvider = new GroqAPI(
                this.config.apiKey,
                alternativeModel,
                { 
                  maxRetries: 1, // Reduced retries for fallback
                  debug: this.config.debugMode
                }
              );
              
              const result = await tempProvider.complete(prompt, options);
              console.log(`Successfully used alternative model: ${alternativeModel}`);
              return result;
            } catch (fallbackError) {
              console.warn(`Alternative model ${alternativeModel} also failed: ${fallbackError.message}`);
            }
          }
        }
      }
      
      // If all alternative models fail or if it's not a model issue, throw the original error
      throw error;
    }
  }
  
  /**
   * Get a completion from the LLM
   */
  public async complete(
    prompt: string,
    options: {
      temperature?: number,
      maxTokens?: number,
      system?: string,
      topP?: number,
      stopSequences?: string[]
    } = {}
  ): Promise<string> {
    // Use default options from config if not specified
    const fullOptions = {
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens ?? this.config.maxTokens,
      system: options.system ?? 'You are a helpful assistant.',
      topP: options.topP ?? 1,
      stopSequences: options.stopSequences ?? []
    };
    
    try {
      if (this.config.debugMode) {
        console.log(`Sending prompt (${prompt.length} chars) to ${this.config.provider} with model ${this.config.model}`);
      }
      
      // Start timer
      const startTime = Date.now();
      
      // Get completion with fallback strategy
      const result = await this.tryWithFallbacks(prompt, fullOptions);
      
      // End timer
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000; // in seconds
      
      // Update usage statistics
      this.usageTotals.requests += 1;
      this.usageTotals.prompt_tokens += result.usage.prompt_tokens;
      this.usageTotals.completion_tokens += result.usage.completion_tokens;
      this.usageTotals.total_tokens += result.usage.total_tokens;
      
      if (this.config.debugMode) {
        console.log(`LLM response received in ${elapsedTime.toFixed(2)}s. Tokens: prompt=${result.usage.prompt_tokens}, completion=${result.usage.completion_tokens}`);
      }
      
      return result.text;
    } catch (error) {
      console.error('Error getting LLM completion:', error);
      
      // If using Groq and it fails, try falling back to mock
      if (this.config.provider === 'groq' && !(this.provider instanceof MockLLMProvider)) {
        console.warn('Falling back to mock provider for this request');
        const mockProvider = new MockLLMProvider(this.config.model, this.config.debugMode);
        const mockResult = await mockProvider.complete(prompt, fullOptions);
        return mockResult.text;
      }
      
      throw new Error(`Failed to get LLM completion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Determine RAG status using LLM
   */
  public async determineRAGStatus(
    employeeData: any,
    options: {
      detailed?: boolean,
      temperature?: number,
      topP?: number,
      maxTokens?: number
    } = {}
  ): Promise<string> {
    const { detailed = true, temperature = 0.3, topP = 0.9, maxTokens = 1024 } = options;
    
    const employeeDataString = JSON.stringify(employeeData, null, 2);
    
    const prompt = `
      I need a comprehensive RAG (Red, Amber, Green) status analysis for the following employee based on their learning progress data:
      
      ${employeeDataString}
      
      ${detailed ? `
      Please provide a detailed analysis with the following structure:
      
      ## RAG STATUS: [RED/AMBER/GREEN]
      
      ### Justification
      [Provide a clear explanation of why this status was determined, citing specific metrics from the employee data]
      
      ### Key Metrics Analysis
      - Progress Rate: [Analyze completion percentage]
      - Engagement: [Analyze activity patterns and frequency]
      - Performance: [If assessment data is available, analyze scores and completion]
      - Comparative Standing: [How does this employee compare to departmental averages, if data available]
      
      ### Recommended Actions
      1. [Primary action with highest priority]
      2. [Secondary action]
      3. [Additional actions as needed]
      
      ### Follow-up Timeline
      [Recommendation for when to review progress, more urgent for RED status]
      ` : `
      Please respond with:
      
      STATUS: [RED/AMBER/GREEN]
      REASON: [One-sentence justification for this status]
      ACTION: [Single most important recommended action]
      `}
      
      When making your determination, please refer to these specific guidelines:
      
      - RED status indicators:
        * Completion rate below 30%
        * No activity for more than 30 days
        * Failed assessments or consistently low scores
        * Multiple missed deadlines
        * Significant decline in engagement metrics
      
      - AMBER status indicators:
        * Completion rate between 30-70%
        * Activity gaps of 14-30 days
        * Mixed assessment performance
        * Occasional missed deadlines
        * Inconsistent engagement patterns
      
      - GREEN status indicators:
        * Completion rate above 70%
        * Active within the last 14 days
        * Satisfactory assessment performance
        * Meeting deadlines consistently
        * Steady or improving engagement metrics

      Please consider the context of the employee's department, role, and any special circumstances indicated in the data.
    `.trim();
    
    return this.complete(prompt, {
      system: systemPrompts.ragAnalysis,
      temperature,
      topP,
      maxTokens
    });
  }
  
  /**
   * Generate a personalized learning path
   */
  public async generateLearningPath(
    employeeData: any,
    preferences: any,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<any> {
    const employeeDataString = JSON.stringify(employeeData, null, 2);
    const preferencesString = JSON.stringify(preferences, null, 2);
    
    const prompt = `
      Create a personalized learning path for the following employee based on their data and preferences:
      
      Employee Data:
      ${employeeDataString}
      
      Learning Preferences:
      ${preferencesString}
      
      The learning path should include:
      1. Core focus areas based on skills gaps and career goals
      2. Specific recommended courses or modules with estimated time commitments
      3. A suggested schedule or timeline for completion
      4. Additional resources that would complement the formal learning
      
      Return the learning path as a JSON object with the following structure:
      {
        "id": "unique-id",
        "title": "Learning Path Title",
        "description": "Path Description",
        "courses": ["course-ids"],
        "duration": number,
        "skillLevel": "beginner|intermediate|advanced|expert",
        "modules": [
          {
            "id": "module-id",
            "title": "Module Title",
            "description": "Module Description",
            "duration": number,
            "prerequisites": ["module-ids"],
            "objectives": ["objective1", "objective2"],
            "content": [
              {
                "type": "video|text|interactive|assessment",
                "data": {}
              }
            ]
          }
        ]
      }
    `.trim();
    
    const response = await this.complete(prompt, {
      system: systemPrompts.learningPathCreation,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2048
    });

    return JSON.parse(response);
  }
  
  /**
   * Generate remedial content for struggling learners
   */
  public async generateRemedialContent(
    concept: string,
    learnerData: any,
    options: {
      format?: 'text' | 'markdown' | 'html',
      temperature?: number,
      maxTokens?: number
    } = {}
  ): Promise<string> {
    const { format = 'markdown', temperature = 0.7, maxTokens = 2048 } = options;
    const learnerDataString = JSON.stringify(learnerData, null, 2);
    
    const prompt = `
      I need to create remedial learning content for a learner who is struggling with the concept: "${concept}".
      
      Learner information:
      ${learnerDataString}
      
      Please generate educational content that:
      1. Explains the concept in a clear, accessible way
      2. Provides examples and analogies to aid understanding
      3. Includes practice exercises or activities
      4. Addresses common misconceptions
      
      Format the response in ${format} format and ensure it's engaging and tailored to the learner's needs and preferences.
    `.trim();
    
    return this.complete(prompt, {
      system: systemPrompts.contentCreation,
      temperature,
      maxTokens
    });
  }
  
  /**
   * Change the current provider
   */
  public setProvider(provider: 'groq' | 'mock', config: Partial<LLMConfig> = {}): void {
    // Update config
    this.config = { ...this.config, provider, ...config };
    
    // Initialize the new provider
    if (provider === 'groq' && this.config.apiKey) {
      this.provider = new GroqAPI(
        this.config.apiKey, 
        this.config.model, 
        { 
          maxRetries: this.config.retryAttempts, 
          debug: this.config.debugMode 
        }
      );
    } else {
      this.provider = new MockLLMProvider(
        this.config.model, 
        this.config.debugMode
      );
    }
    
    if (this.config.debugMode) {
      console.log(`LLM provider changed to: ${provider}`);
    }
  }
  
  /**
   * Get usage statistics
   */
  public getUsageStats(): { 
    total_tokens: number, 
    prompt_tokens: number, 
    completion_tokens: number, 
    requests: number 
  } {
    return { ...this.usageTotals };
  }
  
  /**
   * Reset usage statistics
   */
  public resetUsageStats(): void {
    this.usageTotals = {
      total_tokens: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      requests: 0
    };
  }
  
  /**
   * Check if the current provider is configured properly
   */
  public isConfigured(): boolean {
    return this.provider.isConfigured();
  }
  
  /**
   * Get current config
   */
  public getConfig(): LLMConfig {
    return { ...this.config };
  }
  
  /**
   * Get the currently active model name
   */
  public getModel(): string {
    return this.provider.getModel();
  }

  public async generateEmployeeProfile(data: {
    id: string;
    name: string;
    role: string;
    department: string;
    skills: string[];
    experience?: string;
    learningPreferences?: Record<string, any>;
  }): Promise<any> {
    const prompt = `
      Create a comprehensive employee profile based on the following information:
      
      Employee ID: ${data.id}
      Name: ${data.name}
      Role: ${data.role}
      Department: ${data.department}
      Experience: ${data.experience || 'Not specified'}
      Skills: ${data.skills.join(', ')}
      Learning Preferences: ${JSON.stringify(data.learningPreferences || {})}
      
      The profile should include:
      1. A summary of the employee's professional background
      2. An assessment of their likely skill level based on their role and experience
      3. Recommended learning areas based on their role and department
      4. Preferred learning styles (if information is available)
      5. Estimated time availability for learning (if information is available)
      
      Return the profile as a JSON object.
    `.trim();

    const response = await this.complete(prompt, {
      system: systemPrompts.employeeProfileCreation,
      temperature: 0.7
    });

    return JSON.parse(response);
  }

  public async generateContent(options: {
    module: any;
    profile: any;
    learningPath: any;
  }): Promise<any> {
    const prompt = `
      Generate learning content for the following module:
      
      Module: ${JSON.stringify(options.module, null, 2)}
      
      Employee Profile: ${JSON.stringify(options.profile, null, 2)}
      
      Learning Path: ${JSON.stringify(options.learningPath, null, 2)}
      
      The content should include:
      1. Clear learning objectives
      2. Engaging explanations and examples
      3. Interactive elements and exercises
      4. Assessment questions
      5. Additional resources
      
      Return the content as a JSON object.
    `.trim();

    const response = await this.complete(prompt, {
      system: systemPrompts.contentCreation,
      temperature: 0.7
    });

    return JSON.parse(response);
  }

  public async adaptContent(options: {
    currentContent: any;
    progress: any;
    ragStatus: 'green' | 'amber' | 'red';
  }): Promise<any> {
    const prompt = `
      Adapt the following learning content based on the student's progress and RAG status:
      
      Current Content: ${JSON.stringify(options.currentContent, null, 2)}
      
      Progress: ${JSON.stringify(options.progress, null, 2)}
      
      RAG Status: ${options.ragStatus}
      
      The adapted content should:
      1. Address any learning gaps
      2. Provide additional support if needed
      3. Include more challenging content if the student is excelling
      4. Maintain engagement and motivation
      
      Return the adapted content as a JSON object.
    `.trim();

    const response = await this.complete(prompt, {
      system: systemPrompts.contentAdaptation,
      temperature: 0.7
    });

    return JSON.parse(response);
  }

  public async generateIntervention(options: {
    employeeId: string;
    ragStatus: 'green' | 'amber' | 'red';
    learningHistory: any;
  }): Promise<any> {
    const prompt = `
      Suggest interventions for the following situation:
      
      Employee ID: ${options.employeeId}
      RAG Status: ${options.ragStatus}
      Learning History: ${JSON.stringify(options.learningHistory, null, 2)}
      
      Provide specific actions and recommendations based on the RAG status.
      
      Return the intervention plan as a JSON object.
    `.trim();

    const response = await this.complete(prompt, {
      system: systemPrompts.learningIntervention,
      temperature: 0.7
    });

    return JSON.parse(response);
  }

  /**
   * Get the appropriate system prompt based on the type
   */
  public getSystemPrompt(type: SystemPromptType): string {
    return systemPrompts[type] || '';
  }
} 