/**
 * Environment Configuration
 * 
 * This file provides a central place to manage environment variables and configuration
 * settings used throughout the application.
 */

// Import environment variables from .env file if in development
if (process.env.NODE_ENV === 'development') {
  try {
    // dotenv may already be loaded by Vite
    require('dotenv').config();
  } catch (e) {
    console.warn('Failed to load dotenv, continuing with existing environment variables');
  }
}

// Define the shape of our environment configuration
interface EnvConfig {
  // Application configuration
  appName: string;
  environment: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  debug: boolean;
  
  // API keys
  supabaseUrl: string;
  supabaseAnonKey: string;
  groqApiKey: string | null;
  
  // Feature flags
  enableLLM: boolean;
  enableBatchProcessing: boolean;
  enableNotifications: boolean;
  
  // Performance settings
  batchSize: number;
  maxConcurrentRequests: number;
}

/**
 * Centralized environment configuration
 */
export const envConfig: EnvConfig = {
  // Application configuration
  appName: process.env.APP_NAME || 'Learnfinity',
  environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  
  // API keys - read from environment variables
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || null,
  
  // Feature flags
  enableLLM: process.env.ENABLE_LLM !== 'false',
  enableBatchProcessing: process.env.ENABLE_BATCH_PROCESSING !== 'false',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
  
  // Performance settings
  batchSize: parseInt(process.env.BATCH_SIZE || '5', 10),
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3', 10),
};

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof Pick<EnvConfig, 'enableLLM' | 'enableBatchProcessing' | 'enableNotifications'>): boolean {
  return envConfig[featureName];
}

/**
 * Helper to check if the required API keys are set
 */
export function isApiConfigured(apiName: 'supabase' | 'groq'): boolean {
  switch (apiName) {
    case 'supabase':
      return Boolean(envConfig.supabaseUrl && envConfig.supabaseAnonKey);
    case 'groq':
      return Boolean(envConfig.groqApiKey);
    default:
      return false;
  }
}

/**
 * Print configuration status to console in development mode
 */
if (envConfig.isDevelopment) {
  console.log(`Environment: ${envConfig.environment}`);
  console.log('API Status:', {
    supabase: isApiConfigured('supabase') ? '✅ Configured' : '❌ Missing API keys',
    groq: isApiConfigured('groq') ? '✅ Configured' : '❌ Missing API key',
  });
  console.log('Features:', {
    llm: envConfig.enableLLM ? '✅ Enabled' : '❌ Disabled',
    batchProcessing: envConfig.enableBatchProcessing ? '✅ Enabled' : '❌ Disabled',
    notifications: envConfig.enableNotifications ? '✅ Enabled' : '❌ Disabled',
  });
}

export default envConfig; 