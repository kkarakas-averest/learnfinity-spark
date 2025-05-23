/**
 * Environment Configuration
 * 
 * This file provides a central place to manage environment variables and configuration
 * settings used throughout the application.
 */

// Import environment variables from .env file if in development
// Note: Vite automatically loads .env files, so this section is not needed

import { GROQ_API_KEY } from './env';

// Helper to safely access import.meta.env (works both in Vite and direct Node.js)
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Check if running in Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as any)[key] || defaultValue;
  }
  
  // Check for direct environment variables from env.js
  if (key === 'VITE_GROQ_API_KEY') {
    return GROQ_API_KEY || defaultValue;
  }
  
  // Fallback to process.env for Node.js scripts
  return process.env[key] || defaultValue;
};

// *** Debug/Development Helper: Log environment variables to check what is available ***
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    console.log('Available Vite Environment Variables:', import.meta.env);
  }
}

// Helper to get environment mode
const getMode = (): 'development' | 'production' | 'test' => {
  // First check Vite env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development';
  }
  
  // Otherwise use Node.js env
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
};

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
  appName: getEnv('VITE_APP_NAME', 'Learnfinity'),
  environment: getMode(),
  isDevelopment: getMode() === 'development',
  isProduction: getMode() === 'production',
  isTest: getMode() === 'test',
  debug: getEnv('VITE_DEBUG') === 'true' || getMode() === 'development',
  
  // API keys - read from environment variables
  supabaseUrl: getEnv('VITE_SUPABASE_URL', ''),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY', ''),
  groqApiKey: getEnv('VITE_GROQ_API_KEY', '') || null,
  
  // Feature flags
  enableLLM: getEnv('VITE_ENABLE_LLM') !== 'false',
  enableBatchProcessing: getEnv('VITE_ENABLE_BATCH_PROCESSING') !== 'false',
  enableNotifications: getEnv('VITE_ENABLE_NOTIFICATIONS') !== 'false',
  
  // Performance settings
  batchSize: parseInt(getEnv('VITE_BATCH_SIZE', '5'), 10),
  maxConcurrentRequests: parseInt(getEnv('VITE_MAX_CONCURRENT_REQUESTS', '3'), 10),
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