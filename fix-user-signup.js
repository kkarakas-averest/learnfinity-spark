// Script to attempt to sign up user through standard flow
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

// Function to attempt a standard user signup
const attemptUserSignup = async (email, password) => {
  try {
    console.log(`Attempting to sign up user: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://learnfinity.averesttraining.com/auth/callback'
      }
    });
    
    if (error) {
      console.error('Error signing up user:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Sign-up initiated for: ${email}`);
    console.log('User data:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error during sign-up:', error);
    return { success: false, error };
  }
};

// Function to send a password reset email
const sendPasswordResetEmail = async (email) => {
  try {
    console.log(`Sending password reset email to: ${email}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://learnfinity.averesttraining.com/auth/callback?reset=true'
    });
    
    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Password reset email sent to: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
};

// Function to fix user email format (replace or normalize)
const fixEmailFormat = (email) => {
  // Remove any leading/trailing whitespace
  let fixed = email.trim();
  
  // Normalize to lowercase
  fixed = fixed.toLowerCase();
  
  // Check if it's an obvious typo
  if (fixed === 'kkarakass@averesttraining.com') {
    // Try variations like removing double s
    const variations = [
      'kkarakas@averesttraining.com', // single s
      'kubilaykarakas@averesttraining.com', // full name
      'kubilay.karakas@averesttraining.com', // with dot
      'k.karakas@averesttraining.com', // initial with dot
    ];
    
    console.log(`Suggesting variations for ${email}:`);
    variations.forEach((variant, index) => {
      console.log(`${index + 1}. ${variant}`);
    });
    
    // Return original for now
    return fixed;
  }
  
  return fixed;
};

// Create/Update user in the application database
const updateUserInDatabase = async (authUserId, email, name, role) => {
  try {
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('Error checking for existing user:', checkError);
      return { success: false, error: checkError };
    }
    
    if (existingUser) {
      // User exists, update the ID to match auth ID
      console.log(`Updating existing user with auth ID: ${authUserId}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ id: authUserId })
        .eq('email', email);
      
      if (error) {
        console.error('Error updating user ID:', error);
        return { success: false, error };
      }
      
      console.log(`✅ Updated user ID to match auth ID: ${authUserId}`);
      return { success: true };
    } else {
      // User doesn't exist, create new
      console.log(`Creating new user with auth ID: ${authUserId}`);
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authUserId,
            email,
            name: name || email.split('@')[0],
            role: role || 'learner'
          }
        ]);
      
      if (error) {
        console.error('Error creating user in database:', error);
        return { success: false, error };
      }
      
      console.log(`✅ Created new user in database with ID: ${authUserId}`);
      return { success: true };
    }
  } catch (error) {
    console.error('Error updating user in database:', error);
    return { success: false, error };
  }
};

// Function to format and inspect email errors
const inspectEmailError = (email, error) => {
  console.log(`\n=== EMAIL INSPECTION FOR: ${email} ===`);
  
  if (!error) {
    console.log('No error provided for inspection.');
    return;
  }
  
  console.log(`Error code: ${error.code}`);
  console.log(`Error message: ${error.message}`);
  
  if (error.message.includes('invalid')) {
    console.log('\nPossible issues with email:');
    
    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ Email does not match basic email format pattern');
    } else {
      console.log('✅ Email matches basic format pattern');
    }
    
    // Check for common issues
    if (email.includes('..')) {
      console.log('❌ Email contains consecutive dots');
    }
    
    if (email.includes(' ')) {
      console.log('❌ Email contains spaces');
    }
    
    const domain = email.split('@')[1];
    if (domain) {
      if (!domain.includes('.')) {
        console.log('❌ Domain part does not have a TLD');
      }
      
      const domainParts = domain.split('.');
      if (domainParts[domainParts.length - 1].length < 2) {
        console.log('❌ TLD is too short');
      }
    } else {
      console.log('❌ Email does not have a domain part');
    }
    
    // Show fixed version
    const fixedEmail = fixEmailFormat(email);
    if (fixedEmail !== email) {
      console.log(`\nSuggested fix: ${fixedEmail}`);
    }
  }
  
  console.log('\nRecommendations:');
  
  if (error.code === 'email_address_invalid') {
    console.log('1. Try a different email address that follows standard format');
    console.log('2. Check for typos or formatting issues in the email');
    console.log('3. Try with a different email provider (Gmail, Outlook, etc.)');
  } else if (error.code === 'user_already_exists') {
    console.log('1. Try password reset instead of signup');
    console.log('2. Try to log in with that email and a password you might know');
    console.log('3. Contact support if you need to regain access');
  }
};

// Main function to run the recovery process
const main = async () => {
  // Get target email from command line or use default
  const targetEmail = process.argv[2] || 'kkarakass@averesttraining.com';
  
  // Check if we need to fix email format
  const fixedEmail = fixEmailFormat(targetEmail);
  
  console.log('=== USER SIGNUP RECOVERY UTILITY ===');
  console.log(`Target email: ${targetEmail}`);
  
  if (fixedEmail !== targetEmail) {
    console.log(`Fixed email format: ${fixedEmail}`);
  }
  
  // First check if we can authenticate already
  console.log('\nTrying to authenticate with default password...');
  const authCheck = await testUserAuthentication(fixedEmail, FIXED_PASSWORD);
  
  if (authCheck.success) {
    console.log(`\n✅ Authentication already works for ${fixedEmail}`);
    console.log(`Password: ${FIXED_PASSWORD}`);
    process.exit(0);
  }
  
  // 1. Check if user exists in database
  const dbCheck = await checkUserInDatabase(fixedEmail);
  
  if (dbCheck.exists) {
    console.log(`✅ User found in application database: ${fixedEmail}`);
    console.log('User details:', dbCheck.user);
  } else {
    console.log(`❌ User not found in application database: ${fixedEmail}`);
  }
  
  // 2. Attempt to sign up the user
  console.log('\nAttempting to sign up user...');
  const signupResult = await attemptUserSignup(fixedEmail, FIXED_PASSWORD);
  
  if (signupResult.success) {
    console.log('\n✅ Signup successful!');
    
    if (signupResult.data.user) {
      console.log(`User ID: ${signupResult.data.user.id}`);
      
      // If signup worked, update the database with the auth ID
      if (dbCheck.exists) {
        console.log('\nUpdating user in database to match auth ID...');
        await updateUserInDatabase(
          signupResult.data.user.id,
          fixedEmail,
          dbCheck.user.name,
          dbCheck.user.role
        );
      } else {
        console.log('\nCreating user in database...');
        await updateUserInDatabase(
          signupResult.data.user.id,
          fixedEmail
        );
      }
      
      // Test authentication again
      console.log('\nTesting authentication with new signup...');
      const retestAuth = await testUserAuthentication(fixedEmail, FIXED_PASSWORD);
      
      if (retestAuth.success) {
        console.log(`\n✅ Authentication now works for ${fixedEmail}`);
        console.log(`Password: ${FIXED_PASSWORD}`);
      } else {
        console.log('\n❌ Authentication still not working, but user was created.');
        console.log('Please check your email for confirmation link or try to login manually.');
      }
    } else {
      console.log('\n⚠️ User might need to confirm email before login works.');
      console.log('Please check email inbox for confirmation link.');
    }
  } else {
    console.log('\n❌ Signup failed.');
    
    // Inspect email-related errors
    if (signupResult.error && signupResult.error.message.includes('email')) {
      inspectEmailError(fixedEmail, signupResult.error);
    }
    
    // If user already exists, try a password reset
    if (signupResult.error && 
       (signupResult.error.message.includes('already registered') || 
        signupResult.error.message.includes('already exists'))) {
      
      console.log('\nUser seems to exist already. Attempting password reset...');
      const resetResult = await sendPasswordResetEmail(fixedEmail);
      
      if (resetResult.success) {
        console.log('\n✅ Password reset email sent successfully!');
        console.log('Please check your email inbox for reset instructions.');
      } else {
        console.log('\n❌ Failed to send password reset email.');
        
        // Inspect email-related errors for password reset as well
        if (resetResult.error && resetResult.error.message.includes('email')) {
          inspectEmailError(fixedEmail, resetResult.error);
        }
      }
    }
  }
  
  // Final steps
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Check your email for confirmation or password reset links');
  console.log('2. Try to log in with email and password:', FIXED_PASSWORD);
  console.log('3. If login still fails, run one of these commands:');
  console.log(`   - Try with a variant: node fix-user-signup.js another-email@example.com`);
  console.log(`   - Reset password: node fix-users-password-reset.js ${fixedEmail}`);
};

// Run the main function
main(); 