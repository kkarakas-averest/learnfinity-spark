import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase admin client once
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Get a Supabase client with admin privileges (service role)
 * This bypasses Row Level Security (RLS) policies
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    if (!serviceRoleKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations may fail due to RLS policies.');
    }
    
    supabaseAdminInstance = createClient<Database>(
      supabaseUrl,
      // Fallback to a placeholder if not available
      serviceRoleKey || 'placeholder-service-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  return supabaseAdminInstance;
};

// Export the singleton instance directly for convenience
export const supabaseAdmin = getSupabaseAdmin(); 