import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Check if Supabase environment variables are configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug output for config variables in development mode
if (import.meta.env.MODE === 'development') {
  console.log('[Supabase Client] Configuration check');
  if (!supabaseUrl) console.error('Missing VITE_SUPABASE_URL');
  if (!supabaseAnonKey) console.error('Missing VITE_SUPABASE_ANON_KEY');
}

// Create a supabase client
export const supabase = createClient<Database>(
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
if (import.meta.env.MODE === 'development') {
  // @ts-ignore - This is fine for development purposes
  window.testSupabaseConnection = testSupabaseConnection;
}
