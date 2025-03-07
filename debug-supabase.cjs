// CommonJS debug script for Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get the Supabase key
function getEnvVars() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    const envVars = {};
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          envVars[key.trim()] = value;
        }
      }
    }
    
    return envVars;
  } catch (err) {
    console.error('Error reading .env.local file:', err.message);
    return {};
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('=======================================');
  console.log('SUPABASE DIAGNOSTICS (Node.js)');
  console.log('=======================================');
  console.log('Time:', new Date().toISOString());

  // Get environment variables
  const envVars = getEnvVars();
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key Present:', !!supabaseKey);
  
  if (supabaseKey) {
    console.log('Key Length:', supabaseKey.length);
    console.log('Key Format Valid:', typeof supabaseKey === 'string' && supabaseKey.length >= 20);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
    
    // Test basic functionality
    try {
      console.log('\nTesting Auth API...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.log('❌ Auth API error:', authError.message);
      } else {
        console.log('✅ Auth API is accessible');
        console.log('   Session present:', !!authData.session);
      }
    } catch (err) {
      console.log('💥 Exception testing auth:', err.message);
    }
    
    // Test tables
    const tables = ['users', 'hr_departments', 'hr_positions', 'hr_employees'];
    
    for (const table of tables) {
      try {
        console.log(`\nChecking table: ${table}`);
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
          if (data && data.length > 0) {
            console.log(`   First row ID: ${data[0].id}`);
          }
        }
      } catch (err) {
        console.log(`💥 Exception checking table ${table}:`, err.message);
      }
    }
  } else {
    console.log('❌ Cannot proceed with diagnostics - Supabase key not found');
  }
  
  console.log('\n=======================================');
  console.log('DIAGNOSTICS COMPLETE');
  console.log('=======================================');
}

// Run diagnostics
runDiagnostics()
  .catch(err => {
    console.error('Unhandled error in diagnostics:', err);
  }); 