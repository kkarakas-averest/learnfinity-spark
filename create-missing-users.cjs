// Script to create missing user records for employees
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Generate a secure password for user records
function generatePassword() {
  return `Temp${crypto.randomBytes(8).toString('hex')}!`;
}

async function createMissingUsers() {
  console.log('=======================================');
  console.log('CREATING MISSING USER RECORDS');
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
    // 1. Fetch all employees
    console.log('\n------- Fetching Employees -------');
    const { data: employees, error: employeesError } = await supabase
      .from('hr_employees')
      .select('*');
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError.message);
      return;
    }
    
    console.log(`✅ Found ${employees.length} employees`);
    
    // 2. Fetch all existing users
    console.log('\n------- Fetching Existing Users -------');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log(`✅ Found ${existingUsers.length} existing users`);
    
    // 3. For each employee, check if a corresponding user exists
    console.log('\n------- Creating Missing User Records -------');
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const employee of employees) {
      // Check if a user record already exists for this employee
      const existingUser = existingUsers.find(user => 
        user.email === employee.email || user.id === employee.id
      );
      
      if (existingUser) {
        console.log(`⏩ User record already exists for ${employee.name} (${employee.email})`);
        skippedCount++;
        continue;
      }
      
      // Generate a temporary password for the user record
      const tempPassword = generatePassword();
      
      // Create user record
      console.log(`Creating user record for ${employee.name} (${employee.email})...`);
      
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: 'learner',  // Default role
          password: tempPassword
        });
      
      if (createError) {
        console.error(`❌ Error creating user for ${employee.name}: ${createError.message}`);
        errorCount++;
      } else {
        console.log(`✅ Created user record for ${employee.name} with ID ${employee.id}`);
        console.log(`   Temporary password: ${tempPassword}`);
        createdCount++;
        
        // Try to authenticate this user with Auth API
        console.log(`   Attempting to sign up auth user for ${employee.email}...`);
        
        // The Auth API signUp will create a new user or send confirmation email if exists
        const { error: signUpError } = await supabase.auth.signUp({
          email: employee.email,
          password: tempPassword,
          options: {
            data: {
              name: employee.name,
              role: 'learner'
            }
          }
        });
        
        if (signUpError) {
          console.log(`   ⚠️ Could not create auth user: ${signUpError.message}`);
          console.log(`   Note: This is expected if the user already exists in Auth`);
        } else {
          console.log(`   ✅ Auth signup process initiated for ${employee.email}`);
        }
      }
    }
    
    // 4. Final check - count users after operations
    console.log('\n------- Final Users Check -------');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*');
    
    if (finalError) {
      console.error('❌ Error fetching final users count:', finalError.message);
    } else {
      console.log(`✅ Total users in database: ${finalUsers.length}`);
      
      if (finalUsers.length > 0) {
        console.log('\nUsers in database:');
        finalUsers.forEach((user, i) => {
          console.log(`[User ${i+1}] Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
      }
    }
    
    // 5. Summary
    console.log('\n------- Operation Summary -------');
    console.log(`Total employees: ${employees.length}`);
    console.log(`Created user records: ${createdCount}`);
    console.log(`Skipped (already exist): ${skippedCount}`);
    console.log(`Failed to create: ${errorCount}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=======================================');
  console.log('CREATION COMPLETE');
  console.log('=======================================');
}

// Run the function
createMissingUsers().catch(console.error); 