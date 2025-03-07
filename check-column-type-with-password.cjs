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
    // First, let's examine the users table structure by trying to select a single record
    console.log('\n------- Examining Users Table Structure -------');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error examining users table:', tableError.message);
    } else {
      console.log('Users table structure (first record or empty array):');
      console.log(tableInfo);
    }
    
    // Try to insert a test record with a password
    console.log('\n------- Testing Insert with Text Value -------');
    console.log('Attempting to insert a test user with role as text...');
    
    const testId = '00000000-0000-0000-0000-000000000099';
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: testId,
        name: 'Test User',
        email: 'test-column-type@example.com',
        role: 'test_role_value',  // This should work if role is TEXT type
        password: 'hashedpassword123'  // Including password since it's required
      });
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      console.log('The role column may still be an enum type or there are other schema issues.');
    } else {
      console.log('✅ Insert test successful! The role column is accepting text values.');
      
      // Check the inserted record
      const { data: testUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', testId)
        .single();
      
      console.log('Inserted test user:');
      console.log(testUser);
      
      // Clean up test record
      await supabase.from('users').delete().eq('id', testId);
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
          role: 'learner',  // This should work if role column is TEXT
          password: 'temporarypassword456'  // Including password
        });
      
      if (createError) {
        console.error(`❌ Error creating user record: ${createError.message}`);
        console.log('The role column may still be an enum type or there are other schema issues.');
      } else {
        console.log(`✅ User record created successfully for ${employee.name}!`);
        console.log('The role column is now accepting string values.');
        
        // Check the created user
        const { data: createdUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', employee.id)
          .single();
        
        console.log('Created user:');
        console.log(createdUser);
      }
    }
    
    // Check all users in the table
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