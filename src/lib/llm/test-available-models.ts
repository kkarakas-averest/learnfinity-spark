/**
 * Test script to check available models in Groq API
 * This helps identify which models are currently available
 */

import { GroqAPI } from './groq-api';
import { LLMService } from './llm-service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get API key from environment variables
const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

async function testModelAvailability() {
  if (!apiKey) {
    console.error('Error: No Groq API key found in environment variables');
    console.error('Make sure VITE_GROQ_API_KEY or GROQ_API_KEY is set in your .env file');
    process.exit(1);
  }

  console.log('Testing available Groq API models...');
  
  // Initialize Groq API with default model
  const groqApi = new GroqAPI(apiKey, 'llama3-8b-8192', { debug: true });
  
  // Check if API is configured
  if (!groqApi.isConfigured()) {
    console.error('Error: Groq API is not properly configured');
    process.exit(1);
  }
  
  // Models to check
  const modelsToCheck = [
    'llama3-8b-8192',
    'llama3-70b-8192',
    'gemma-7b-it',
    'mixtral-8x7b-32768', // This should be unavailable
    'llama2-70b-4096'
  ];
  
  // Check each model
  console.log('Checking model availability:');
  for (const model of modelsToCheck) {
    const isAvailable = await groqApi.checkModelAvailability(model);
    console.log(`- ${model}: ${isAvailable ? '✅ Available' : '❌ Not available'}`);
  }
  
  // Test model fallback mechanism
  console.log('\nTesting model fallback mechanism...');
  
  // Initialize LLM Service with intentionally invalid model
  const llmService = LLMService.getInstance({
    provider: 'groq',
    apiKey: apiKey,
    model: 'mixtral-8x7b-32768', // Intentionally using decommissioned model
    debugMode: true
  });
  
  // Try to get a completion
  try {
    console.log('Trying completion with invalid model (should fall back to valid model)');
    const result = await llmService.complete('Explain in one sentence what personalized learning is.');
    console.log('Result:', result.substring(0, 100) + (result.length > 100 ? '...' : ''));
    console.log('✅ Fallback mechanism worked successfully');
  } catch (error) {
    console.error('❌ Fallback mechanism failed:', error.message);
  }
}

// Run the test
testModelAvailability().catch(error => {
  console.error('Error in test:', error);
}); 