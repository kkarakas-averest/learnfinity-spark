import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getEnvVar } from './env-loader';

// Check if Supabase environment variables are configured
// Use the environment loader instead of direct access
let supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
let supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

// Try Next.js environment variables as fallback
if (!supabaseUrl) {
  supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', '');
  console.log('Using NEXT_PUBLIC_SUPABASE_URL as fallback:', !!supabaseUrl);
}

if (!supabaseAnonKey) {
  supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  console.log('Using NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback:', !!supabaseAnonKey);
}

// Hardcoded fallback for development/testing only
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Using hardcoded Supabase credentials as fallback. This should only happen during development.');
  if (!supabaseUrl) {
    supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
  }
  if (!supabaseAnonKey) {
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E';
  }
}

// ADDED: Better debug output for initialization
console.log('[Supabase Client] Debug Info:');
console.log('- URL Defined:', !!supabaseUrl);
console.log('- URL Value:', supabaseUrl);
console.log('- Anon Key Defined:', !!supabaseAnonKey);

// Initialize Supabase client once
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('Initializing Supabase client...');
    
    // ADDED: Validate URL before creating client
    if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
      console.error(`Invalid Supabase URL: "${supabaseUrl}". Using fallback.`);
    }
    
    try {
      supabaseInstance = createClient<Database>(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key',
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      console.log('Supabase client initialized.');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      // Create a minimal client that won't throw errors but won't work either
      supabaseInstance = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    }
  } else {
    // console.log('Reusing existing Supabase client instance.');
  }
  return supabaseInstance;
};

// Export the singleton instance directly for convenience
export const supabase = getSupabase();

// Utility to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Test the connection to Supabase
export const testSupabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase client not configured. Missing environment variables.',
        details: { 
          hasUrl: !!supabaseUrl, 
          hasAnonKey: !!supabaseAnonKey 
        }
      };
    }
    
    // Test a simple query
    const { data, error } = await supabase.from('courses').select('id').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Connection successful but table not found. Database may need initialization.',
          details: { error: error.message }
        };
      }
      
      if (error.message.includes('auth')) {
        return {
          success: false,
          message: 'Authentication error. Check your Supabase anonymous key.',
          details: { error: error.message }
        };
      }
      
      return {
        success: false,
        message: 'Error connecting to Supabase.',
        details: { error: error.message }
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase.',
      details: { rowCount: data?.length || 0 }
    };
  } catch (e) {
    return {
      success: false,
      message: 'Exception while testing Supabase connection.',
      details: { error: e instanceof Error ? e.message : String(e) }
    };
  }
};

// Export testSupabaseConnection for global access in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // @ts-ignore - This is fine for development purposes
  window.testSupabaseConnection = testSupabaseConnection;
}
