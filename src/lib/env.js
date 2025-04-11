
/**
 * Direct environment variable exports
 * This file ensures environment variables are properly exposed to the browser bundle
 */

// Environment variables access
// These are used for API keys and other sensitive values that shouldn't be in the repo
// They're loaded from .env.local or set in the environment

// Auth
export const NEXTAUTH_URL = import.meta.env.VITE_APP_URL;
export const NEXTAUTH_SECRET = import.meta.env.VITE_NEXTAUTH_SECRET || 'localsecretkey';

// Supabase - database access
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// LLM API keys
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';

// Feature flags
export const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';
export const ENABLE_LLM = import.meta.env.VITE_ENABLE_LLM === 'true';
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_NOTIFICATIONS = import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true';
export const ENABLE_BATCH_PROCESSING = import.meta.env.VITE_ENABLE_BATCH_PROCESSING === 'true';
export const DISABLE_SIGNUPS = import.meta.env.VITE_DISABLE_SIGNUPS === 'true';
export const ENABLE_EMAIL_CONFIRMATION = import.meta.env.VITE_ENABLE_EMAIL_CONFIRMATION === 'true';

// LLM settings
export const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'llama3-70b-8192';
export const LLM_TEMPERATURE = parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.7');
export const MAX_TOKENS = parseInt(import.meta.env.VITE_MAX_TOKENS || '2048');

// Batch processing
export const BATCH_SIZE = parseInt(import.meta.env.VITE_BATCH_SIZE || '10');
export const MAX_CONCURRENT_REQUESTS = parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS || '3');

// App details
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'HR Dashboard';
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';
export const NODE_ENV = import.meta.env.VITE_NODE_ENV || import.meta.env.VITE_USER_NODE_ENV || 'development';
export const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.VITE_APP_URL || 'http://localhost:8080';
export const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID;

// Export environment variables with a fallback
export const ENV = {
  GROQ_API_KEY,
};

// Log environment variables in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Direct environment variables loaded:', {
    GROQ_API_KEY: GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 4)}...` : 'not defined',
  });
}

export default ENV; 
