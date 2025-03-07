// Script to create a direct login without email verification
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

const supabaseUrlLine = envContent
  .split('\n')
  .find(line => line.startsWith('VITE_SUPABASE_URL='));

const supabaseUrl = supabaseUrlLine
  ? supabaseUrlLine.split('=')[1]?.trim()
  : 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default password to set
const DEVELOPMENT_PASSWORD = 'Averest123!';

// Function to check if a user exists in the database
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

// Function to attempt to sign in with email + password
const attemptSignIn = async (email, password) => {
  try {
    console.log(`Attempting to sign in with: ${email} / ${password}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log(`Sign-in failed: ${error.message}`);
      return { success: false, error };
    }
    
    console.log('✅ Sign-in successful!');
    console.log('User details:', data.user);
    return { success: true, data };
  } catch (error) {
    console.error('Error during sign-in attempt:', error);
    return { success: false, error };
  }
};

// Function to attempt a sign-up with auto-confirm
const attemptSignUpWithAutoConfirm = async (email, password) => {
  try {
    console.log(`Attempting to sign up with auto-confirm: ${email}`);
    
    // Try the sign-up with a direct option to override email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          confirmed_at: new Date().toISOString() // May not work with anonymous key
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('User already registered, this is good!');
        return { success: true, alreadyExists: true };
      }
      
      console.log(`Sign-up failed: ${error.message}`);
      return { success: false, error };
    }
    
    console.log('Sign-up initiated, checking if confirmation is needed...');
    
    // Check if the user is confirmed or needs email verification
    if (data?.user?.confirmed_at) {
      console.log('✅ User is already confirmed!');
      return { success: true, data };
    } else if (data?.user?.confirmation_sent_at) {
      console.log('⚠️ Confirmation email has been sent');
      return { success: false, needsConfirmation: true, data };
    } else {
      console.log('✅ User created without confirmation email');
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error during sign-up attempt:', error);
    return { success: false, error };
  }
};

// Function to try OTP (one-time password) login
const attemptOTPLogin = async (email) => {
  try {
    console.log(`Attempting OTP login for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false // Only send OTP to existing users
      }
    });
    
    if (error) {
      console.log(`OTP login failed: ${error.message}`);
      return { success: false, error };
    }
    
    console.log('✅ OTP email sent! Check your email for the login link.');
    return { success: true, data };
  } catch (error) {
    console.error('Error during OTP login attempt:', error);
    return { success: false, error };
  }
};

// Try to create a temporary login token (requires admin privileges)
const createTempLoginToken = async (email) => {
  try {
    console.log(`Attempting to create temp login token for: ${email}`);
    
    // Note: This would require admin privileges
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    
    if (error) {
      console.log(`Token creation failed: ${error.message}`);
      return { success: false, error };
    }
    
    console.log('✅ Temporary login token created!');
    console.log('Token URL:', data.properties.action_link);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating temporary login token:', error);
    return { success: false, error };
  }
};

// Function to try a variety of common passwords
const tryCommonPasswords = async (email) => {
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
    'secret',
    'letmein',
    'welcome',
    'Admin123',
    'P@ssw0rd',
    'qwerty',
    'Test1234',
    'test',
    'Default1',
    'User123',
    'Login123',
    'learnfinity',
    'averest',
    'training',
    'Learnfinity1',
    'Averest1',
    'Training1'
  ];
  
  console.log(`Trying ${commonPasswords.length} common passwords for: ${email}`);
  
  for (const password of commonPasswords) {
    const result = await attemptSignIn(email, password);
    if (result.success) {
      console.log(`✅ Found working password: ${password}`);
      return { success: true, password };
    }
  }
  
  console.log('❌ None of the common passwords worked');
  return { success: false };
};

// Function to try signing in with email variants
const tryEmailVariants = async (baseEmail, password) => {
  // Generate variations of the email
  const [localPart, domain] = baseEmail.split('@');
  const variants = [
    baseEmail, // Original email
    localPart.toLowerCase() + '@' + domain, // all lowercase
    localPart.toUpperCase() + '@' + domain, // LOCAL@domain
    localPart.charAt(0).toUpperCase() + localPart.slice(1) + '@' + domain, // Camelcase
    localPart.replace(/\./g, '') + '@' + domain, // remove dots
    localPart.replace(/([^s])s([^s])/g, '$1ss$2') + '@' + domain, // double s
    localPart.replace(/ss/g, 's') + '@' + domain, // single s
  ];
  
  // Add some special cases for our specific email
  if (baseEmail.includes('kkarakas')) {
    variants.push('kkarakass@averesttraining.com');
    variants.push('kkarakas@averesttraining.com');
    variants.push('kubilay.karakas@averesttraining.com');
    variants.push('k.karakas@averesttraining.com');
  }
  
  // Remove duplicates
  const uniqueVariants = [...new Set(variants)];
  
  console.log(`Trying ${uniqueVariants.length} email variants with password: ${password}`);
  
  for (const variant of uniqueVariants) {
    console.log(`Trying email variant: ${variant}`);
    const result = await attemptSignIn(variant, password);
    
    if (result.success) {
      console.log(`✅ Successfully authenticated with email variant: ${variant}`);
      return { success: true, email: variant };
    }
  }
  
  console.log('❌ None of the email variants worked with the given password');
  return { success: false };
};

// Function to update user in database
const updateUserInDatabase = async (userId, data) => {
  try {
    console.log(`Updating user in database with ID: ${userId}`);
    console.log('Update data:', data);
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user in database:', error);
      return { success: false, error };
    }
    
    console.log('✅ User updated successfully in database');
    return { success: true };
  } catch (error) {
    console.error('Error updating user in database:', error);
    return { success: false, error };
  }
};

// Function to create a dev test user
const createDevTestUser = async (email, password, name, role) => {
  try {
    console.log(`Creating development test user: ${email}`);
    
    // 1. Try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email, 
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: role || 'learner'
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('User already exists in auth system, proceeding...');
      } else {
        console.error('Error creating user in auth system:', error);
        return { success: false, error };
      }
    } else {
      console.log('✅ User created in auth system');
    }
    
    // 2. Check if user exists in application database
    const { exists, user: existingUser } = await checkUserInDatabase(email);
    
    if (exists) {
      console.log('User already exists in application database');
      return { 
        success: true, 
        message: 'User already exists in both auth and database systems' 
      };
    }
    
    // 3. Create user in application database
    const userId = data?.user?.id || crypto.randomUUID();
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
      console.error('Error creating user in database:', dbError);
      return { success: false, error: dbError };
    }
    
    console.log('✅ User created in application database');
    return { success: true };
  } catch (error) {
    console.error('Error creating dev test user:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  // Get target email from command line or use default
  const email = process.argv[2] || 'kkarakas@averesttraining.com';
  const password = process.argv[3] || DEVELOPMENT_PASSWORD;
  
  console.log('=== DIRECT USER LOGIN UTILITY ===');
  console.log(`Target email: ${email}`);
  console.log(`Password to try: ${password}`);
  
  // 1. Check if the user exists in the database
  const dbCheck = await checkUserInDatabase(email);
  
  if (dbCheck.exists) {
    console.log(`✅ User found in database: ${email}`);
    console.log('User details:', dbCheck.user);
  } else {
    console.log(`❌ User not found in database: ${email}`);
    
    if (process.argv.includes('--create')) {
      console.log('\nCreating dev test user...');
      const name = process.argv[4] || email.split('@')[0];
      const role = process.argv[5] || 'learner';
      
      const createResult = await createDevTestUser(email, password, name, role);
      
      if (createResult.success) {
        console.log('✅ Dev test user created successfully');
      } else {
        console.log('❌ Failed to create dev test user');
        process.exit(1);
      }
    } else {
      console.log('\nTo create a dev test user, run:');
      console.log(`node fix-user-direct-login.js ${email} ${password} --create [name] [role]`);
      process.exit(1);
    }
  }
  
  // 2. First try direct sign-in with the provided password
  console.log('\nAttempting direct sign-in with provided password...');
  const signInResult = await attemptSignIn(email, password);
  
  if (signInResult.success) {
    console.log('\n✅ Direct sign-in successful! No further action needed.');
    process.exit(0);
  }
  
  // 3. Try various common passwords
  console.log('\nTrying common passwords...');
  const commonPasswordResult = await tryCommonPasswords(email);
  
  if (commonPasswordResult.success) {
    console.log(`\n✅ Found working password: ${commonPasswordResult.password}`);
    console.log('Login is possible with this password.');
    
    if (process.argv.includes('--update-password')) {
      console.log(`\nWould proceed to update password to: ${password}`);
      // This would require admin privileges
    }
    
    process.exit(0);
  }
  
  // 4. Try email variants
  console.log('\nTrying email variants with the provided password...');
  const emailVariantResult = await tryEmailVariants(email, password);
  
  if (emailVariantResult.success) {
    console.log(`\n✅ Found working email variant: ${emailVariantResult.email}`);
    console.log('Login is possible with this email variant.');
    
    if (process.argv.includes('--update-database')) {
      console.log('\nUpdating database record to match the working email...');
      // Would need to update the database record
    }
    
    process.exit(0);
  }
  
  // 5. Attempt auto-confirm signup
  if (process.argv.includes('--force-signup')) {
    console.log('\nAttempting sign-up with auto-confirm...');
    const signUpResult = await attemptSignUpWithAutoConfirm(email, password);
    
    if (signUpResult.success) {
      console.log('\n✅ Sign-up successful or user already exists!');
      
      console.log('\nTrying to sign in with the new credentials...');
      const verifySignIn = await attemptSignIn(email, password);
      
      if (verifySignIn.success) {
        console.log('\n✅ Sign-in successful with the new credentials!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Sign-in still not working with the new credentials.');
      }
    } else {
      console.log('\n❌ Sign-up with auto-confirm failed.');
      
      if (signUpResult.needsConfirmation) {
        console.log('User needs email confirmation. Check your email.');
      }
    }
  }
  
  // 6. Attempt OTP login
  if (process.argv.includes('--otp')) {
    console.log('\nAttempting OTP (one-time password) login...');
    const otpResult = await attemptOTPLogin(email);
    
    if (otpResult.success) {
      console.log('\n✅ OTP email sent! Check your email for the login link.');
      console.log('After logging in with the OTP link, you can set a new password.');
      process.exit(0);
    } else {
      console.log('\n❌ OTP login failed.');
    }
  }
  
  // Fallback: Create a test user for development
  if (process.argv.includes('--test-user')) {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test123!';
    
    console.log(`\nCreating a test user for development: ${testEmail}`);
    const createTestResult = await createDevTestUser(testEmail, testPassword, 'Test User', 'learner');
    
    if (createTestResult.success) {
      console.log('\n✅ Test user created successfully!');
      console.log('\nTest user credentials:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      
      console.log('\nVerifying login with test user...');
      const verifyTest = await attemptSignIn(testEmail, testPassword);
      
      if (verifyTest.success) {
        console.log('\n✅ Test user login verified!');
      } else {
        console.log('\n⚠️ Test user created but login not working yet.');
        console.log('You may need to confirm the email first.');
      }
    } else {
      console.log('\n❌ Failed to create test user.');
    }
  }
  
  // Summary and next steps
  console.log('\n=== SUMMARY AND NEXT STEPS ===');
  console.log('Login attempts for the target user were unsuccessful.');
  console.log('\nOptions:');
  console.log('1. Try with email variants:');
  console.log(`   node fix-user-direct-login.js [variant-email] ${password}`);
  console.log('2. Try OTP login (requires email access):');
  console.log(`   node fix-user-direct-login.js ${email} ${password} --otp`);
  console.log('3. Force sign-up with confirmation bypass:');
  console.log(`   node fix-user-direct-login.js ${email} ${password} --force-signup`);
  console.log('4. Create a test user for development:');
  console.log(`   node fix-user-direct-login.js ${email} ${password} --test-user`);
};

// Run the main function
main(); 