import { supabase, isSupabaseConfigured } from './lib/supabase';

// Check if the environment is properly configured
async function checkSupabaseConfig() {
  console.log('=======================================');
  console.log('Supabase Configuration Check');
  console.log('=======================================');
  
  const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key Present:', !!supabaseAnonKey);
  
  if (supabaseAnonKey) {
    console.log('Key Length:', supabaseAnonKey.length);
    console.log('Key Format Valid:', typeof supabaseAnonKey === 'string' && supabaseAnonKey.length >= 20);
  }
  
  console.log('isSupabaseConfigured():', isSupabaseConfigured());
  console.log('supabase client initialized:', !!supabase);
  console.log('---------------------------------------');
}

// Test table existence
async function checkTables() {
  console.log('=======================================');
  console.log('Database Table Check');
  console.log('=======================================');
  
  const tables = [
    'users',
    'hr_departments',
    'hr_positions',
    'hr_employees'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error accessing table ${table}:`, error.message);
        console.log(`   Error code:`, error.code);
        console.log(`   Error status:`, error.status);
      } else {
        console.log(`✅ Table ${table} exists, returned ${data?.length || 0} rows`);
      }
    } catch (err) {
      console.log(`💥 Exception checking table ${table}:`, err.message);
    }
    console.log('---------------------------------------');
  }
}

// Test actual auth functionality
async function testAuth() {
  console.log('=======================================');
  console.log('Auth API Check');
  console.log('=======================================');
  
  try {
    // Just test getting session - this shouldn't require auth
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Auth API error:', error.message);
    } else {
      console.log('✅ Auth API is accessible');
      console.log('   Session present:', !!data.session);
    }
  } catch (err) {
    console.log('💥 Exception testing auth:', err.message);
  }
  console.log('---------------------------------------');
}

// Main function to run all checks
async function runDiagnostics() {
  console.log('=======================================');
  console.log('SUPABASE DIAGNOSTICS');
  console.log('=======================================');
  console.log('Time:', new Date().toISOString());
  
  await checkSupabaseConfig();
  await checkTables();
  await testAuth();
  
  console.log('=======================================');
  console.log('DIAGNOSTICS COMPLETE');
  console.log('=======================================');
}

// Execute diagnostics
runDiagnostics();

export default runDiagnostics; 