// Script to check users in Supabase database
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

async function getAllUsers() {
  console.log('=======================================');
  console.log('CHECKING USERS IN SUPABASE');
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
    // Check both auth.users and public.users tables
    
    // 1. First let's check the users table in the public schema
    console.log('\n------- Public Users Table -------');
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (publicUsersError) {
      console.error('❌ Error fetching users from public.users:', publicUsersError.message);
    } else {
      console.log(`✅ Found ${publicUsers?.length || 0} users in public.users table`);
      
      if (publicUsers && publicUsers.length > 0) {
        console.log('\nUsers in public.users table:');
        publicUsers.forEach((user, index) => {
          console.log(`\n[User ${index + 1}]`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Name: ${user.name}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Role: ${user.role}`);
          console.log(`  Created: ${user.created_at}`);
        });
      }
    }
    
    // 2. Now check the hr_employees table
    console.log('\n------- HR Employees Table -------');
    const { data: employees, error: employeesError } = await supabase
      .from('hr_employees')
      .select('*');
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
    } else {
      console.log(`✅ Found ${employees?.length || 0} records in hr_employees table`);
      
      if (employees && employees.length > 0) {
        console.log('\nEmployees in hr_employees table:');
        employees.forEach((employee, index) => {
          console.log(`\n[Employee ${index + 1}]`);
          console.log(`  ID: ${employee.id}`);
          console.log(`  Name: ${employee.name}`);
          console.log(`  Email: ${employee.email}`);
          console.log(`  Department ID: ${employee.department_id}`);
          console.log(`  Position ID: ${employee.position_id}`);
          console.log(`  Status: ${employee.status}`);
          console.log(`  Created: ${employee.created_at}`);
        });
      }
    }
    
    // 3. Try to access auth.users through admin functions (might not work with anon key)
    console.log('\n------- Auth API Users -------');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Unable to access auth.users (requires admin privileges):', authError.message);
      console.log('Note: This is expected with anonymous key - it lacks admin privileges');
    } else if (authData) {
      console.log(`✅ Found ${authData.users?.length || 0} users in auth.users table`);
      
      if (authData.users && authData.users.length > 0) {
        console.log('\nUsers in auth.users:');
        authData.users.forEach((user, index) => {
          console.log(`\n[Auth User ${index + 1}]`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Created: ${user.created_at}`);
          console.log(`  Last Sign In: ${user.last_sign_in_at || 'never'}`);
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
getAllUsers().catch(console.error); 