/**
 * Test script for Groq API integration
 * 
 * This script tests the direct interaction with the Groq API
 * to ensure proper configuration and content generation.
 * 
 * How to run:
 * 1. Make sure the VITE_GROQ_API_KEY is properly set in your .env file
 * 2. Run: npx tsx src/scripts/test-groq-api.ts
 */

// Load environment variables from .env file
import 'dotenv/config';

import { GroqAPI } from '../lib/llm/groq-api';
import { LLMService } from '../lib/llm/llm-service';
import envConfig from '../lib/env-config';

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testGroqAPI() {
  console.log(`${colors.bright}${colors.blue}=== Groq API Test ====${colors.reset}\n`);
  
  // Check environment configuration
  console.log(`${colors.cyan}Environment check:${colors.reset}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`- DEBUG: ${envConfig.debug ? 'enabled' : 'disabled'}`);
  console.log(`- APP NAME: ${envConfig.appName}`);
  
  // Check API key configuration
  const apiKey = envConfig.groqApiKey;
  console.log(`\n${colors.cyan}API Key check:${colors.reset}`);
  
  if (!apiKey) {
    console.log(`${colors.red}❌ Groq API key not found in environment variables${colors.reset}`);
    console.log(`Please add VITE_GROQ_API_KEY to your .env file.`);
    return;
  } else {
    console.log(`${colors.green}✓ Groq API key found${colors.reset}`);
    console.log(`- API Key: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)} (${apiKey.length} chars)`);
  }
  
  // Test direct Groq API instance
  console.log(`\n${colors.cyan}Testing direct GroqAPI instance:${colors.reset}`);
  
  try {
    const groqAPI = new GroqAPI(
      apiKey,
      'llama3-8b-8192',
      { debug: true, maxRetries: 1 }
    );
    
    console.log(`${colors.green}✓ GroqAPI instance created${colors.reset}`);
    console.log(`- Model: ${groqAPI.getModel()}`);
    console.log(`- Configured: ${groqAPI.isConfigured() ? 'Yes' : 'No'}`);
    
    // Check model availability
    console.log(`\n${colors.cyan}Checking model availability:${colors.reset}`);
    const isModelAvailable = await groqAPI.checkModelAvailability();
    if (isModelAvailable) {
      console.log(`${colors.green}✓ Model is available${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Model is not available - check Groq dashboard${colors.reset}`);
    }
    
    // Test a simple completion
    console.log(`\n${colors.cyan}Testing simple completion:${colors.reset}`);
    const prompt = "Generate a very brief greeting for a learning platform user";
    
    const startTime = Date.now();
    const completion = await groqAPI.complete(prompt, {
      temperature: 0.7,
      maxTokens: 100
    });
    const endTime = Date.now();
    
    console.log(`${colors.green}✓ Completion successful in ${endTime - startTime}ms${colors.reset}`);
    console.log(`- Response: "${completion.text.trim()}"`);
    console.log(`- Tokens: prompt=${completion.usage.prompt_tokens}, completion=${completion.usage.completion_tokens}, total=${completion.usage.total_tokens}`);
  } catch (error) {
    console.log(`${colors.red}❌ GroqAPI test failed:${colors.reset}`);
    console.error(error);
  }
  
  // Test through LLMService
  console.log(`\n${colors.cyan}Testing through LLMService:${colors.reset}`);
  
  try {
    const llmService = LLMService.getInstance();
    
    console.log(`${colors.green}✓ LLMService instance created${colors.reset}`);
    console.log(`- Provider: ${llmService.getConfig().provider}`);
    console.log(`- Model: ${llmService.getModel()}`);
    
    // Simple completion test
    console.log(`\n${colors.cyan}Testing LLMService completion:${colors.reset}`);
    const prompt = "What are three key benefits of personalized learning?";
    
    const startTime = Date.now();
    const completion = await llmService.complete(prompt, {
      temperature: 0.7,
      maxTokens: 200
    });
    const endTime = Date.now();
    
    console.log(`${colors.green}✓ LLMService completion successful in ${endTime - startTime}ms${colors.reset}`);
    console.log(`- Response preview: "${completion.substring(0, 100)}${completion.length > 100 ? '...' : ''}"`);
    
    // Check usage stats
    const usageStats = llmService.getUsageStats();
    console.log(`\n${colors.cyan}Usage stats:${colors.reset}`);
    console.log(`- Total tokens: ${usageStats.total_tokens}`);
    console.log(`- Requests: ${usageStats.requests}`);
  } catch (error) {
    console.log(`${colors.red}❌ LLMService test failed:${colors.reset}`);
    console.error(error);
  }
  
  console.log(`\n${colors.bright}${colors.blue}=== Test complete ====${colors.reset}`);
}

// Run the test
testGroqAPI().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 