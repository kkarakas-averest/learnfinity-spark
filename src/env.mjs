// Simple environment variables utility
// In a production app, you would use a more robust solution like env-vars or dotenv

export const env = {
  // GroqAPI configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  // Supabase configuration (already defined elsewhere in the app, included here for reference)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  
  // Application environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_ENV: process.env.APP_ENV || 'development',
}; 