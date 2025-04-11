
import { LLMProvider } from './llm-service';
import { PUBLIC_APP_URL } from '@/lib/env';

/**
 * Implementation of LLMProvider using Groq API via an edge function
 */
export class GroqAPI implements LLMProvider {
  private apiKey: string;
  private model: string;
  private options: {
    maxRetries: number;
    debug: boolean;
  };

  constructor(
    apiKey: string,
    model: string = 'llama3-8b-8192',
    options: { maxRetries?: number; debug?: boolean } = {}
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      debug: options.debug ?? false
    };
  }

  /**
   * Check if the API is properly configured
   */
  public isConfigured(): boolean {
    // Check if the API key is present and has valid format (starts with gsk_)
    return Boolean(this.apiKey) && this.apiKey.startsWith('gsk_') && this.apiKey.length > 20;
  }

  /**
   * Get the current model name
   */
  public getModel(): string {
    return this.model;
  }

  /**
   * Set a new model
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Check if a model is available through the Groq API
   */
  public async checkModelAvailability(model: string = this.model): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Groq API not configured, cannot check model availability');
      return false;
    }

    try {
      // Call the edge function to check models
      const response = await fetch(`${PUBLIC_APP_URL}/api/groq/list-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: this.apiKey })
      });
      
      if (!response.ok) {
        console.warn(`Failed to check model availability: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      const availableModels = data.models || [];
      
      // Check if the model is in the list
      const isAvailable = availableModels.some((m: any) => m === model);
      
      if (!isAvailable && this.options.debug) {
        console.warn(`Model ${model} is not available in Groq API. Available models: ${availableModels.join(', ')}`);
      }
      
      return isAvailable;
    } catch (error) {
      console.error('Error checking model availability:', error);
      return false;
    }
  }

  /**
   * Call the Groq API to generate a completion
   */
  public async complete(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
      topP?: number;
      stopSequences?: string[];
    } = {}
  ): Promise<{
    text: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    // Log request details if debug is enabled
    if (this.options.debug) {
      console.log('Groq API request:', {
        model: this.model,
        prompt: prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt,
        options
      });
    }

    try {
      // Call the Supabase Edge Function for Groq API
      const response = await fetch(`${PUBLIC_APP_URL}/functions/v1/groq-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          systemPrompt: options.system || 'You are a helpful assistant.',
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 1024,
          topP: options.topP ?? 1,
          stopSequences: options.stopSequences || null
        })
      });

      // Parse the response
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (data.error && 
            (data.error.includes('model') || 
             data.error.includes('not found') || 
             data.error.includes('deprecated'))) {
          throw new Error(`Groq API model error: ${data.error}`);
        }
        throw new Error(`Groq API error: ${data.error || 'Unknown error'}`);
      }

      // Extract the completion text and token usage
      const completionText = data.text || '';
      const usage = data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };

      // Log response details if debug is enabled
      if (this.options.debug) {
        console.log('Groq API response:', {
          text: completionText.length > 100 ? completionText.substring(0, 100) + '...' : completionText,
          usage
        });
      }

      return {
        text: completionText,
        usage
      };
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      // Check if it's a model-related error
      const isModelError = errorMessage.includes('model') || 
                           errorMessage.includes('not found') || 
                           errorMessage.includes('deprecated');
      
      // Retry logic for transient errors or model errors if max retries > 0
      if (this.options.maxRetries > 0) {
        if (isModelError) {
          console.warn(`Model error with ${this.model}, retrying might not help unless we change models.`);
          // Let the caller handle model switching
          throw error;
        } else {
          console.warn(`Groq API request failed, retrying... (${this.options.maxRetries} attempts left)`);
          // Create a new instance with one less retry
          const newOptions = { ...this.options, maxRetries: this.options.maxRetries - 1 };
          const retryAPI = new GroqAPI(this.apiKey, this.model, newOptions);
          return retryAPI.complete(prompt, options);
        }
      }
      
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }
}
