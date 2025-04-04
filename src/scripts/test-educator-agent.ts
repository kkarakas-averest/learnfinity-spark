/**
 * Test script for EducatorAgent implementation
 * 
 * This script tests the content generation capabilities of the EducatorAgent
 * to ensure proper behavior with and without LLM integration.
 * 
 * How to run:
 * 1. Make sure VITE_GROQ_API_KEY is properly set in your .env file (or not, to test mock behavior)
 * 2. Run: npx tsx src/scripts/test-educator-agent.ts
 */

import { AgentFactory } from '../agents/AgentFactory';
import { ContentType, DifficultyLevel } from '../types/course.types';
import { ContentCreatorAgent, ContentGenerationRequest } from '../agents/types';
import { EducatorAgent } from '../agents/roles/EducatorAgent';

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

async function testEducatorAgent() {
  console.log(`${colors.bright}${colors.blue}=== EducatorAgent Test ====${colors.reset}\n`);
  
  // Initialize AgentFactory
  console.log(`${colors.cyan}Initializing AgentFactory...${colors.reset}`);
  const agentFactory = AgentFactory.getInstance();
  
  // Create EducatorAgent instance
  console.log(`${colors.cyan}Creating EducatorAgent...${colors.reset}`);
  const educatorAgent = agentFactory.createAgent('educator') as ContentCreatorAgent;
  
  if (!educatorAgent) {
    console.log(`${colors.red}❌ Failed to create EducatorAgent${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✓ EducatorAgent created successfully${colors.reset}`);
  
  // Initialize the agent
  console.log(`${colors.cyan}Initializing EducatorAgent...${colors.reset}`);
  try {
    await educatorAgent.initialize();
    console.log(`${colors.green}✓ EducatorAgent initialized successfully${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ EducatorAgent initialization failed: ${error}${colors.reset}`);
    return;
  }
  
  // Test content generation
  console.log(`\n${colors.cyan}Testing content generation...${colors.reset}`);
  
  // Create a simple content request
  const contentRequest: ContentGenerationRequest = {
    contentType: ContentType.TEXT,
    topic: 'Effective Communication in the Workplace',
    targetAudience: {
      skillLevel: DifficultyLevel.INTERMEDIATE,
      role: 'Manager',
      department: 'Operations'
    },
    learningObjectives: [
      'Understand key principles of workplace communication',
      'Learn techniques for active listening',
      'Develop strategies for handling difficult conversations'
    ],
    keywords: ['communication', 'workplace', 'active listening', 'feedback'],
    // Add any other required properties
  } as ContentGenerationRequest;
  
  // Add any non-type properties separately
  const fullRequest = {
    ...contentRequest,
    includeExamples: true,
    includeQuizQuestions: true
  };
  
  console.log(`${colors.bright}Content request:${colors.reset}`);
  console.log(`- Topic: ${fullRequest.topic}`);
  console.log(`- Audience: ${fullRequest.targetAudience.role} in ${fullRequest.targetAudience.department} (${fullRequest.targetAudience.skillLevel})`);
  console.log(`- Objectives: ${fullRequest.learningObjectives.length} objectives defined`);
  
  try {
    console.log(`\n${colors.cyan}Generating content...${colors.reset}`);
    const startTime = Date.now();
    
    // Call the method that's failing in the application
    const content = await educatorAgent.generateContentForRequest(fullRequest);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log(`${colors.green}✓ Content generated successfully in ${duration.toFixed(2)}s${colors.reset}`);
    console.log(`${colors.bright}Generated content:${colors.reset}`);
    console.log(`- Title: ${content.title}`);
    if ('format' in content) {
      console.log(`- Format: ${(content as any).format}`);
    }
    
    // Check if we have sections in the response
    if ('mainContent' in content) {
      console.log(`- Main content: ${(content as any).mainContent.substring(0, 100)}...`);
    }
    
    // Check if we have sections in the response
    if ('sections' in content && Array.isArray((content as any).sections)) {
      console.log(`- Sections: ${(content as any).sections.length} sections included`);
      (content as any).sections.forEach((section: any, index: number) => {
        console.log(`  ${index + 1}. ${section.title}`);
      });
    } else {
      console.log(`${colors.yellow}⚠️ No sections found in the response${colors.reset}`);
    }
    
    // Check if quiz was generated
    if ('quiz' in content) {
      const quiz = (content as any).quiz;
      console.log(`- Quiz: ${quiz && quiz.questions ? quiz.questions.length : 0} questions included`);
    } else {
      console.log(`${colors.yellow}⚠️ No quiz found in the response${colors.reset}`);
    }
    
    // Output full content structure for debugging
    console.log(`\n${colors.cyan}Complete content structure:${colors.reset}`);
    console.log(JSON.stringify(content, null, 2));
    
  } catch (error) {
    console.log(`${colors.red}❌ Content generation failed:${colors.reset}`);
    console.error(error);
  }
  
  console.log(`\n${colors.bright}${colors.blue}=== Test complete ====${colors.reset}`);
}

// Run the test
testEducatorAgent().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 