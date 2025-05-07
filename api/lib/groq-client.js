// Server-side Groq API client for API routes
// This is a simplified client for AI feature usage in Vercel serverless functions

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Use environment variable or fallback to hardcoded key (not recommended for production)
const GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_0123456789abcdef";

/**
 * Initialize Groq client
 */
export function createGroqClient(apiKey = GROQ_API_KEY) {
  // Define standard models for easier access
  const models = {
    LLAMA_3_8B: 'llama3-8b-8192',
    LLAMA_3_70B: 'llama3-70b-8192',
    MIXTRAL_8X7B: 'mixtral-8x7b-32768'
  };

  /**
   * Generate a completion using Groq API
   */
  async function complete(
    prompt,
    options = {}
  ) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: models.LLAMA_3_70B,
          messages: [
            { role: 'system', content: options.system || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          top_p: options.topP ?? 1,
          stop: options.stopSequences || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }

  /**
   * Generate a structured output using Groq API
   */
  async function generateWithStructuredOutput(
    options = {}
  ) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: options.model || models.LLAMA_3_70B,
          messages: [
            { 
              role: 'system', 
              content: `You are an AI that generates structured data. Always respond with valid JSON matching the following schema: ${JSON.stringify(options.outputSchema)}` 
            },
            { role: 'user', content: options.prompt }
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse the JSON content
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error('Error parsing Groq response as JSON:', error);
        throw new Error('Failed to parse Groq response as structured output');
      }
    } catch (error) {
      console.error('Error generating structured output with Groq API:', error);
      throw error;
    }
  }

  return {
    models,
    complete,
    generateWithStructuredOutput
  };
}

// ES Module export (already exported above)
// No module.exports needed 