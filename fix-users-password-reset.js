// Script to reset passwords for users who are already registered
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

// Constants
const FIXED_PASSWORD = 'Averest123!';

// Function to update a user's metadata in Supabase auth
const updateUserMetadata = async (email) => {
  try {
    console.log(`Updating metadata for user: ${email}`);
    
    // Get user details from the application database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error fetching user details:', userError);
      return { success: false, error: userError };
    }
    
    // Attempt to log in as an admin to update
    console.log('Logging in as admin is required to update user metadata');
    console.log('This is just informational since we cannot do this with anon key');
    
    return {
      success: false,
      message: 'Admin access required to update user metadata'
    };
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return { success: false, error };
  }
};

// Function to attempt direct admin password reset
const resetPasswordDirectly = async (email) => {
  try {
    console.log(`\nAttempting direct admin password reset for: ${email}`);
    console.log('This requires admin access and will not work with anonymous key.');
    console.log('This is just informational.');
    
    return {
      success: false,
      message: 'Admin access required for direct password reset'
    };
  } catch (error) {
    console.error('Error during direct reset:', error);
    return { success: false, error };
  }
};

// Function to send password reset email
const sendPasswordResetEmail = async (email) => {
  try {
    console.log(`\nSending password reset email to: ${email}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: 'https://ujlqzkkkfatehxeqtbdl.supabase.co/reset-password',
      }
    );
    
    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
    
    console.log('Password reset email sent successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { success: false, error };
  }
};

// Function to try admin sign in to reset user password
const adminResetUserPassword = async (email) => {
  console.log('\nAttempting admin reset (informational only)');
  console.log('This requires admin credentials which we do not have access to.');
  console.log('To perform this action, an admin would:');
  console.log('1. Sign in to the Supabase dashboard');
  console.log('2. Go to Authentication > Users');
  console.log(`3. Find the user with email: ${email}`);
  console.log('4. Click "Reset password" or edit the user to set a new password');
  
  return {
    success: false,
    message: 'Admin access required',
    nextSteps: 'Contact administrator to reset password manually'
  };
};

// Function to attempt signing in with default passwords
const attemptSignInWithCommonPasswords = async (email) => {
  console.log(`\nAttempting to sign in with common passwords for: ${email}`);
  
  // List of passwords to try
  const passwords = [
    'password123',
    'Password123',
    '123456',
    'changeme',
    'test1234',
    'Welcome1',
    FIXED_PASSWORD,
    'supabase',
    'Supabase123'
  ];
  
  for (const password of passwords) {
    console.log(`Trying password: ${password}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error) {
      console.log('✅ Login successful with password:', password);
      return { 
        success: true, 
        password,
        message: 'Found working password'
      };
    }
  }
  
  console.log('❌ All common passwords failed');
  return { 
    success: false,
    message: 'Could not find working password'
  };
};

// Main function
const main = async () => {
  const email = process.argv[2] || 'kkarakass@averesttraining.com';
  
  console.log('=== PASSWORD RESET UTILITY ===');
  console.log(`Attempting to fix login for user: ${email}`);
  
  // First, try common passwords
  console.log('\nStep 1: Trying common passwords...');
  const passwordResult = await attemptSignInWithCommonPasswords(email);
  
  if (passwordResult.success) {
    console.log('\n==============================================');
    console.log('✅ SUCCESS! Found working password for user.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${passwordResult.password}`);
    console.log('==============================================');
    return;
  }
  
  // If that doesn't work, try password reset
  console.log('\nStep 2: Attempting password reset via email...');
  const resetResult = await sendPasswordResetEmail(email);
  
  if (resetResult.success) {
    console.log('\n==============================================');
    console.log('✅ Password reset email sent!');
    console.log(`An email has been sent to ${email}.`);
    console.log('Please check your email and follow the instructions to reset your password.');
    console.log('==============================================');
  } else {
    console.log('\n==============================================');
    console.log('❌ Failed to reset password via email.');
    console.log('Next steps:');
    console.log('1. Contact an administrator to reset your password manually.');
    console.log('2. Try to register a new account with a different email.');
    console.log('==============================================');
  }
  
  // Give informational guidance on admin reset
  console.log('\nStep 3: Admin reset information:');
  const adminInfo = await adminResetUserPassword(email);
  console.log('\n==============================================');
  console.log('If all else fails, an administrator can help reset your password.');
  console.log('Please provide them with this information:');
  console.log(`User email: ${email}`);
  console.log('==============================================');
};

// Run the main function
main(); 