// Script to directly fix the mismatch between hr_employees and users
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

async function cleanupDatabase() {
  console.log('=======================================');
  console.log('DIRECT DATABASE CLEANUP');
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
    // Check if tables exist and create them if necessary
    console.log('\n------- Modified Approach -------');
    console.log('Checking HR Employees...');
    
    // 1. First check if the hr_employees table exists and has data
    const { data: employees, error: employeesError } = await supabase
      .from('hr_employees')
      .select('*');
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
      console.error('Cannot proceed without access to hr_employees table');
      return;
    }
    
    console.log(`✅ Found ${employees.length} employee records`);
    
    // 2. Check if users table exists by trying to select from it
    console.log('Checking users table...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    // Users table doesn't exist, so let's try inserting data directly as a workaround
    let needToCreateUsers = false;
    
    if (usersError) {
      console.log('❌ Error accessing users table:', usersError.message);
      
      if (usersError.code === '42P01') { // Table doesn't exist
        console.log('The users table does not exist in the database');
        needToCreateUsers = true;
      } else {
        console.log('Continuing despite error - will try direct insertion approach');
      }
    } else {
      console.log(`✅ Users table exists with ${existingUsers?.length || 0} records`);
    }
    
    // 3. Since we can't use admin API with anon key, try direct auth signups
    console.log('\n------- Creating User Accounts -------');
    
    // For each employee, create an auth account
    for (const employee of employees) {
      console.log(`Processing employee: ${employee.name} (${employee.email})`);
      
      // Generate a temporary password
      const tempPassword = `Welcome123!${Math.floor(Math.random() * 10000)}`;
      
      // Try to sign up the user
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: employee.email,
        password: tempPassword,
        options: {
          data: {
            name: employee.name,
            employee_id: employee.id,
            role: 'learner'
          }
        }
      });
      
      if (signUpError) {
        console.log(`❌ Could not create auth user: ${signUpError.message}`);
      } else {
        console.log(`✅ Auth user created or email confirmation sent for ${employee.email}`);
        console.log(`   Temporary password: ${tempPassword}`);
        
        // Now try to directly insert into the users table
        if (!usersError) {
          console.log('   Attempting to create user record in public.users table...');
          
          let userId = newUser?.user?.id;
          if (!userId) {
            console.log('   Could not get user ID from auth response, using employee ID');
            userId = employee.id;
          }
          
          const { data: userRecord, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              name: employee.name,
              email: employee.email,
              role: 'learner'
            })
            .select();
          
          if (insertError) {
            console.log(`   ❌ Error creating user record: ${insertError.message}`);
          } else {
            console.log('   ✅ User record created in public.users table');
          }
        }
      }
    }
    
    console.log('\n------- Final Check -------');
    // Try to fetch users one more time to see if our operations had any effect
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*');
    
    if (finalError) {
      console.log(`❌ Still cannot access users table: ${finalError.message}`);
    } else {
      console.log(`✅ Users table now contains ${finalUsers.length} records`);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=======================================');
  console.log('CLEANUP COMPLETE');
  console.log('=======================================');
}

// Run the function
cleanupDatabase().catch(console.error); 