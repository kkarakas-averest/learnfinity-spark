import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client with improved error handling
let supabase;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
    
    // Create client with a placeholder key to prevent app from crashing
    supabase = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', 'MISSING_CONFIG_PLACEHOLDER');
  } else {
    console.info('✅ Initializing Supabase client');
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);
  // Fallback client that will fail gracefully
  supabase = createClient<Database>(supabaseUrl || 'https://placeholder.supabase.co', 'ERROR_PLACEHOLDER');
}

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && 
    !!supabaseAnonKey && 
    typeof supabaseAnonKey === 'string' && 
    supabaseAnonKey.length >= 20 && 
    supabaseAnonKey !== 'MISSING_CONFIG_PLACEHOLDER' && 
    supabaseAnonKey !== 'ERROR_PLACEHOLDER';
};

// Add a test function to verify connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      return { 
        success: false, 
        error: new Error('Supabase is not properly configured. Check your environment variables.'),
        details: 'Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
      };
    }
    
    // Try to access a public table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      
      // Provide helpful error messages for common issues
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return { 
          success: false, 
          error,
          details: 'Database table does not exist. You may need to initialize your Supabase tables.'
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
    
    console.log('✅ Supabase connection test successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Supabase connection test failed with exception:', error);
    return { 
      success: false, 
      error, 
      details: 'An unexpected error occurred when connecting to Supabase.'
    };
  }
};

// Make the test function available globally in development
if (import.meta.env.DEV) {
  (window as Window & typeof globalThis & { testSupabaseConnection: typeof testSupabaseConnection }) 
    .testSupabaseConnection = testSupabaseConnection;
  console.log('🔧 Global function window.testSupabaseConnection() is now available for testing');
  
  // Remove the old test function if it exists to avoid confusion
  if ((window as Window & typeof globalThis & { runSupabaseTest?: Function }).runSupabaseTest) {
    delete (window as Window & typeof globalThis & { runSupabaseTest?: Function }).runSupabaseTest;
  }
}

export { supabase };
