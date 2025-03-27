import './setup';

import { describe, test, expect, beforeAll, jest, afterAll } from '@jest/globals';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables first
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

// Set default test environment variables if not set
process.env.VITE_GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || 'test-api-key';
process.env.VITE_ENABLE_LLM = 'true';
process.env.VITE_DEBUG = 'true';

// Mock the env-config module
jest.mock('../../env-config', () => {
  return jest.requireActual('./mocks/env-config');
});

// Mock fetch without using jest.fn() to avoid TypeScript errors
const originalFetch = global.fetch;
global.fetch = async function mockFetch(url, options) {
  // Default success response
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: 'Test response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    })
  } as Response;
};

let GroqAPI: any;
let groqApi: any;

beforeAll(async () => {
  try {
    // Import modules after mocks are set up
    const groqApiModule = await import('../groq-api');
    GroqAPI = groqApiModule.GroqAPI;
    
    const apiKey = 'test-api-key';
    console.log('Using API key:', apiKey ? 'Present' : 'Not present');
    
    // Initialize Groq API directly for testing
    groqApi = new GroqAPI(apiKey, 'mixtral-8x7b-32768', { debug: true });
    
    // Set longer timeout for all tests
    jest.setTimeout(30000);
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

// Restore original fetch after tests
afterAll(() => {
  global.fetch = originalFetch;
});

describe('Groq API Integration', () => {
  test('Groq API is configured', () => {
    expect(groqApi).toBeTruthy();
    expect(groqApi.isConfigured()).toBe(true);
  });

  test('Groq API can complete a simple prompt', async () => {
    // Override fetch for this test
    global.fetch = async function(url, options) {
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '4' } }],
          usage: { prompt_tokens: 8, completion_tokens: 1, total_tokens: 9 }
        })
      } as Response;
    };

    const prompt = 'What is 2+2? Answer in one word.';
    const response = await groqApi.complete(prompt, {
      temperature: 0.1,
      maxTokens: 10
    });

    expect(response).toBeTruthy();
    expect(response.text).toBe('4');
    expect(response.usage.total_tokens).toBe(9);
  });

  test('Groq API handles system prompts correctly', async () => {
    // Override fetch for this test
    global.fetch = async function(url, options) {
      // Verify that system prompt is included
      const body = JSON.parse(options?.body as string || '{}');
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('one word');
      
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Paris' } }],
          usage: { prompt_tokens: 15, completion_tokens: 1, total_tokens: 16 }
        })
      } as Response;
    };
    
    const prompt = 'What is the capital of France?';
    const systemPrompt = 'You are a helpful assistant that only answers with one word.';
    
    const response = await groqApi.complete(prompt, {
      system: systemPrompt,
      temperature: 0.1,
      maxTokens: 10
    });

    expect(response.text).toBe('Paris');
    expect(response.usage.total_tokens).toBe(16);
  });

  test('Groq API handles error cases gracefully', async () => {
    // Override fetch for this test with an error response
    global.fetch = async function(url, options) {
      return {
        ok: false,
        json: async () => ({
          error: { message: 'Invalid API key' }
        })
      } as Response;
    };
    
    // Test error handling
    await expect(groqApi.complete('test')).rejects.toThrow('Groq API error: Invalid API key');
  });

  test('Groq API respects token limits', async () => {
    // Override fetch for this test
    global.fetch = async function(url, options) {
      // Verify max_tokens is passed correctly
      const body = JSON.parse(options?.body as string || '{}');
      expect(body.max_tokens).toBe(50);
      
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'A short story about a robot painter' } }],
          usage: { prompt_tokens: 10, completion_tokens: 45, total_tokens: 55 }
        })
      } as Response;
    };
    
    const prompt = 'Write a short story about a robot learning to paint.';
    const response = await groqApi.complete(prompt, {
      maxTokens: 50
    });

    expect(response.text).toBeTruthy();
    expect(response.usage.completion_tokens).toBeLessThanOrEqual(50);
  });

  test('Groq API handles temperature settings', async () => {
    // Override fetch for the first call
    global.fetch = async function(url, options) {
      const body = JSON.parse(options?.body as string || '{}');
      // Verify temperature is passed correctly
      expect(body.temperature).toBe(0.1);
      
      // Set up for the next call
      global.fetch = async function(url, options) {
        const body = JSON.parse(options?.body as string || '{}');
        expect(body.temperature).toBe(0.9);
        
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'red' } }],
            usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 }
          })
        } as Response;
      };
      
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'blue' } }],
          usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 }
        })
      } as Response;
    };
    
    const prompt = 'Write a one-word color.';
    const response1 = await groqApi.complete(prompt, {
      temperature: 0.1
    });
    const response2 = await groqApi.complete(prompt, {
      temperature: 0.9
    });

    expect(response1.text).toBe('blue');
    expect(response2.text).toBe('red');
  });
}); 