import { GroqAPI } from './groq-api';
import { MockLLMProvider } from './mock-provider';
import { defaultLLMConfig, fallbackLLMConfig, LLMConfig, systemPrompts } from './config';
import envConfig, { isApiConfigured, isFeatureEnabled } from '../env-config';

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
  
  /**
   * Initialize the LLM service with a specific provider
   */
  private constructor(config: Partial<LLMConfig> = {}) {
    // Merge provided config with defaults
    this.config = { ...defaultLLMConfig, ...config };
    
    // Update with environment config
    if (envConfig.groqApiKey) {
      this.config.apiKey = envConfig.groqApiKey;
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
   * Get a completion from the LLM provider
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
      system: options.system ?? systemPrompts.ragAnalysis,
      topP: options.topP ?? 0.7,
      stopSequences: options.stopSequences ?? []
    };
    
    try {
      // Set a timeout for the request
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`LLM request timed out after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });
      
      // Race the completion against the timeout
      const result = await Promise.race([
        this.provider.complete(prompt, fullOptions),
        timeoutPromise
      ]) as { text: string, usage: any };
      
      // Track usage
      if (result.usage) {
        this.usageTotals.total_tokens += result.usage.total_tokens;
        this.usageTotals.prompt_tokens += result.usage.prompt_tokens;
        this.usageTotals.completion_tokens += result.usage.completion_tokens;
        this.usageTotals.requests += 1;
        
        if (this.config.debugMode && this.usageTotals.requests % 5 === 0) {
          console.log('LLM usage totals:', this.usageTotals);
        }
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
      temperature?: number,
      maxTokens?: number
    } = {}
  ): Promise<string> {
    const employeeDataString = JSON.stringify(employeeData, null, 2);
    const preferencesString = JSON.stringify(preferences, null, 2);
    
    const prompt = `
      I need to create a personalized learning path for the following employee based on their data and preferences:
      
      Employee Data:
      ${employeeDataString}
      
      Learning Preferences:
      ${preferencesString}
      
      Please generate a comprehensive learning path that includes:
      1. Core focus areas based on skills gaps and career goals
      2. Specific recommended courses or modules with estimated time commitments
      3. A suggested schedule or timeline for completion
      4. Additional resources that would complement the formal learning
      
      The learning path should be tailored to their current skill level, learning style preferences, and career objectives.
    `.trim();
    
    return this.complete(prompt, {
      system: systemPrompts.learningPath,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2048
    });
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
} 