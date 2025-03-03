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
    // Validate the key format before using it
    if (typeof supabaseAnonKey !== 'string' || supabaseAnonKey.length < 20) {
      console.error('❌ Invalid Supabase anonymous key format');
      supabase = createClient<Database>(supabaseUrl, 'INVALID_KEY_FORMAT');
    } else {
      console.info('✅ Supabase client initialized successfully');
      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  // Fallback client that will fail gracefully
  supabase = createClient<Database>(supabaseUrl, 'ERROR_PLACEHOLDER');
}

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseAnonKey && 
    typeof supabaseAnonKey === 'string' && 
    supabaseAnonKey.length >= 20 && 
    supabaseAnonKey !== 'MISSING_KEY_PLACEHOLDER' && 
    supabaseAnonKey !== 'ERROR_PLACEHOLDER' &&
    supabaseAnonKey !== 'INVALID_KEY_FORMAT';
};

// Add a test function to verify connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase is not properly configured');
      return { 
        success: false, 
        error: new Error('Supabase is not properly configured. Check your VITE_SUPABASE_ANON_KEY.') 
      };
    }
    
    // Try to access a public table
    const { data, error } = await supabase
      .from('hr_departments')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      // Check for specific error types
      if (error.message?.includes('relation "hr_departments" does not exist')) {
        return { 
          success: false, 
          error,
          details: 'The hr_departments table does not exist. You may need to run the database initialization.'
        };
      }
      if (error.message?.includes('JWT')) {
        return { 
          success: false, 
          error,
          details: 'Authentication error. Your Supabase key may be invalid.'
        };
      }
      return { success: false, error };
    }
    
    console.log('✅ Supabase connection test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Supabase connection test failed with exception:', error);
    return { success: false, error };
  }
};

// Make the test function available globally in development
if (import.meta.env.DEV) {
  (window as any).testSupabaseConnection = testSupabaseConnection;
  console.log('🔧 Global function window.testSupabaseConnection() is now available for testing');
  
  // Remove the old test function if it exists to avoid confusion
  if ((window as any).runSupabaseTest) {
    delete (window as any).runSupabaseTest;
  }
}

export { supabase };
