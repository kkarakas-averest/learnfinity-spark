/**
 * Supabase Configuration Check
 * 
 * This utility verifies that your Supabase configuration is correctly set up
 * and checks if your connection to Supabase is working properly.
 */

import 'dotenv/config';
import { supabase } from '@/lib/supabase-client';
import { fileURLToPath } from 'url';

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
    // Try a simple auth check to verify connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    // Try to list tables to verify basic database access
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);
        
      if (tablesError) {
        console.log('⚠️ Limited database access (this is normal with anon key)');
        console.log(`   For full access, consider using a service role key`);
      } else if (tablesData && tablesData.length > 0) {
        console.log('✅ Successfully accessed database schema');
        console.log('📋 Tables in your database:');
        for (const table of tablesData) {
          console.log(`   - ${table.table_name}`);
        }
      } else {
        console.log('⚠️ Connected but no tables found in the public schema');
        console.log('   You may need to initialize your database schema first');
      }
    } catch (err) {
      console.log('ℹ️ Database schema access restricted (normal with anon key)');
    }
    
  } catch (err) {
    console.log('❌ Failed to connect to Supabase:');
    
    // More detailed error information
    if (err && typeof err === 'object') {
      if ('code' in err) console.log(`   Error code: ${(err as any).code}`);
      if ('message' in err) console.log(`   Error message: ${(err as any).message}`);
      if ('details' in err) console.log(`   Error details: ${(err as any).details}`);
      if ('hint' in err) console.log(`   Error hint: ${(err as any).hint}`);
    } else {
      console.log(`   ${String(err)}`);
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if your Supabase project is active');
    console.log('2. Verify your SUPABASE_URL and API keys');
    console.log('3. Make sure your IP is not blocked by Supabase');
    console.log('4. Check network connectivity');
    process.exit(1);
  }
  
  console.log('\n========================================');
}

// Execute if run directly (ES module version)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  checkSupabaseConfig().catch(console.error);
}

export default checkSupabaseConfig; 