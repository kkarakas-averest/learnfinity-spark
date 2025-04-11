
/**
 * LLM Service for handling AI text generation
 * Provides a unified interface for working with language models
 */
import { GROQ_API_KEY, LLM_MODEL, LLM_TEMPERATURE } from '@/lib/env';
import { GroqAPI } from './groq-api';
import { MockLLM } from './mock-llm';
import { v4 as uuidv4 } from 'uuid';

// Available LLM providers
export type LLMProviderType = 'groq' | 'mock';

// Stats tracking for usage
export interface LLMUsageStats {
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  last_request_time?: Date;
}

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  isConfigured(): boolean;
  getModel(): string;
  setModel(model: string): void;
  complete(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      topP?: number;
      stopSequences?: string[];
    }
  ): Promise<{
    text: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }>;
}

/**
 * Main service for handling LLM interactions
 */
export class LLMService {
  private static instance: LLMService;
  private provider: LLMProvider;
  private providerType: LLMProviderType = 'mock';
  private usageStats: LLMUsageStats = {
    requests: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };

  private constructor() {
    // Default to MockLLM if no API key, otherwise use Groq
    if (GROQ_API_KEY) {
      this.provider = new GroqAPI(GROQ_API_KEY, LLM_MODEL || 'llama3-70b-8192');
      this.providerType = 'groq';
      console.log('LLMService initialized with Groq provider');
    } else {
      this.provider = new MockLLM();
      this.providerType = 'mock';
      console.log('LLMService initialized with Mock provider (no API key provided)');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Check if the LLM service is properly configured
   */
  public isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  /**
   * Get the current configuration
   */
  public getConfig(): { provider: LLMProviderType; model: string } {
    return {
      provider: this.providerType,
      model: this.provider.getModel()
    };
  }

  /**
   * Set the LLM provider to use
   */
  public setProvider(
    provider: LLMProviderType,
    options: { apiKey?: string; model?: string } = {}
  ): void {
    const currentModel = this.provider.getModel();
    
    // If the provider is the same and no new options, do nothing
    if (
      this.providerType === provider &&
      !options.apiKey &&
      (!options.model || options.model === currentModel)
    ) {
      return;
    }

    const prevProvider = this.providerType;
    this.providerType = provider;

    if (provider === 'groq') {
      const apiKey = options.apiKey || GROQ_API_KEY;
      if (!apiKey) {
        console.warn('No API key provided for Groq, falling back to mock provider');
        this.provider = new MockLLM();
        this.providerType = 'mock';
        return;
      }
      
      this.provider = new GroqAPI(
        apiKey, 
        options.model || currentModel || LLM_MODEL || 'llama3-70b-8192'
      );
    } else {
      this.provider = new MockLLM();
    }

    console.log(`Provider changed from ${prevProvider} to ${this.providerType}`);
    
    // If a model is specified, set it on the new provider
    if (options.model && options.model !== currentModel) {
      this.provider.setModel(options.model);
      console.log(`Model set to ${options.model}`);
    }
  }

  /**
   * Complete a prompt with the LLM
   */
  public async complete(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      topP?: number;
      stopSequences?: string[];
      trackId?: string; // Optional ID for tracking this request
    } = {}
  ): Promise<string> {
    const trackId = options.trackId || uuidv4().substring(0, 8);
    console.log(`[LLM:${trackId}] Processing prompt (${prompt.length} chars) with ${this.providerType} provider`);
    
    try {
      this.usageStats.requests++;
      this.usageStats.last_request_time = new Date();
      
      // Use default temperature from config if not provided
      const temperature = options.temperature !== undefined ? options.temperature : LLM_TEMPERATURE;
      
      // Get completion from provider
      const result = await this.provider.complete(prompt, {
        temperature,
        maxTokens: options.maxTokens,
        system: options.system,
        topP: options.topP,
        stopSequences: options.stopSequences
      });
      
      // Update usage stats
      this.usageStats.prompt_tokens += result.usage?.prompt_tokens || 0;
      this.usageStats.completion_tokens += result.usage?.completion_tokens || 0;
      this.usageStats.total_tokens += result.usage?.total_tokens || 0;
      
      // Log completion
      console.log(`[LLM:${trackId}] Completion received (${result.text.length} chars), tokens used: ${result.usage?.total_tokens || 'unknown'}`);
      
      return result.text;
    } catch (error) {
      console.error(`[LLM:${trackId}] Error during completion:`, error);
      
      // Return a fallback response
      if (this.providerType !== 'mock') {
        console.log(`[LLM:${trackId}] Attempting fallback to mock provider...`);
        const mockProvider = new MockLLM();
        return mockProvider.complete(prompt, options).then(result => result.text);
      }
      
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): LLMUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Reset usage statistics
   */
  public resetUsageStats(): void {
    this.usageStats = {
      requests: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
  }
}

export default LLMService;
