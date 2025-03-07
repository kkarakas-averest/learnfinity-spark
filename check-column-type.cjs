// Script to check column type in Supabase database
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

async function checkColumnType() {
  console.log('=======================================');
  console.log('CHECKING COLUMN TYPE FOR USERS TABLE');
  console.log('=======================================');
  
  // Get environment variables
  const envVars = getEnvVars();
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
  const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
  
  if (!supabaseKey) {
    console.error('❌ Supabase key not found in .env.local file');
    return;
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized');
  
  try {
    // Try to get column information using a SQL query
    console.log('\n------- Checking Column Type -------');
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql: `
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
      `
    });
    
    if (error) {
      console.error('❌ Error checking column type:', error.message);
      
      // Alternative approach - try to insert a record with a role value
      console.log('\n------- Testing Insert with Text Value -------');
      console.log('Attempting to insert a test user with role as text...');
      
      const testId = '00000000-0000-0000-0000-000000000099';
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: testId,
          name: 'Test User',
          email: 'test-column-type@example.com',
          role: 'test_role_value'  // This should work if role is TEXT type
        });
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
        console.log('The role column may still be an enum type.');
      } else {
        console.log('✅ Insert test successful! The role column is accepting text values.');
        
        // Clean up test record
        await supabase.from('users').delete().eq('id', testId);
      }
    } else {
      console.log('Column information:');
      console.log(data);
    }
    
    // Test creating a real user from employee data
    console.log('\n------- Testing Real User Creation -------');
    
    // First get an employee
    const { data: employees } = await supabase
      .from('hr_employees')
      .select('*')
      .limit(1);
    
    if (employees && employees.length > 0) {
      const employee = employees[0];
      console.log(`Creating user record for employee: ${employee.name}`);
      
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: 'learner'  // This should work if role column is TEXT
        });
      
      if (createError) {
        console.error(`❌ Error creating user record: ${createError.message}`);
        console.log('The role column may still be an enum type or there are other issues.');
      } else {
        console.log(`✅ User record created successfully for ${employee.name}!`);
        console.log('The role column is now accepting string values.');
      }
    }
    
    // Check users table again
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`\nCurrent users in table: ${users.length}`);
      if (users.length > 0) {
        users.forEach((user, i) => {
          console.log(`[User ${i+1}] Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=======================================');
  console.log('CHECK COMPLETE');
  console.log('=======================================');
}

// Run the function
checkColumnType().catch(console.error); 