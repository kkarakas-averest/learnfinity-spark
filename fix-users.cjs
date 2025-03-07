// Script to diagnose and fix user data issues in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

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

// Create a command-line interface for interactive prompts
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Ask a yes/no question
async function askYesNo(question) {
  const rl = createInterface();
  
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Prompt for a value
async function prompt(question) {
  const rl = createInterface();
  
  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function diagnoseAndFix() {
  console.log('=======================================');
  console.log('SUPABASE USER DATA DIAGNOSTIC');
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
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (publicUsersError) {
      console.error('❌ Error fetching users from public.users:', publicUsersError.message);
      
      // Ask if we should attempt to create the users table
      if (publicUsersError.code === '42P01') { // relation does not exist
        const shouldCreateTable = await askYesNo('The users table does not exist. Would you like to create it?');
        
        if (shouldCreateTable) {
          console.log('Creating users table...');
          
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              email VARCHAR(100) NOT NULL UNIQUE,
              role VARCHAR(20) NOT NULL DEFAULT 'learner',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `;
          
          const { error: createError } = await supabase.rpc('execute_sql', { sql: createTableSQL });
          
          if (createError) {
            console.error('❌ Error creating users table:', createError.message);
            return;
          }
          
          console.log('✅ Users table created successfully');
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      console.log(`✅ Found ${publicUsers?.length || 0} users in public.users table`);
    }
    
    // 3. Auto-fix: For each HR employee, ensure there is a corresponding user record
    console.log('\n------- Analyzing User Data -------');
    
    // Count of potential issues
    let missingUserRecords = 0;
    
    // For each employee, check if there's a corresponding user record
    for (const employee of employees) {
      const matchingUser = publicUsers?.find(user => 
        user.email === employee.email || user.id === employee.id
      );
      
      if (!matchingUser) {
        console.log(`⚠️ Employee ${employee.name} (${employee.email}) has no matching user record`);
        missingUserRecords++;
      }
    }
    
    // If there are missing user records, ask if we should create them
    if (missingUserRecords > 0) {
      console.log(`\nFound ${missingUserRecords} employees without matching user records`);
      
      const shouldFix = await askYesNo('Would you like to create missing user records?');
      
      if (shouldFix) {
        console.log('\n------- Creating Missing User Records -------');
        
        // For each employee without a user record, create one
        for (const employee of employees) {
          const matchingUser = publicUsers?.find(user => 
            user.email === employee.email || user.id === employee.id
          );
          
          if (!matchingUser) {
            console.log(`Creating user record for ${employee.name} (${employee.email})...`);
            
            // Create user record with employee data
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: 'learner', // Default role
                created_at: employee.created_at
              })
              .select();
            
            if (createError) {
              console.error(`❌ Error creating user record: ${createError.message}`);
            } else {
              console.log(`✅ User record created for ${employee.name}`);
            }
          }
        }
      }
    } else {
      console.log('✅ All employees have corresponding user records');
    }
    
    // 4. Manual user creation option
    const shouldCreateUser = await askYesNo('\nWould you like to manually create a user record?');
    
    if (shouldCreateUser) {
      console.log('\n------- Manual User Creation -------');
      
      const name = await prompt('Enter user name');
      const email = await prompt('Enter user email');
      const role = await prompt('Enter user role (default: learner)') || 'learner';
      
      // Generate a UUID for the user
      const id = crypto.randomUUID();
      
      // Create the user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id,
          name,
          email,
          role,
        })
        .select();
      
      if (createError) {
        console.error(`❌ Error creating user record: ${createError.message}`);
      } else {
        console.log(`✅ User record created for ${name} (${email})`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=======================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('=======================================');
}

// Run the function
diagnoseAndFix().catch(console.error); 