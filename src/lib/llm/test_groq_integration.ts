/**
 * Test script for Groq API integration
 * This script demonstrates how to use the Groq API for personalization and content creation
 */

import { LLMService } from './llm-service';
import { GroqAPI } from './groq-api';
import envConfig from '../env-config';

async function main() {
  console.log('Testing Groq API Integration for Personalization and Content Creation');
  
  // Step 1: Initialize the LLM service with Groq API
  console.log('\n1. Initializing LLM Service with Groq API...');
  const llmService = LLMService.getInstance({
    provider: 'groq',
    apiKey: envConfig.groqApiKey,
    model: 'llama3-8b-8192',
    debugMode: true
  });
  
  if (!llmService.isConfigured()) {
    console.error('ERROR: LLM Service is not properly configured');
    console.error('Make sure VITE_GROQ_API_KEY is set in your .env file');
    process.exit(1);
  }
  
  console.log('✅ LLM Service initialized successfully');
  
  // Step 2: Create a test employee profile
  console.log('\n2. Creating a test employee profile...');
  const employeeData = {
    id: 'emp-001',
    name: 'Alex Johnson',
    role: 'Data Scientist',
    department: 'Analytics',
    skills: ['Python', 'SQL', 'Machine Learning basics'],
    experience: 'mid-level',
    learningPreferences: {
      format: 'interactive',
      timeAvailable: '3 hours per week',
      interests: ['Deep Learning', 'MLOps', 'Data Visualization']
    }
  };
  
  console.log('Employee data:', employeeData);
  
  // Step 3: Generate an employee profile using Groq API
  console.log('\n3. Generating a detailed employee profile...');
  try {
    const profile = await llmService.generateEmployeeProfile(employeeData);
    console.log('Generated Profile:');
    console.log(JSON.stringify(profile, null, 2));
    
    // Step 4: Create a learning path for the employee
    console.log('\n4. Creating a personalized learning path...');
    const learningPath = await llmService.generateLearningPath(employeeData, profile);
    console.log('Generated Learning Path:');
    console.log(JSON.stringify(learningPath, null, 2));
    
    // Step 5: Create content for the first module in the learning path
    console.log('\n5. Creating content for the first module...');
    const module = learningPath.modules[0];
    const content = await llmService.generateContent({
      module: module,
      profile: profile,
      learningPath: learningPath
    });
    console.log('Generated Content for Module:', module.title);
    console.log(JSON.stringify(content, null, 2));
    
    console.log('\n✅ All steps completed successfully');
    
  } catch (error) {
    console.error('Error during Groq API integration test:', error);
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 