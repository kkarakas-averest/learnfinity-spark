
import { supabase } from '@/integrations/supabase/client';

/**
 * Export the Supabase client for use throughout the application
 * This provides a central point for accessing the Supabase client
 */
export { supabase };

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
