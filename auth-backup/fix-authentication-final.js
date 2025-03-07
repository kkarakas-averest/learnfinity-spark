// Script to fix authentication by ensuring database and auth systems are in sync
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

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default development password
const DEVELOPMENT_PASSWORD = 'Averest123!';

// Function to check if a user exists in the database
const checkUserInDatabase = async (email) => {
  try {
    console.log(`Checking if user exists in database: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, password, created_at')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return { exists: false };
      }
      console.error('Error checking user in database:', error);
      return { exists: false, error };
    }
    
    console.log('User found in database:', data);
    return { exists: true, user: data };
  } catch (error) {
    console.error('Error checking user in database:', error);
    return { exists: false, error };
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
      console.log(`Authentication failed for ${email}:`, error.message);
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

// Function to create a new user in auth
const createUserInAuth = async (email, password, userData) => {
  try {
    console.log(`Creating user in Auth system: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('User already exists in auth system');
        return { success: true, exists: true };
      }
      
      console.error('Error creating user in auth system:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created in auth system');
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user in auth system:', error);
    return { success: false, error };
  }
};

// Function to update database user with auth ID
const updateUserInDatabaseWithAuthId = async (email, authUserId) => {
  try {
    console.log(`Updating user in database with auth ID: ${authUserId}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ id: authUserId })
      .eq('email', email);
    
    if (error) {
      console.error('Error updating user in database:', error);
      return { success: false, error };
    }
    
    console.log('✅ User updated in database with auth ID');
    return { success: true };
  } catch (error) {
    console.error('Error updating user in database:', error);
    return { success: false, error };
  }
};

// Function to create a user in the database
const createUserInDatabase = async (authUserId, userData) => {
  try {
    console.log(`Creating user in database: ${userData.email}`);
    
    // Create user object
    const user = {
      id: authUserId,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      role: userData.role || 'learner',
      password: 'auth_managed', // Placeholder, actual auth is managed by Supabase Auth
      created_at: new Date().toISOString()
    };
    
    console.log('User object to insert:', user);
    
    const { data, error } = await supabase
      .from('users')
      .insert([user]);
    
    if (error) {
      console.error('Error creating user in database:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created in database');
    return { success: true };
  } catch (error) {
    console.error('Error creating user in database:', error);
    return { success: false, error };
  }
};

// Function to try signing in with email variations
const tryEmailVariations = async (email, password) => {
  // Generate common variations
  const variations = [
    email, // Original
    email.toLowerCase(), // all lowercase
    email.replace(/([^s])s([^s])/g, '$1ss$2'), // double s
    email.replace(/ss/g, 's') // single s
  ];
  
  // Add specific variations for our target email
  if (email.includes('kkarakas')) {
    variations.push('kkarakass@averesttraining.com');
    variations.push('kkarakas@averesttraining.com');
  }
  
  // Remove duplicates
  const uniqueVariations = [...new Set(variations)];
  
  for (const variant of uniqueVariations) {
    console.log(`Trying email variant: ${variant}`);
    const result = await testUserAuthentication(variant, password);
    
    if (result.success) {
      return { success: true, email: variant, data: result.data };
    }
  }
  
  return { success: false };
};

// Main function to fix authentication
const main = async () => {
  // Get email and password from command line or use defaults
  const email = process.argv[2] || 'kkarakas@averesttraining.com';
  const password = process.argv[3] || DEVELOPMENT_PASSWORD;
  
  console.log('=== AUTHENTICATION FIX UTILITY ===');
  console.log(`Target email: ${email}`);
  console.log(`Password to use: ${password}`);
  
  // Get test user from command line
  const useTestUser = process.argv.includes('--use-test');
  const testEmail = 'test1740997540466@example.com';
  const testPassword = 'Test123!';
  
  if (useTestUser) {
    console.log(`\nUsing test user instead: ${testEmail}`);
    
    const testAuthResult = await testUserAuthentication(testEmail, testPassword);
    
    if (testAuthResult.success) {
      console.log('\n✅ Test user authentication successful!');
      console.log('\nTest user credentials:');
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      
      return;
    } else {
      console.log('\n❌ Test user authentication failed.');
      console.log('Proceeding with fixing the target user...');
    }
  }
  
  // 1. First, check if the user exists in the database
  const dbCheck = await checkUserInDatabase(email);
  
  if (!dbCheck.exists) {
    console.log(`❌ User not found in database: ${email}`);
    console.log('Cannot proceed without a user record in the database.');
    
    // Try email variations
    console.log('\nTrying variations of the email...');
    const variations = [
      email.replace(/ss/g, 's'), // single s if email has double s
      email.replace(/([^s])s([^s])/g, '$1ss$2') // double s if email has single s
    ];
    
    for (const variant of variations) {
      console.log(`Checking variant: ${variant}`);
      const variantCheck = await checkUserInDatabase(variant);
      
      if (variantCheck.exists) {
        console.log(`✅ Found user with variant email: ${variant}`);
        
        // Ask if the user wants to update email in the database
        console.log('\nTo update the email in the database, run:');
        console.log(`node fix-email-mismatch.js ${variant} ${email} --update`);
        return;
      }
    }
    
    console.log('\nNo variations found. To create a new user, run:');
    console.log(`node create-test-user.js ${email} ${password}`);
    return;
  }
  
  console.log(`✅ User found in database: ${email}`);
  
  // 2. Test authentication with the provided credentials
  const authTest = await testUserAuthentication(email, password);
  
  if (authTest.success) {
    console.log('\n✅ Authentication already works! Nothing to fix.');
    return;
  }
  
  // 3. Try authentication with email variations
  console.log('\nTrying authentication with email variations...');
  const variationTest = await tryEmailVariations(email, password);
  
  if (variationTest.success) {
    console.log(`\n✅ Authentication works with email variation: ${variationTest.email}`);
    
    if (variationTest.email !== email) {
      console.log('\nTo update the email in the database to match the auth system, run:');
      console.log(`node fix-email-mismatch.js ${email} ${variationTest.email} --update`);
    }
    
    return;
  }
  
  // 4. Authentication is really broken, try to fix it
  console.log('\nAuthentication is broken. Attempting to fix...');
  
  // Try to create/recreate the user in auth
  const createAuthResult = await createUserInAuth(email, password, dbCheck.user);
  
  if (!createAuthResult.success) {
    console.log('\n❌ Failed to create user in auth system.');
    console.log('Try running the password reset script:');
    console.log(`node fix-users-password-reset.js ${email}`);
    return;
  }
  
  // If the user was newly created in auth, update the database user with the auth ID
  if (!createAuthResult.exists && createAuthResult.data) {
    const authUserId = createAuthResult.data.user.id;
    
    console.log(`Auth user ID: ${authUserId}`);
    console.log(`Database user ID: ${dbCheck.user.id}`);
    
    if (authUserId !== dbCheck.user.id) {
      console.log('\nUpdating database user ID to match auth user ID...');
      
      await updateUserInDatabaseWithAuthId(email, authUserId);
    }
  }
  
  // Test authentication again
  console.log('\nTesting authentication after fix attempt...');
  const finalAuthTest = await testUserAuthentication(email, password);
  
  if (finalAuthTest.success) {
    console.log('\n✅ Authentication fixed successfully!');
    console.log('\nLogin credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    return;
  }
  
  // If still not working, suggest using the test user
  console.log('\n❌ Authentication still not working after fix attempt.');
  console.log('This might require admin access to the Supabase Auth system.');
  
  console.log('\nOptions:');
  console.log('1. Use a test user for development:');
  console.log(`   node fix-authentication-final.js ${email} ${password} --use-test ${testEmail} ${testPassword}`);
  console.log('2. Try a password reset via the Supabase admin dashboard');
  console.log('3. Create a new test user:');
  console.log(`   node create-test-user.js`);
};

// Run the main function
main(); 