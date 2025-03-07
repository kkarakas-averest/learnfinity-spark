// Script to directly fix the authentication issue for a specific user
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

// Fixed password for the specific user we're fixing
const FIXED_PASSWORD = 'Averest123!';

// Special function to directly fix a specific user
const fixSpecificUser = async (email = 'kkarakass@averesttraining.com') => {
  try {
    console.log(`\nAttempting to fix specific user: ${email}`);
    
    // 1. First try to sign up the user directly
    console.log('Step 1: Attempting to create user via signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: FIXED_PASSWORD,
    });
    
    if (signupError) {
      console.log('Signup failed:', signupError.message);
      
      // 2. If signup fails, try password reset flow
      console.log('\nStep 2: Attempting password reset flow...');
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: 'https://ujlqzkkkfatehxeqtbdl.supabase.co/reset-password',
        }
      );
      
      if (resetError) {
        console.log('Password reset failed:', resetError.message);
      } else {
        console.log('Password reset email sent. User needs to check email to complete process.');
        return {
          success: true,
          message: 'Password reset email sent',
          nextSteps: 'Check email and follow the reset link'
        };
      }
      
      // 3. Try forced auth update if we have permissions
      console.log('\nStep 3: Attempting direct update to users table...');
      console.log('NOTE: This may not work with anonymous key - requires elevated privileges');
      
      // First, get the user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError) {
        console.log('Failed to find user:', userError.message);
        return { success: false, error: 'User not found in database' };
      }
      
      console.log(`Found user with ID: ${userData.id}`);
      
      // This part would require direct SQL execution with elevated privileges
      console.log(`
      WARNING: To fully fix this issue, you would need to run SQL like:
      
      -- This requires admin database access and is for informational purposes only
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, ...)
      VALUES ('${userData.id}', '${email}', '[encrypted_version_of_${FIXED_PASSWORD}]', now(), ...);
      `);
      
      return {
        success: false,
        error: 'Full fix requires database admin access',
        partialSuccess: true,
        message: 'Password reset flow initiated'
      };
    }
    
    // If signup succeeded, update the user's metadata
    console.log('User created successfully!');
    
    // Get the user details from the users table for metadata
    const { data: userDetails, error: detailsError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('email', email)
      .single();
    
    if (!detailsError && userDetails) {
      // Update the user's metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: userDetails.name,
          role: userDetails.role,
          user_id: userDetails.id
        }
      });
      
      if (updateError) {
        console.log('Warning: Could not update user metadata:', updateError.message);
      } else {
        console.log('User metadata updated successfully');
      }
    }
    
    return {
      success: true,
      message: 'User created successfully',
      password: FIXED_PASSWORD
    };
  } catch (error) {
    console.error('Error in fix process:', error);
    return { success: false, error };
  }
};

// Function to try to sign in with the user to test if auth is working
const testUserAuth = async (email, password) => {
  try {
    console.log(`\nTesting authentication for ${email}...`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Auth test failed:', error.message);
      return { success: false, error };
    }
    
    console.log('Authentication successful!', data);
    return { success: true, data };
  } catch (error) {
    console.error('Auth test error:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  const email = process.argv[2] || 'kkarakass@averesttraining.com';
  
  console.log('=== USER AUTHENTICATION FIX UTILITY ===');
  console.log(`Fixing authentication for: ${email}`);
  
  // Fix user
  const fixResult = await fixSpecificUser(email);
  console.log('\nFix result:', fixResult);
  
  // Test if fix worked
  if (fixResult.success) {
    console.log('\nTesting if fix was successful...');
    const testResult = await testUserAuth(email, FIXED_PASSWORD);
    
    if (testResult.success) {
      console.log('\n==============================================');
      console.log('✅ SUCCESS! User is now fixed and authenticated.');
      console.log('You can login with:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${FIXED_PASSWORD}`);
      console.log('==============================================');
    } else {
      console.log('\n==============================================');
      console.log('⚠️ Fix completed but test login failed.');
      console.log('Try manual login with:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${FIXED_PASSWORD}`);
      console.log('==============================================');
    }
  } else {
    console.log('\n==============================================');
    console.log('❌ Fix was not successful.');
    console.log('You may need additional privileges or database access.');
    console.log('==============================================');
  }
};

// Run the main function
main(); 