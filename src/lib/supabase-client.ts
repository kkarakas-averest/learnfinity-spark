/**
 * Supabase Client
 * 
 * A shared Supabase client instance to be used across the application.
 * This ensures we're not creating multiple instances unnecessarily.
 */

import { createClient } from '@supabase/supabase-js';

// Helper function to get environment variables based on the runtime environment
const getEnvVariable = (name: string, vitePrefix = 'VITE_'): string => {
  if (typeof window === 'undefined') {
    // Node.js environment - try to get the variable without prefix first,
    // then with prefix as fallback
    return process.env[name] || process.env[`${vitePrefix}${name}`] || '';
  } else {
    // Browser environment using Vite
    return (import.meta.env as Record<string, string>)[`${vitePrefix}${name}`] || '';
  }
};

// Get Supabase URL and API key from environment variables
const supabaseUrl = getEnvVariable('SUPABASE_URL');
const supabaseServiceKey = getEnvVariable('SUPABASE_SERVICE_KEY'); // Service key for admin operations
const supabaseAnonKey = getEnvVariable('SUPABASE_ANON_KEY'); // Anon key for public operations

// Use the service key if available, otherwise fall back to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

// Log which key we're using (without exposing the actual key)
if (supabaseServiceKey) {
  console.log('✅ Using Supabase service key for admin operations');
} else if (supabaseAnonKey) {
  console.log('⚠️ Using Supabase anon key - some admin operations may fail');
} else {
  console.error('❌ No Supabase API key found');
}

// Validate that we have the required values
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration missing. Please check your environment variables.');
  console.error('See SUPABASE-CONFIG-README.md for setup instructions.');
  
  // Additional guidance for common issues
  if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL - Make sure you have both VITE_SUPABASE_URL and SUPABASE_URL defined');
  }
  if (!supabaseKey) {
    console.error('Missing Supabase API key - Make sure you have SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY defined');
  }
}

// Create and export a Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export admin-specific client (will be the same as supabase if service key was used)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Helper to check if we're using the service key
export const isUsingServiceKey = (): boolean => {
  return !!supabaseServiceKey;
};

// Export types
export type { SupabaseClient } from '@supabase/supabase-js';

// Export the initialized client as the default
export default supabase; 