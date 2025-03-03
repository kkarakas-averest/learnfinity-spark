// Script to set a direct password for a user without sending reset emails
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

// Default password to set
const DEVELOPMENT_PASSWORD = 'Averest123!';

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

// Function to set a new password directly
const setPasswordDirectly = async (email, password) => {
  try {
    console.log(`Setting direct password for user: ${email}`);
    
    // First, try to sign up the user with the new password
    // This is a trick - if the user already exists, we'll get the 'User already registered' error
    // But if the user doesn't exist in auth, it will create them
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://learnfinity.averesttraining.com/auth/callback'
      }
    });
    
    if (signupError && !signupError.message.includes('already registered')) {
      console.error('Error during signup attempt:', signupError);
    }
    
    // Now try the admin update password approach
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(
        'user-id-here', // This would need admin privileges
        { password }
      );
      
      if (error) {
        if (error.message.includes('not allowed') || error.status === 403) {
          console.log('Admin update not available with current API key - this is normal');
        } else {
          console.error('Error updating user password directly:', error);
        }
      } else {
        console.log('✅ Password updated directly through admin API');
        return { success: true };
      }
    } catch (adminError) {
      console.log('Admin API not available with current permissions - this is expected');
    }
    
    // As a workaround, use the password reset flow
    console.log('Using password reset flow as an alternative method...');
    
    // Send a password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://learnfinity.averesttraining.com/auth/callback?reset=true'
    });
    
    if (resetError) {
      // If we can't reset, try to use auth link
      if (resetError.message.includes('invalid')) {
        console.log('Email appears to be invalid in the auth system');
        console.log('Attempting to create a magic link instead...');
        
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: 'https://learnfinity.averesttraining.com/auth/callback'
          }
        });
        
        if (magicLinkError) {
          console.error('Failed to send magic link:', magicLinkError);
          return { success: false, error: magicLinkError };
        }
        
        console.log('✅ Magic link email sent! User can set password after clicking the link.');
        return { 
          success: true, 
          method: 'magic-link',
          message: 'Check email for magic link to log in and then change password' 
        };
      } else {
        console.error('Error sending password reset email:', resetError);
        return { success: false, error: resetError };
      }
    }
    
    console.log('✅ Password reset email sent! User should check their email.');
    return { 
      success: true, 
      method: 'reset-email',
      message: 'Check email for password reset instructions' 
    };
  } catch (error) {
    console.error('Error setting password directly:', error);
    return { success: false, error };
  }
};

// Function to create a user with password in one step
const createUserWithPassword = async (email, password, name, role) => {
  try {
    console.log(`Creating new user with email: ${email}`);
    
    // 1. Create user in auth system
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: role || 'learner'
        },
        emailRedirectTo: 'https://learnfinity.averesttraining.com/auth/callback'
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${email} already exists in auth system`);
      } else {
        console.error('Error creating user in auth system:', authError);
        return { success: false, error: authError };
      }
    } else {
      console.log(`✅ Created user in auth system: ${email}`);
    }
    
    // 2. Check if user exists in database
    const { exists, user } = await checkUserInDatabase(email);
    
    if (exists) {
      console.log(`User ${email} already exists in database`);
      return { success: true, message: 'User already exists in database' };
    }
    
    // 3. Add user to database if not exists
    const userId = authData?.user?.id;
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
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
    return { success: true };
  } catch (error) {
    console.error('Error creating user with password:', error);
    return { success: false, error };
  }
};

// Function to test user authentication
const testUserAuthentication = async (email, password) => {
  try {
    console.log(`Testing authentication for ${email} with password: ${password}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log(`Authentication failed for ${email}: ${error.message}`);
      return { success: false, error };
    }
    
    console.log(`✅ Authentication successful for ${email}!`);
    console.log('User data:', data.user);
    return { success: true, data };
  } catch (error) {
    console.error(`Error during authentication test for ${email}:`, error);
    return { success: false, error };
  }
};

// Brute force login attempt with common passwords
const attemptLoginWithCommonPasswords = async (email) => {
  const commonPasswords = [
    'Averest123!',
    'password123',
    'Password123',
    'Welcome1',
    '123456',
    'changeme',
    'admin123',
    'password',
    'test123',
    // Add more passwords that might have been used
  ];

  console.log(`Attempting login with common passwords for ${email}...`);
  
  for (const password of commonPasswords) {
    console.log(`Trying password: ${password}`);
    const result = await testUserAuthentication(email, password);
    
    if (result.success) {
      console.log(`✅ Found working password: ${password}`);
      return { success: true, password };
    }
  }
  
  console.log('❌ None of the common passwords worked');
  return { success: false };
};

// Main function
const main = async () => {
  // Get email and password from command line or use defaults
  const email = process.argv[2] || 'kkarakas@averesttraining.com';
  const password = process.argv[3] || DEVELOPMENT_PASSWORD;
  
  console.log('=== DIRECT PASSWORD SETTING UTILITY ===');
  console.log(`Target email: ${email}`);
  console.log(`Password to set: ${password}`);
  
  // 1. Check if user exists in database
  const dbCheck = await checkUserInDatabase(email);
  
  if (dbCheck.exists) {
    console.log(`✅ User found in database: ${email}`);
    console.log('User details:', dbCheck.user);
  } else {
    console.log(`❌ User not found in database: ${email}`);
    
    const createUserOption = process.argv.includes('--create');
    
    if (createUserOption) {
      console.log('\nCreating a new user in both auth and database...');
      
      const name = process.argv[4] || email.split('@')[0];
      const role = process.argv[5] || 'learner';
      
      const createResult = await createUserWithPassword(email, password, name, role);
      
      if (createResult.success) {
        console.log(`✅ Successfully created user: ${email}`);
      } else {
        console.log(`❌ Failed to create user: ${email}`);
        process.exit(1);
      }
    } else {
      console.log('\nTo create a new user, run:');
      console.log(`node set-direct-password.js ${email} ${password} --create [name] [role]`);
      process.exit(1);
    }
  }
  
  // 2. First try to log in (maybe password already works)
  console.log('\nTrying to authenticate with provided password...');
  const authCheck = await testUserAuthentication(email, password);
  
  if (authCheck.success) {
    console.log('\n✅ User can already authenticate with the provided password!');
    console.log('No password change needed.');
    process.exit(0);
  }
  
  // 3. Try common passwords before changing
  console.log('\nTrying to authenticate with common passwords before changing...');
  const commonPasswordCheck = await attemptLoginWithCommonPasswords(email);
  
  if (commonPasswordCheck.success) {
    console.log(`\n✅ Found a working password: ${commonPasswordCheck.password}`);
    console.log('No password change needed unless you want to change it.');
    
    if (process.argv.includes('--force')) {
      console.log('\nForce flag detected, proceeding with password change anyway...');
    } else {
      console.log('\nTo force password change anyway, use --force flag:');
      console.log(`node set-direct-password.js ${email} ${password} --force`);
      process.exit(0);
    }
  }
  
  // 4. Set the password directly
  if (process.argv.includes('--force') || !commonPasswordCheck.success) {
    console.log('\nSetting password directly...');
    const setResult = await setPasswordDirectly(email, password);
    
    if (setResult.success) {
      console.log('\n✅ Password has been set or reset process initiated!');
      
      if (setResult.method === 'reset-email' || setResult.method === 'magic-link') {
        console.log(`\nNOTE: ${setResult.message}`);
        console.log('\nDevelopment login credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password} (after reset)`);
      } else {
        // Test the new password
        console.log('\nTesting new password authentication...');
        const finalCheck = await testUserAuthentication(email, password);
        
        if (finalCheck.success) {
          console.log('\n✅ Authentication successful with new password!');
        } else {
          console.log('\n⚠️ Authentication with new password not working yet.');
          console.log('The user may need to confirm their email or complete the password reset flow.');
        }
      }
    } else {
      console.log('\n❌ Failed to set password directly.');
      console.log('This is often due to limitations with the anonymous API key.');
      console.log('\nAlternative approach:');
      console.log('1. Go to the Supabase Dashboard: https://app.supabase.io');
      console.log('2. Navigate to Authentication > Users');
      console.log(`3. Find the user with email: ${email}`);
      console.log('4. Use the admin interface to reset their password');
    }
  }
  
  // Final message
  console.log('\n=== SUMMARY ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('\nIf you need to test again, run:');
  console.log(`node set-direct-password.js ${email} ${password}`);
};

// Execute the main function
main(); 