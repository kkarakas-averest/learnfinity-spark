
/**
 * Unified environment variable access for Vite applications
 * Handles both Vite's import.meta.env and Next.js process.env with proper fallbacks
 */

// Type definition for environment variables
export interface RuntimeEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GROQ_API_KEY?: string;
  ENABLE_LLM?: boolean;
  APP_NAME?: string;
  DEBUG?: boolean;
  NODE_ENV: string;
  PUBLIC_APP_URL: string;
  [key: string]: any;
}

// Get environment variables with proper fallbacks
function getEnvValue(key: string, defaultValue: any = undefined): any {
  // Try Vite style first (preferred for client code)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Check for VITE_ prefixed version
    if (import.meta.env[`VITE_${key}`] !== undefined) {
      return import.meta.env[`VITE_${key}`];
    }
    // Check for direct version
    if (import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  }

  // Next.js / Node.js process.env fallback
  if (typeof process !== 'undefined' && process.env) {
    // Check for NEXT_PUBLIC_ prefixed version (for client-side code)
    if (process.env[`NEXT_PUBLIC_${key}`] !== undefined) {
      return process.env[`NEXT_PUBLIC_${key}`];
    }
    // Check for direct version (server-side only)
    if (process.env[key] !== undefined) {
      return process.env[key];
    }
  }

  // Fallback to default
  return defaultValue;
}

// Parse boolean values
function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase();
    return lowercased === 'true' || lowercased === '1' || lowercased === 'yes';
  }
  return Boolean(value);
}

// Parse environment values with appropriate types
export const env: RuntimeEnv = {
  SUPABASE_URL: getEnvValue('SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvValue('SUPABASE_ANON_KEY', ''),
  GROQ_API_KEY: getEnvValue('GROQ_API_KEY', ''),
  ENABLE_LLM: parseBoolean(getEnvValue('ENABLE_LLM', false)),
  APP_NAME: getEnvValue('APP_NAME', 'HR Dashboard'),
  DEBUG: parseBoolean(getEnvValue('DEBUG', false)),
  NODE_ENV: getEnvValue('NODE_ENV', 'development'),
  PUBLIC_APP_URL: getEnvValue('PUBLIC_APP_URL', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'),
};

// Log environment status if debugging enabled
if (env.DEBUG && typeof window !== 'undefined') {
  console.log('Runtime environment loaded:', {
    SUPABASE_URL: env.SUPABASE_URL ? `${env.SUPABASE_URL.substring(0, 15)}...` : 'not set',
    GROQ_API_KEY: env.GROQ_API_KEY ? 'set' : 'not set',
    ENABLE_LLM: env.ENABLE_LLM,
    NODE_ENV: env.NODE_ENV,
  });
}

export default env;
