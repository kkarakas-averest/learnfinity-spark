// Script to automatically fix user data issues in Supabase
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

async function fixUsersAutomatically() {
  console.log('=======================================');
  console.log('AUTOMATIC USER DATA FIX');
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
    // 0. Check for the user_role enum type
    console.log('\n------- Checking Database Schema -------');
    const checkEnumSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('learner', 'hr', 'mentor', 'superadmin');
        END IF;
      END
      $$;
    `;
    
    const { error: enumError } = await supabase.rpc('execute_sql', { sql: checkEnumSQL });
    
    if (enumError) {
      console.error('❌ Error checking or creating enum:', enumError.message);
      // Continue anyway, might be permission issue
    } else {
      console.log('✅ user_role enum type checked/created');
    }
    
    // 1. Check employees table
    console.log('\n------- HR Employees Table -------');
    const { data: employees, error: employeesError } = await supabase
      .from('hr_employees')
      .select('*');
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
      return;
    }
    
    console.log(`✅ Found ${employees?.length || 0} records in hr_employees table`);
    
    // 2. Check public users table
    console.log('\n------- Public Users Table -------');
    let { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*');
    
    // If table doesn't exist, create it
    if (publicUsersError && publicUsersError.code === '42P01') {
      console.log('Users table does not exist. Creating it now...');
      
      // First check the schema of the table by examining the Database type definition
      const alterRoleTypeSQL = `
        DO $$
        BEGIN
          -- Create the user_role type if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('learner', 'hr', 'mentor', 'superadmin');
          END IF;
          
          -- Create the users table with proper role type
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            role TEXT DEFAULT 'learner',
            password TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        END
        $$;
      `;
      
      const { error: createError } = await supabase.rpc('execute_sql', { sql: alterRoleTypeSQL });
      
      if (createError) {
        console.error('❌ Error creating users table:', createError.message);
        return;
      }
      
      console.log('✅ Users table created successfully');
      publicUsers = [];
    } else if (publicUsersError) {
      console.error('❌ Error fetching users from public.users:', publicUsersError.message);
      return;
    } else {
      console.log(`✅ Found ${publicUsers?.length || 0} users in public.users table`);
    }
    
    // 3. Auto-fix: For each HR employee, ensure there is a corresponding user record
    console.log('\n------- Fixing User Data -------');
    
    // Count of potential issues
    let missingUserRecords = 0;
    let createdUserRecords = 0;
    let errorRecords = 0;
    
    // For each employee, check if there's a corresponding user record
    for (const employee of employees) {
      const matchingUser = publicUsers?.find(user => 
        user.email === employee.email || user.id === employee.id
      );
      
      if (!matchingUser) {
        console.log(`⚠️ Employee ${employee.name} (${employee.email}) has no matching user record`);
        missingUserRecords++;
        
        try {
          // Create user record with employee data
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: employee.id,
              name: employee.name,
              email: employee.email,
              role: 'learner', // Now using TEXT type instead of enum
              created_at: employee.created_at
            })
            .select();
          
          if (createError) {
            console.error(`❌ Error creating user record: ${createError.message}`);
            errorRecords++;
          } else {
            console.log(`✅ User record created for ${employee.name}`);
            createdUserRecords++;
          }
        } catch (err) {
          console.error(`💥 Exception creating user record: ${err.message}`);
          errorRecords++;
        }
      }
    }
    
    // Summary
    console.log('\n------- Fix Summary -------');
    console.log(`Total employees: ${employees.length}`);
    console.log(`Missing user records: ${missingUserRecords}`);
    console.log(`Created user records: ${createdUserRecords}`);
    console.log(`Failed to create: ${errorRecords}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=======================================');
  console.log('FIX COMPLETE');
  console.log('=======================================');
}

// Run the function
fixUsersAutomatically().catch(console.error); 