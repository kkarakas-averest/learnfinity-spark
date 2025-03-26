
import { supabase, isUsingServiceKey, supabaseAdmin } from '@/lib/supabase-client';

/**
 * Check if a specific table exists in the database
 * @param tableName - The name of the table to check
 * @returns Promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const client = isUsingServiceKey() && supabaseAdmin ? supabaseAdmin : supabase;

    // Query the information_schema to check if the table exists
    const { data, error } = await client
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (e) {
    console.error(`Exception checking if table ${tableName} exists:`, e);
    return false;
  }
}

/**
 * Check if multiple required tables exist in the database
 * @param requiredTables - Array of table names to check
 * @returns Promise that resolves to an object with success status and any missing tables
 */
export async function checkRequiredTables(requiredTables: string[]): Promise<{ 
  success: boolean; 
  missingTables: string[] 
}> {
  try {
    const missingTables: string[] = [];
    
    // Check each required table
    for (const tableName of requiredTables) {
      const exists = await tableExists(tableName);
      if (!exists) {
        missingTables.push(tableName);
      }
    }
    
    return {
      success: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    console.error('Error checking required tables:', error);
    return {
      success: false,
      missingTables: requiredTables // Assume all are missing if there's an error
    };
  }
}

/**
 * Get count of rows in a specific table
 * @param tableName - The name of the table to check
 * @returns Promise that resolves to a number representing row count or -1 if error
 */
export async function getTableRowCount(tableName: string): Promise<number> {
  try {
    const client = isUsingServiceKey() && supabaseAdmin ? supabaseAdmin : supabase;
    
    // First check if the table exists
    const exists = await tableExists(tableName);
    if (!exists) {
      return -1;
    }
    
    // Use aggregation to get the count
    const { data, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error getting row count for table ${tableName}:`, error);
      return -1;
    }

    return data.length;
  } catch (e) {
    console.error(`Exception getting row count for table ${tableName}:`, e);
    return -1;
  }
}
