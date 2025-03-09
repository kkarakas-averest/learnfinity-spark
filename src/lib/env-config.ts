/**
 * Environment Configuration
 * 
 * This file provides a central place to manage environment variables and configuration
 * settings used throughout the application.
 */

// Import environment variables from .env file if in development
// Note: Vite automatically loads .env files, so this section is not needed

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
  appName: import.meta.env.VITE_APP_NAME || 'Learnfinity',
  environment: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isTest: import.meta.env.MODE === 'test',
  debug: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development',
  
  // API keys - read from environment variables
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY || null,
  
  // Feature flags
  enableLLM: import.meta.env.VITE_ENABLE_LLM !== 'false',
  enableBatchProcessing: import.meta.env.VITE_ENABLE_BATCH_PROCESSING !== 'false',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  
  // Performance settings
  batchSize: parseInt(import.meta.env.VITE_BATCH_SIZE || '5', 10),
  maxConcurrentRequests: parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS || '3', 10),
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