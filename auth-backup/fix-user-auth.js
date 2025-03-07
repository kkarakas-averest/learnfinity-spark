// Script to check Supabase Auth status and fix the authentication
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseAnonKey = envContent
  .split('\n')
  .find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))
  ?.split('=')[1]
  ?.trim();

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Password to set for the user
const FIXED_PASSWORD = 'Averest123!';

// Function to check if a user exists in the application database
const checkUserInDatabase = async (email) => {
  try {
    console.log(`Checking if user exists in database: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email);
    
    if (error) {
      console.error('Error checking user:', error);
      return { exists: false, error };
    }
    
    return { 
      exists: data && data.length > 0,
      user: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error('Error checking user in database:', error);
    return { exists: false, error };
  }
};

// Function to attempt to create a completely new user
const createNewUser = async (email, name, role) => {
  try {
    console.log(`Creating new user in Supabase Auth: ${email}`);
    
    // Create a new user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: FIXED_PASSWORD,
      email_confirm: true
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${email} already exists in Auth, no need to create`);
        return { success: true, message: 'User already exists in Auth' };
      }
      console.error('Error creating user in Auth:', authError);
      return { success: false, error: authError };
    }
    
    console.log(`✅ Created new user in Auth: ${email}`);
    console.log('Auth user ID:', authData.user.id);
    
    // Check if user exists in database first
    const dbUser = await checkUserInDatabase(email);
    
    if (!dbUser.exists) {
      // Add user to database if not exists
      console.log(`User ${email} not found in database, adding...`);
      
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .insert([
          { 
            id: authData.user.id,
            email,
            name: name || email.split('@')[0],
            role: role || 'learner'
          }
        ]);
      
      if (dbError) {
        console.error('Error adding user to database:', dbError);
        return { success: false, error: dbError };
      }
      
      console.log(`✅ Added user to database: ${email}`);
    } else {
      console.log(`User ${email} already exists in database, updating auth ID...`);
      
      // Update the user's ID in the database to match the auth ID
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', email);
      
      if (updateError) {
        console.error('Error updating user ID in database:', updateError);
        return { success: false, error: updateError };
      }
      
      console.log(`✅ Updated user ID in database to match Auth ID: ${email}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating new user:', error);
    return { success: false, error };
  }
};

// Function to delete a user from Auth
const deleteUserFromAuth = async (email) => {
  try {
    console.log(`Attempting to delete user from Auth: ${email}`);
    
    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return { success: false, error: userError };
    }
    
    const userToDelete = userData.users.find(user => user.email === email);
    
    if (!userToDelete) {
      console.log(`User ${email} not found in Auth system, nothing to delete`);
      return { success: true, message: 'User not found in Auth' };
    }
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
    
    if (deleteError) {
      console.error('Error deleting user from Auth:', deleteError);
      return { success: false, error: deleteError };
    }
    
    console.log(`✅ Deleted user from Auth: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user from Auth:', error);
    return { success: false, error };
  }
};

// Function to test user authentication
const testUserAuthentication = async (email, password) => {
  try {
    console.log(`Testing authentication for ${email}...`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(`Authentication failed for ${email}:`, error);
      return { success: false, error };
    }
    
    console.log(`✅ Authentication successful for ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Error during authentication test for ${email}:`, error);
    return { success: false, error };
  }
};

// Main function to run the recovery process
const main = async () => {
  // Get target email from command line or use default
  const targetEmail = process.argv[2] || 'kkarakass@averesttraining.com';
  
  console.log('=== SUPABASE AUTH RECOVERY UTILITY ===');
  console.log(`Target email: ${targetEmail}`);
  
  // 1. Check if user exists in database
  const dbCheck = await checkUserInDatabase(targetEmail);
  
  if (!dbCheck.exists) {
    console.log(`❌ User ${targetEmail} not found in application database.`);
    console.log('Please check the email address and try again.');
    process.exit(1);
  }
  
  console.log(`✅ User found in application database: ${targetEmail}`);
  console.log('User details:', dbCheck.user);
  
  // 2. First try to authenticate with the default password
  console.log('\nTrying to authenticate with default password...');
  const authCheck = await testUserAuthentication(targetEmail, FIXED_PASSWORD);
  
  if (authCheck.success) {
    console.log(`✅ Authentication successful for ${targetEmail}`);
    console.log('The user can log in with the password:', FIXED_PASSWORD);
    process.exit(0);
  }
  
  console.log(`❌ Authentication failed for ${targetEmail}`);
  
  // 3. If specified in arguments, recreate the user
  if (process.argv.includes('--recreate')) {
    console.log('\nRecreating user in Auth system...');
    
    // First delete the user from Auth if exists
    const deleteResult = await deleteUserFromAuth(targetEmail);
    
    if (!deleteResult.success) {
      console.log('Failed to delete user from Auth, continuing with creation...');
    }
    
    // Create the user
    const createResult = await createNewUser(
      targetEmail, 
      dbCheck.user.name,
      dbCheck.user.role
    );
    
    if (createResult.success) {
      console.log(`\n✅ User ${targetEmail} has been successfully recreated.`);
      console.log('The user can now log in with the password:', FIXED_PASSWORD);
      
      // Verify authentication works
      const verifyAuth = await testUserAuthentication(targetEmail, FIXED_PASSWORD);
      
      if (verifyAuth.success) {
        console.log(`✅ Authentication verified for ${targetEmail}`);
      } else {
        console.log(`❌ Authentication verification failed for ${targetEmail}`);
        console.log('However, the user has been recreated. Please try logging in manually.');
      }
    } else {
      console.log(`❌ Failed to recreate user ${targetEmail}.`);
      console.log('Please contact the administrator for further assistance.');
    }
  } else {
    console.log('\nTo recreate this user in the Auth system, run:');
    console.log(`node fix-user-auth.js ${targetEmail} --recreate`);
    console.log('\nThis will:');
    console.log('1. Delete the user from the Auth system if they exist');
    console.log('2. Create a new user in the Auth system');
    console.log('3. Set the password to:', FIXED_PASSWORD);
    console.log('4. Update the user ID in the database to match the Auth ID');
  }
};

// Run the main function
main(); 