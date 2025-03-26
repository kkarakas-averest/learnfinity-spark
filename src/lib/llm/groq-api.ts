import { LLMProvider } from './llm-service';

/**
 * Implementation of LLMProvider using Groq API
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
    return !!this.apiKey;
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
      // Make the request to Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: options.system || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          top_p: options.topP ?? 1,
          stop: options.stopSequences || null
        })
      });

      // Parse the response
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
      }

      // Extract the completion text and token usage
      const completionText = data.choices[0]?.message?.content || '';
      const usage = {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
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
    } catch (error) {
      // Retry logic for transient errors
      if (this.options.maxRetries > 0) {
        console.warn(`Groq API request failed, retrying... (${this.options.maxRetries} attempts left)`);
        return this.complete(prompt, options);
      }
      
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }
} 