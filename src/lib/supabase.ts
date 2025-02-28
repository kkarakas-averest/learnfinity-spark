
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client with warning instead of error
let supabase;

try {
  if (!supabaseAnonKey) {
    console.warn('Missing Supabase anonymous key. Authentication and database features will not work. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
    // Create client with a placeholder key to prevent app from crashing
    supabase = createClient<Database>(supabaseUrl, 'MISSING_KEY_PLACEHOLDER');
  } else {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Fallback client that will fail gracefully
  supabase = createClient<Database>(supabaseUrl, 'ERROR_PLACEHOLDER');
}

export { supabase };
