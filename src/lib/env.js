/**
 * Direct environment variable exports
 * This file ensures environment variables are properly exposed to the browser bundle
 */

export const GROQ_API_KEY = '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';

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