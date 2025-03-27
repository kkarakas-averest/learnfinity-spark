/**
 * Simple Node.js test script for Groq API integration
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { GroqAPI } from './groq-api';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Set up import.meta.env for compatibility
if (typeof globalThis.import === 'undefined') {
  (globalThis as any).import = {
    meta: {
      env: {
        MODE: 'development',
        VITE_APP_NAME: 'Learnfinity Test',
        VITE_GROQ_API_KEY: "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",
        VITE_ENABLE_LLM: 'true',
        VITE_DEBUG: 'true'
      }
    }
  };
}

async function main() {
  console.log('Simple Groq API Test');
  
  // Use the provided API key directly
  const apiKey = "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";
  console.log('API Key available:', !!apiKey);
  
  if (!apiKey) {
    console.error('ERROR: Groq API key not found');
    process.exit(1);
  }
  
  // Log a masked version of the key for debugging
  const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  console.log('Using API key (masked):', maskedKey);
  
  // Initialize the Groq API
  const groqApi = new GroqAPI(apiKey, 'mixtral-8x7b-32768', { debug: true });
  console.log('Groq API configured:', groqApi.isConfigured());
  
  try {
    // Simple test prompt
    const response = await groqApi.complete('What is 2+2? Answer with just a number.');
    console.log('Response:', response.text);
    console.log('Tokens used:', response.usage.total_tokens);
    console.log('Test successful!');
  } catch (error) {
    console.error('Error during Groq API test:', error);
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 