/**
 * LLM Configuration
 * 
 * This file contains configuration settings for Large Language Models
 * used throughout the application.
 */

export interface LLMConfig {
  provider: 'groq' | 'mock';
  apiKey?: string;
  model: string;
  debugMode: boolean;
  maxTokens: number;
  temperature: number;
  retryAttempts: number;
  timeout: number; // in milliseconds
}

// Default configuration used when no override is provided
export const defaultLLMConfig: LLMConfig = {
  provider: 'groq',
  apiKey: process.env.GROQ_API_KEY || '',
  model: 'llama-3.1-70b-versatile',
  debugMode: process.env.NODE_ENV === 'development',
  maxTokens: 1024,
  temperature: 0.7,
  retryAttempts: 3,
  timeout: 30000, // 30 seconds
};

// Fallback configuration used when API key is missing or provider fails
export const fallbackLLMConfig: LLMConfig = {
  provider: 'mock',
  model: 'mock-model',
  debugMode: true,
  maxTokens: 1024,
  temperature: 0.7,
  retryAttempts: 1,
  timeout: 1000,
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

// System prompts for various tasks
export const systemPrompts = {
  ragAnalysis: 
    "You are an AI assistant specializing in analyzing employee learning progress. " +
    "Your task is to determine the RAG (Red/Amber/Green) status based on their progress metrics and engagement data. " +
    "- RED indicates significant issues requiring immediate intervention. " +
    "- AMBER indicates moderate concerns or risks of falling behind. " +
    "- GREEN indicates satisfactory progress and engagement. " +
    "Consider completion rates, time since last activity, assessment scores, and engagement patterns in your analysis.",
  
  learningPath:
    "You are an AI assistant specializing in personalized learning. " +
    "Your task is to analyze an employee's learning history, preferences, and current knowledge gaps " +
    "to create a personalized learning path that maximizes engagement and knowledge retention. " +
    "Recommend specific courses, modules, and learning activities that address their needs.",
  
  contentCreation:
    "You are an AI assistant specializing in educational content creation. " +
    "Your task is to generate personalized remedial content for learners who are struggling " +
    "with specific concepts or topics. Create content that addresses their specific knowledge gaps " +
    "while maintaining engagement and considering their learning preferences.",
}; 