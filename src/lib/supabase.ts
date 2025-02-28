import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client with improved error handling
let supabase;

try {
  if (!supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase anonymous key. Authentication and database features will not work. Please set VITE_SUPABASE_ANON_KEY in your .env.local file.');
    
    // Log more detailed troubleshooting information in development
    if (import.meta.env.DEV) {
      console.info('📝 Development troubleshooting:');
      console.info('1. Make sure you have a .env.local file in the project root');
      console.info('2. Ensure VITE_SUPABASE_ANON_KEY is set correctly in your .env.local file');
      console.info('3. Restart your development server after adding environment variables');
    }
    
    // Create client with a placeholder key to prevent app from crashing
    supabase = createClient<Database>(supabaseUrl, 'MISSING_KEY_PLACEHOLDER');
  } else {
    console.info('✅ Supabase client initialized successfully');
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  // Fallback client that will fail gracefully
  supabase = createClient<Database>(supabaseUrl, 'ERROR_PLACEHOLDER');
}

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseAnonKey && supabaseAnonKey !== 'MISSING_KEY_PLACEHOLDER' && supabaseAnonKey !== 'ERROR_PLACEHOLDER';
};

export { supabase };
