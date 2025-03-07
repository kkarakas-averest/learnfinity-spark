import { Groq } from 'groq-sdk';

/**
 * GroqAPI class for interacting with Groq's LLM models
 * 
 * This wrapper provides a simple interface for interacting with 
 * Groq's large language models, handling authentication and API calls.
 */
export class GroqAPI {
  private client: Groq;
  private apiKey: string;
  private model: string;
  private maxRetries: number;
  private debug: boolean;

  /**
   * Initialize the Groq API client
   * 
   * @param apiKey - Groq API key (defaults to environment variable)
   * @param model - Model to use (defaults to Llama 3.1)
   * @param options - Additional options
   */
  constructor(
    apiKey: string = process.env.GROQ_API_KEY || "",
    model: string = "llama-3.1-70b-versatile",
    options: { maxRetries?: number, debug?: boolean } = {}
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxRetries = options.maxRetries || 3;
    this.debug = options.debug || false;
    
    // Initialize the Groq client
    this.client = new Groq({
      apiKey: this.apiKey
    });
    
    if (this.debug) {
      console.log(`GroqAPI initialized with model: ${this.model}`);
    }
    
    // Validate API key
    if (!this.apiKey) {
      console.warn('Groq API key not provided. LLM functionality will not work.');
    }
  }
  
  /**
   * Send a completion request to Groq API
   * 
   * @param prompt - The text prompt to send
   * @param options - Additional options for the completion
   * @returns The generated text
   */
  async complete(
    prompt: string,
    options: {
      temperature?: number,
      maxTokens?: number,
      system?: string,
      topP?: number,
      stopSequences?: string[]
    } = {}
  ): Promise<{ text: string, usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number } }> {
    if (!this.apiKey) {
      throw new Error('Groq API key not provided. Cannot generate completions.');
    }
    
    // Set default options
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 1024;
    const system = options.system ?? "You are a helpful AI assistant.";
    const topP = options.topP ?? 0.9;
    const stopSequences = options.stopSequences ?? [];
    
    if (this.debug) {
      console.log(`Sending prompt to Groq (${this.model}):`, { 
        promptLength: prompt.length,
        temperature,
        maxTokens
      });
    }

    try {
      // Implement retry logic
      let attempt = 0;
      let lastError;
      
      while (attempt < this.maxRetries) {
        try {
          const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            stop: stopSequences.length > 0 ? stopSequences : undefined
          });
          
          // Extract the response text
          const responseText = completion.choices[0]?.message?.content || '';
          
          // Extract token usage
          const usage = {
            prompt_tokens: completion.usage?.prompt_tokens || 0,
            completion_tokens: completion.usage?.completion_tokens || 0,
            total_tokens: completion.usage?.total_tokens || 0
          };
          
          if (this.debug) {
            console.log(`Groq response received. Tokens used: ${usage.total_tokens}`);
          }
          
          return { 
            text: responseText,
            usage
          };
        } catch (error) {
          lastError = error;
          attempt++;
          
          if (this.debug) {
            console.error(`Groq API error (attempt ${attempt}/${this.maxRetries}):`, error);
          }
          
          // Wait before retrying (with exponential backoff)
          if (attempt < this.maxRetries) {
            const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s, ...
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
      
      // If we've exhausted all retries, throw the last error
      throw lastError;
    } catch (error) {
      console.error('Error sending completion request to Groq:', error);
      throw new Error(`Failed to get completion from Groq: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if the API client is properly configured
   * 
   * @returns True if the client has a valid API key
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
  
  /**
   * Get the currently configured model
   * 
   * @returns The model name
   */
  getModel(): string {
    return this.model;
  }
  
  /**
   * Change the model being used
   * 
   * @param model - New model name
   */
  setModel(model: string): void {
    this.model = model;
    if (this.debug) {
      console.log(`Groq model changed to: ${this.model}`);
    }
  }
} 