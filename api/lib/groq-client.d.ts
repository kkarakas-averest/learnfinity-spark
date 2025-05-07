// Type definitions for groq-client.js

export interface GroqClientOptions {
  model?: string;
  prompt?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  max_tokens?: number;
  topP?: number;
  stopSequences?: string[];
  outputSchema?: object;
}

export interface GroqClient {
  models: Record<string, string>;
  complete(prompt: string, options?: GroqClientOptions): Promise<string>;
  generateWithStructuredOutput(options: GroqClientOptions): Promise<any>;
}

export function createGroqClient(apiKey?: string): GroqClient; 