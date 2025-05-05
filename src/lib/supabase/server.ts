import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Cache the Supabase server client to avoid creating multiple instances
let supabaseServerInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured for server-side operations.
 * This client uses the service role key when available to bypass RLS policies.
 * Falls back to anon key if service role key is not available.
 */
export function getSupabaseServer(): SupabaseClient {
  if (!supabaseServerInstance) {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       'https://ujlqzkkkfatehxeqtbdl.supabase.co';
    
    // Prefer service role key for admin access, fallback to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
    
    // Create the Supabase client
    supabaseServerInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,  // Don't persist session in server environment
        autoRefreshToken: false // Don't auto refresh tokens in server environment
      }
    });
  }
  
  return supabaseServerInstance;
}

/**
 * Checks if the current Supabase connection has admin privileges.
 * This is useful to determine if operations that require bypassing RLS will work.
 */
export async function hasAdminPrivileges(): Promise<boolean> {
  const supabase = getSupabaseServer();
  
  try {
    // Try an operation that would only work with service role key
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Execute raw SQL as an admin.
 * This is useful for database migrations or complex queries.
 */
export async function executeSQL(sql: string): Promise<{ success: boolean; error?: any }> {
  const supabase = getSupabaseServer();
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('SQL execution error:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    console.error('SQL execution exception:', err);
    return { success: false, error: err };
  }
} 