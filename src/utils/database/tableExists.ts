import { supabase } from '@/lib/supabase';

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A boolean indicating whether the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Use PostgreSQL's information_schema to check if the table exists
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .limit(1);
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
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
  try {
    // Use PostgreSQL's information_schema to check if the tables exist
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', tableNames);
    
    if (error) {
      console.error('Error checking if tables exist:', error);
      // Return all as false if there was an error
      return tableNames.reduce((acc, tableName) => {
        acc[tableName] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Create a map of table names to existence
    const existingTables = new Set(data?.map(row => row.table_name));
    
    return tableNames.reduce((acc, tableName) => {
      acc[tableName] = existingTables.has(tableName);
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    // Return all as false if there was an error
    return tableNames.reduce((acc, tableName) => {
      acc[tableName] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

/**
 * Helper to check and alert about missing required tables
 * @param requiredTables Array of table names that are required
 * @returns True if all tables exist, false otherwise
 */
export async function checkRequiredTables(requiredTables: string[]): Promise<boolean> {
  const existenceMap = await tablesExist(requiredTables);
  const missingTables = Object.entries(existenceMap)
    .filter(([_, exists]) => !exists)
    .map(([tableName]) => tableName);
    
  if (missingTables.length > 0) {
    console.error(`Missing required tables: ${missingTables.join(', ')}`);
    return false;
  }
  
  return true;
} 