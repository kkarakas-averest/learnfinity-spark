import { supabase, supabaseAdmin, isUsingServiceKey } from '@/lib/supabase-client';

/**
 * Checks if a table exists in the database using direct SQL query
 * @param tableName The name of the table to check
 * @returns A boolean indicating whether the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    if (!tableName) {
      console.error('tableExists called with empty table name');
      return false;
    }
    
    // Use the admin client if available to bypass RLS
    const client = supabaseAdmin || supabase;
    
    // SQL to check if table exists - more reliable than information_schema when permissions might be limited
    const sql = `
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = '${tableName}'
      );
    `;
    
    // First try with direct SQL if we're using service key
    if (isUsingServiceKey()) {
      const { data: sqlData, error: sqlError } = await client.rpc('exec_sql', { sql });
      
      // If exec_sql function doesn't exist or fails, fall back to information_schema
      if (!sqlError) {
        // Parse the result - it depends on how exec_sql returns data
        if (Array.isArray(sqlData) && sqlData.length > 0) {
          // If it returns an array of results
          return sqlData[0].exists === true;
        } else if (typeof sqlData === 'object' && sqlData !== null) {
          // If it returns a single result object
          return sqlData.exists === true;
        }
      }
    }
    
    // Fall back to querying information_schema (may fail if permissions are restricted)
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .limit(1);
    
    if (error) {
      // If information_schema access fails, fall back to directly querying the table
      console.warn(`Cannot check table existence through information_schema: ${error.message}`);
      console.log(`Falling back to direct table query for ${tableName}`);
      
      // Try a lightweight query just to check if the table exists
      const { error: directError } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      // Only no_permission is a valid error here - not_found means the table doesn't exist
      return directError ? directError.code === 'PGRST116' : true;
    }
    
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Checks if multiple tables exist in the database
 * @param tableNames An array of table names to check
 * @returns An object with tableName as keys and boolean values indicating existence
 */
export async function tablesExist(tableNames: string[]): Promise<Record<string, boolean>> {
  // Create a map to hold results
  const results: Record<string, boolean> = {};
  
  // Check each table individually to provide more reliable results
  for (const tableName of tableNames) {
    results[tableName] = await tableExists(tableName);
  }
  
  return results;
}

/**
 * Helper to check required tables and return the list of missing ones
 * @param requiredTables Array of table names that are required
 * @returns Object with success status and array of missing tables
 */
export async function checkRequiredTables(requiredTables: string[]): Promise<{
  success: boolean;
  missingTables: string[];
}> {
  const existenceMap = await tablesExist(requiredTables);
  const missingTables = Object.entries(existenceMap)
    .filter(([_, exists]) => !exists)
    .map(([tableName]) => tableName);
    
  if (missingTables.length > 0) {
    console.error(`Missing required tables: ${missingTables.join(', ')}`);
    return { success: false, missingTables };
  }
  
  return { success: true, missingTables: [] };
} 