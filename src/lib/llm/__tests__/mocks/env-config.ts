/**
 * Mock Environment Configuration for Testing
 */

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

// Mock configuration for testing
export const envConfig: EnvConfig = {
  // Application configuration
  appName: 'Learnfinity Test',
  environment: 'test',
  isDevelopment: false,
  isProduction: false,
  isTest: true,
  debug: true,
  
  // API keys
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  groqApiKey: process.env.VITE_GROQ_API_KEY || 'test-api-key',
  
  // Feature flags
  enableLLM: true,
  enableBatchProcessing: true,
  enableNotifications: true,
  
  // Performance settings
  batchSize: 5,
  maxConcurrentRequests: 3
};

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(): boolean {
  return true;
}

/**
 * Helper to check if the required API keys are set
 */
export function isApiConfigured(apiName: 'supabase' | 'groq'): boolean {
  switch (apiName) {
    case 'supabase':
      return true;
    case 'groq':
      return Boolean(envConfig.groqApiKey);
    default:
      return false;
  }
}

export default envConfig; 