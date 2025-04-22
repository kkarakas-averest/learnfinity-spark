/**
 * Simplified Agent Factory
 * 
 * A minimal implementation that supports only the CV Profile summarization feature.
 * All other agent functionality has been removed.
 */

import { supabase } from '@/lib/supabase';

// Simple interface for agent functionality
interface Agent {
  runPrompt: (prompt: string) => Promise<string>;
}

// Simple content agent implementation
class SimpleContentAgent implements Agent {
  async runPrompt(prompt: string): Promise<string> {
    // Try Groq LLMService first
    try {
      // Dynamically import LLMService to avoid circular deps
      const { LLMService } = await import('@/lib/llm/llm-service');
      const llmService = LLMService.getInstance();
      if (llmService.isConfigured()) {
        // Use Groq LLM for completion
        const result = await llmService.complete(prompt, {
          maxTokens: 500,
          temperature: 0.7
        });
        if (result && typeof result === 'string' && result.trim().length > 0) {
          return result.trim();
        }
      }
    } catch (err) {
      // If LLMService is not available or fails, fallback to OpenAI
      console.warn('LLMService unavailable or failed, falling back to OpenAI:', err);
    }
    // Fallback: Use OpenAI API directly
    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-instruct",
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7
        })
      });
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.choices[0].text.trim();
    } catch (error) {
      console.error("Error in content agent (OpenAI fallback):", error);
      return "Unable to generate profile summary at this time. Please try again later.";
    }
  }
}

export class AgentFactory {
  private static instance: AgentFactory;
  
  private constructor() {
    // Private constructor to implement singleton
  }
  
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }
  
  /**
   * Creates a simple content agent for CV summarization
   */
  public createAgent(type: string): Agent {
    // This simplified version only supports 'educator' type for CV summarization
    if (type === 'educator') {
      return new SimpleContentAgent();
    }
    
    throw new Error(`Agent type '${type}' is not supported in this simplified version`);
  }
} 