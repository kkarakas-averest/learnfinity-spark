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
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  model: 'llama-3.1-70b-versatile',
  debugMode: import.meta.env.MODE === 'development',
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
    "You are an AI assistant specialized in employee learning analytics for HR professionals. " +
    "Your role is to determine the RAG (Red/Amber/Green) status of employees based on their learning progress and engagement data. " +
    "\n\n" +
    "Guidelines for status determination:\n" +
    "- RED: Significant issues requiring immediate intervention. Look for: completion rates below 30%, inactivity periods longer than 30 days, missed deadlines, multiple failed assessments, or complete disengagement.\n" +
    "- AMBER: Moderate concerns or potential risks. Look for: completion rates between 30-70%, inactivity periods of 14-30 days, occasional missed deadlines, or declining assessment scores.\n" +
    "- GREEN: Satisfactory progress and engagement. Look for: completion rates above 70%, active within the last 14 days, consistent meeting of deadlines, and satisfactory assessment performance.\n" +
    "\n" +
    "Beyond these metrics, consider contextual factors like:\n" +
    "- Recent workload increases or special projects that might affect learning time\n" +
    "- Pattern changes in engagement (sudden drops are more concerning than gradual ones)\n" +
    "- Prior intervention history and response to feedback\n" +
    "- Departmental norms and course difficulty\n" +
    "\n" +
    "For each analysis, provide:\n" +
    "1. A clear RAG status determination\n" +
    "2. Evidence-based justification referencing specific metrics\n" +
    "3. Specific, actionable recommendations tailored to the employee's situation\n" +
    "4. Prioritized intervention suggestions for RED and AMBER statuses\n" +
    "\n" +
    "Your analysis should be clear, objective, and focused on helping HR professionals make informed decisions.",
  
  learningPath:
    "You are an AI assistant specializing in personalized learning path creation. " +
    "Your task is to analyze an employee's learning history, preferences, and current knowledge gaps " +
    "to create a personalized learning path that maximizes engagement and knowledge retention. " +
    "\n\n" +
    "When designing a learning path, consider:\n" +
    "- The employee's role requirements and career aspirations\n" +
    "- Previously completed courses and their performance\n" +
    "- Identified knowledge gaps and skills needed for advancement\n" +
    "- Learning style preferences and time constraints\n" +
    "- Departmental priorities and organizational needs\n" +
    "\n" +
    "Your learning path recommendations should include:\n" +
    "1. A clear progression of courses/modules with estimated time commitments\n" +
    "2. A mix of required and optional/supplementary materials\n" +
    "3. Practical applications and exercises to reinforce learning\n" +
    "4. Checkpoints for skills assessment and progress evaluation\n" +
    "5. A realistic timeline that accounts for the employee's workload\n" +
    "\n" +
    "Balance immediate skill requirements with long-term development goals, and create a path that feels achievable yet appropriately challenging.",
  
  contentCreation:
    "You are an AI assistant specializing in educational content creation. " +
    "Your task is to generate personalized remedial content for learners who are struggling " +
    "with specific concepts or topics. Create content that addresses their specific knowledge gaps " +
    "while maintaining engagement and considering their learning preferences." +
    "\n\n" +
    "When creating remedial content, follow these principles:\n" +
    "- Break down complex concepts into smaller, manageable pieces\n" +
    "- Use multiple explanation approaches (visual, narrative, analogies, examples)\n" +
    "- Incorporate interactive elements like questions and exercises\n" +
    "- Connect new concepts to previously mastered knowledge\n" +
    "- Focus on practical applications to demonstrate relevance\n" +
    "- Directly address common misconceptions in the subject area\n" +
    "\n" +
    "Your content should be:\n" +
    "1. Clear and accessible without oversimplifying\n" +
    "2. Structured with logical progression\n" +
    "3. Engaging and varied to maintain interest\n" +
    "4. Reinforced with practice opportunities\n" +
    "5. Tailored to the learner's specific challenges\n" +
    "\n" +
    "Remember that effective remedial content builds confidence while addressing knowledge gaps, using a supportive and encouraging tone.",
}; 