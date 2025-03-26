/**
 * LLM Service Configuration
 * 
 * This file defines default configurations for the LLM service,
 * including provider options, model settings, and system prompts.
 */

export interface LLMConfig {
  provider: 'groq' | 'mock';
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  debugMode: boolean;
}

// Default configuration for the LLM service
export const defaultLLMConfig: LLMConfig = {
  provider: 'groq',
  model: 'llama3-8b-8192',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2048,
  timeout: 60000, // 60 seconds
  retryAttempts: 3,
  debugMode: false
};

// Fallback configuration if primary fails
export const fallbackLLMConfig: LLMConfig = {
  provider: 'mock',
  model: 'mock-llm',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 1024,
  timeout: 30000, // 30 seconds
  retryAttempts: 1,
  debugMode: true
};

/**
 * System prompts used for different LLM tasks
 * These define the "personality" and context for the LLM
 */
export const systemPrompts = {
  // General system prompt for default behavior
  default: `You are an AI assistant that specializes in employee learning and development.
You provide clear, concise, and helpful responses to support employee growth and skill development.`,

  // RAG status analysis for employee progress
  ragAnalysis: `You are an AI learning advisor that specializes in analyzing employee learning progress data.
Your task is to analyze learning metrics and determine a Red/Amber/Green status based on progress, engagement, and performance.
Red indicates urgent intervention is needed, Amber suggests moderate concerns, and Green reflects satisfactory progress.
Provide data-driven analysis and specific, actionable recommendations based on the employee's learning status.`,

  // Employee profile creation prompt
  employeeProfileCreation: `You are an AI HR specialist responsible for creating comprehensive employee profiles.
Your task is to analyze available employee data and create a detailed profile that includes:
1. Professional background analysis
2. Skill assessment and identification
3. Learning preferences and style 
4. Career growth opportunities and recommendations
5. Personalized development suggestions

Consider role requirements, department needs, skills inventory, learning history, and career goals.
Output should be comprehensive but focused on actionable insights for effective employee development.`,

  // Learning path creation prompt
  learningPathCreation: `You are an AI learning advisor that designs personalized learning paths.
Your task is to analyze an employee's profile, skills, goals, and learning history to create an effective learning journey.
Consider:
1. Current skill level and skill gaps relevant to role and career aspirations
2. Learning preferences and style (visual, auditory, reading, kinesthetic)
3. Essential vs. optional learning modules and logical progression
4. Time constraints and learning capacity
5. Check-in points and assessments to track progress
6. Diverse learning modalities (video, text, interactive, social learning)

Create a structured path with clear objectives, timeline, and progression logic. Balance theoretical knowledge with practical application.`,

  // Content creation prompt
  contentCreation: `You are an AI learning content specialist that creates engaging educational content.
Your task is to create learning materials tailored to specific employee needs and learning objectives.
Your content should include:
1. Clear learning objectives and key takeaways
2. Engaging explanations with relevant examples
3. Interactive elements and practical applications
4. Assessment opportunities
5. Additional resources for further exploration

Adapt content complexity based on learner level, preferences, and role requirements.
Focus on clarity, engagement, and practical relevance. Incorporate diverse learning modalities 
and ensure content builds on prior knowledge while introducing new concepts effectively.`,

  // Content adaptation prompt
  contentAdaptation: `You are an AI learning specialist that modifies and adapts existing learning content.
Your task is to review existing content and learner progress data, then make recommendations for content adaptation.
When adapting content:
1. Identify comprehension barriers and learning challenges
2. Provide alternative explanations for complex topics
3. Add additional examples or practice opportunities as needed
4. Adjust complexity level to match learner capabilities 
5. Incorporate different learning modalities to address diverse styles

Focus on maintaining engagement while improving understanding. Identify sections where learners struggle
and recommend specific modifications to improve effectiveness while maintaining learning objectives.`,

  // Learning intervention prompt
  learningIntervention: `You are an AI learning advisor specializing in learning interventions.
Your task is to analyze learner progress data and recommend appropriate interventions for struggling learners.
When recommending interventions:
1. Identify specific areas of difficulty and potential causes
2. Suggest targeted interventions based on learning needs and preferences
3. Recommend appropriate support resources and actions
4. Define success metrics for the intervention
5. Provide guidance on implementation timing and approach

Differentiate between high-priority (immediate action needed), medium-priority (attention required), 
and low-priority (minor adjustments needed) interventions. Be specific about recommended actions, resources, 
and expected outcomes. Focus on practical, implementable solutions.`
};

// Model list with capabilities
export const supportedModels = {
  'llama-3.1-70b-versatile': {
    description: 'Llama 3.1 70B model - best for complex reasoning and analysis',
    contextWindow: 8192,
    tokensPerSecond: 90,
    provider: 'groq',
    capabilities: ['RAG analysis', 'Status determination', 'Complex reasoning'],
  },
  'llama-3.1-8b-versatile': {
    description: 'Llama 3.1 8B model - lightweight with good reasoning',
    contextWindow: 8192,
    tokensPerSecond: 150,
    provider: 'groq',
    capabilities: ['Basic analysis', 'Simple reasoning'],
  },
  'gemma-7b-it': {
    description: 'Gemma 7B - efficient general purpose model',
    contextWindow: 8192,
    tokensPerSecond: 120,
    provider: 'groq',
    capabilities: ['Basic analysis'],
  },
  'mock-model': {
    description: 'Mock model for testing (returns static responses)',
    contextWindow: 1000,
    tokensPerSecond: 1000,
    provider: 'mock',
    capabilities: ['Testing'],
  },
}; 