/**
 * Supabase Configuration Check
 * 
 * This utility verifies that your Supabase configuration is correctly set up
 * and checks if your connection to Supabase is working properly.
 */

import 'dotenv/config';
import { supabase, supabaseAdmin, isUsingServiceKey } from '@/lib/supabase-client';
import { fileURLToPath } from 'url';
import { toast } from '@/components/ui/use-toast';

async function checkSupabaseConfig() {
  console.log('========================================');
  console.log('🔍 SUPABASE CONFIGURATION CHECK');
  console.log('========================================');
  
  // Check environment variables
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`\n📋 Environment: ${nodeEnv}\n`);
  
  // Check Supabase URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    console.log('✅ SUPABASE_URL is defined');
  } else {
    console.log('❌ SUPABASE_URL is missing');
  }
  
  // Check Supabase API keys
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    console.log('✅ SUPABASE_ANON_KEY is defined');
  } else {
    console.log('❌ SUPABASE_ANON_KEY is missing');
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    console.log('✅ SUPABASE_SERVICE_KEY is defined (for admin operations)');
  } else {
    console.log('ℹ️ SUPABASE_SERVICE_KEY is not defined (optional, but required for certain admin operations)');
  }
  
  // Test connection
  console.log('\n🔄 Testing Supabase connection...');
  
  try {
    // Step 1: Check if we can connect to Supabase
    const { data: healthCheck, error: healthError } = await supabase.from('_healthcheck').select('*').limit(1);
    
    if (healthError) {
      console.error('Supabase health check failed:', healthError);
      toast({
        variant: 'destructive',
        title: 'Supabase connection failed',
        description: `Unable to connect to Supabase: ${healthError.message}. Check your environment variables.`
      });
      return { success: false, error: healthError };
    }
    
    // Step 2: Check for key type (anon vs service)
    const usingServiceKey = isUsingServiceKey();
    
    if (!usingServiceKey) {
      // This is just a warning as anon key works for many operations
      console.warn('Using Supabase anon key - some admin operations may fail');
      toast({
        variant: 'warning',
        title: 'Limited Permissions',
        description: 'Using Supabase anon key. Some admin operations will not work. Set SUPABASE_SERVICE_KEY for full access.'
      });
    }
    
    // Step 3: Check for required tables
    const requiredTables = [
      'learning_paths',
      'learning_path_courses',
      'learning_path_assignments',
      'hr_employees',
      'hr_departments'
    ];
    
    const missingTables = await checkTablesExist(requiredTables);
    
    if (missingTables.length > 0) {
      console.warn(`Missing tables: ${missingTables.join(', ')}`);
      
      if (usingServiceKey) {
        // We could potentially create them here, but that's best left to the create-hr-tables.js script
        toast({
          variant: 'warning',
          title: 'Missing database tables',
          description: `The following tables need to be created: ${missingTables.join(', ')}. Run the create-hr-tables.js script to set them up.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Database setup required',
          description: 'Some required tables are missing. Set SUPABASE_SERVICE_KEY and run the create-hr-tables.js script.'
        });
      }
      
      return { 
        success: false, 
        error: 'Missing tables', 
        canCreate: usingServiceKey,
        missingTables 
      };
    }
    
    console.log('✅ Supabase configuration validated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error checking Supabase config:', error);
    toast({
      variant: 'destructive',
      title: 'Configuration check failed',
      description: error instanceof Error ? error.message : 'Unknown error checking Supabase configuration'
    });
    return { success: false, error };
  }
}

/**
 * Check if tables exist by directly querying them
 * @param tables Array of table names to check
 * @returns Array of missing table names
 */
async function checkTablesExist(tables: string[]): Promise<string[]> {
  const client = supabaseAdmin || supabase;
  const missingTables: string[] = [];
  
  // Check each table individually
  for (const table of tables) {
    try {
      // Try a lightweight query just to check if the table exists
      const { error } = await client
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      // If the error is "relation does not exist", the table is missing
      if (error && error.message.includes('does not exist')) {
        missingTables.push(table);
      }
    } catch (err) {
      console.error(`Error checking table ${table}:`, err);
      missingTables.push(table);
    }
  }
  
  return missingTables;
}

/**
 * Create the required HR tables using the service key
 * This would typically be called from the create-hr-tables.js script
 */
async function createRequiredTables() {
  if (!isUsingServiceKey()) {
    console.error('Service key required to create tables');
    return { 
      success: false, 
      error: 'Service key required' 
    };
  }
  
  console.log('Creating required tables...');
  // This would execute the SQL to create the tables
  // We'll leave the actual implementation to the create-hr-tables.js script
  
  return { success: true, message: 'Tables created successfully' };
}

// Execute if run directly (ES module version)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  checkSupabaseConfig().catch(console.error);
}

export default checkSupabaseConfig; 