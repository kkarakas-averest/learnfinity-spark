
import { supabase } from '@/integrations/supabase/client';

/**
 * Export the Supabase client for use throughout the application
 * This provides a central point for accessing the Supabase client
 */
export { supabase };

/**
 * Supabase admin client with service key capabilities
 * Will be undefined if service key is not provided
 */
export const supabaseAdmin = undefined; // Will be populated if using a service key

/**
 * Check if we're using a service key with elevated privileges
 * @returns boolean indicating if the current client is using a service key
 */
export function isUsingServiceKey(): boolean {
  // In this implementation, we're not using a service key
  // This would need to be adjusted if service key functionality is implemented
  return false;
}

/**
 * Helper function to check if Supabase connection is working
 * @returns A promise that resolves to a boolean indicating if connection is successful
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Attempt to query a simple table to verify connection
    const { data, error } = await supabase
      .from('hr_departments')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Failed to connect to Supabase:', e);
    return false;
  }
}

/**
 * Get the current user from Supabase
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
