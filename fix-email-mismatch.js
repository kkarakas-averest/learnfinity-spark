// Script to fix mismatch between database email and auth email
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

// Function to check if a user exists in the application database
const checkUserInDatabase = async (email) => {
  try {
    console.log(`Checking if user exists in database with email: ${email}`);
    
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
    console.log(`Testing authentication for ${email} with password: ${password}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.log(`Authentication failed for ${email}:`, error.message);
      return { success: false, error };
    }
    
    console.log(`✅ Authentication successful for ${email}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Error during authentication test for ${email}:`, error);
    return { success: false, error };
  }
};

// Function to update user email in the database
const updateUserEmailInDatabase = async (oldEmail, newEmail) => {
  try {
    console.log(`Updating user email in database from ${oldEmail} to ${newEmail}...`);
    
    // First, check if the old email exists
    const oldEmailCheck = await checkUserInDatabase(oldEmail);
    
    if (!oldEmailCheck.exists) {
      console.log(`❌ User with email ${oldEmail} not found in database. Cannot update.`);
      return { success: false, message: 'User not found' };
    }
    
    // Check if new email already exists
    const newEmailCheck = await checkUserInDatabase(newEmail);
    
    if (newEmailCheck.exists) {
      console.log(`❌ User with email ${newEmail} already exists in database. Cannot update.`);
      return { success: false, message: 'New email already exists' };
    }
    
    // Update the email
    const { data, error } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('email', oldEmail);
    
    if (error) {
      console.error('Error updating user email:', error);
      return { success: false, error };
    }
    
    console.log(`✅ Successfully updated email from ${oldEmail} to ${newEmail} in database`);
    
    // Verify the update was successful
    const verifyUpdate = await checkUserInDatabase(newEmail);
    
    if (verifyUpdate.exists) {
      console.log(`✅ Verified: User with email ${newEmail} now exists in database`);
      console.log('User details:', verifyUpdate.user);
    } else {
      console.log(`❌ Verification failed: User with email ${newEmail} still not found in database`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user email in database:', error);
    return { success: false, error };
  }
};

// Function to check for possible misspellings
const checkForMisspellings = (email) => {
  const variations = [];
  
  // Check for common typos
  if (email.includes('ss')) {
    variations.push(email.replace('ss', 's'));
  }
  
  if (email.includes('s') && !email.includes('ss')) {
    variations.push(email.replace(/([^s])s([^s])/g, '$1ss$2'));
  }
  
  return variations;
};

// Main function to run the fix
const main = async () => {
  // Get emails from command line or use defaults
  const oldEmail = process.argv[2] || 'kkarakass@averesttraining.com';
  const newEmail = process.argv[3] || 'kkarakas@averesttraining.com';
  const shouldUpdate = process.argv.includes('--update');
  
  console.log('=== EMAIL MISMATCH FIX UTILITY ===');
  
  // Check old email in database
  console.log(`\nChecking source email: ${oldEmail}`);
  const oldEmailCheck = await checkUserInDatabase(oldEmail);
  
  if (oldEmailCheck.exists) {
    console.log(`✅ User found in database with email: ${oldEmail}`);
    console.log('User details:', oldEmailCheck.user);
  } else {
    console.log(`❌ User with email ${oldEmail} not found in database`);
    
    // Check for misspellings of the source email
    const variations = checkForMisspellings(oldEmail);
    
    if (variations.length > 0) {
      console.log('\nTrying variations of the source email:');
      
      for (const variant of variations) {
        const variantCheck = await checkUserInDatabase(variant);
        
        if (variantCheck.exists) {
          console.log(`✅ Found user with variant email: ${variant}`);
          console.log('User details:', variantCheck.user);
        }
      }
    }
    
    console.log('\nCannot proceed with update since source email not found');
    process.exit(1);
  }
  
  // Check target email in database
  console.log(`\nChecking target email: ${newEmail}`);
  const newEmailCheck = await checkUserInDatabase(newEmail);
  
  if (newEmailCheck.exists) {
    console.log(`❌ User with email ${newEmail} already exists in database`);
    console.log('User details:', newEmailCheck.user);
    console.log('Cannot update as this would create a duplicate');
    process.exit(1);
  } else {
    console.log(`✅ Email ${newEmail} is available for use`);
  }
  
  // Test authentication with both emails
  console.log('\n=== AUTHENTICATION TESTS ===');
  
  // Test common passwords
  const passwords = [
    'Averest123!',
    'password123',
    'Password123',
    '123456',
    'changeme'
  ];
  
  for (const email of [oldEmail, newEmail]) {
    console.log(`\nTesting authentication for ${email} with multiple passwords...`);
    let authenticated = false;
    
    for (const password of passwords) {
      const authTest = await testUserAuthentication(email, password);
      
      if (authTest.success) {
        console.log(`✅ Successfully authenticated with ${email} using password: ${password}`);
        authenticated = true;
        break;
      }
    }
    
    if (!authenticated) {
      console.log(`❌ Authentication failed for ${email} with all test passwords`);
    }
  }
  
  // Update the email if requested
  if (shouldUpdate) {
    console.log('\n=== UPDATING EMAIL IN DATABASE ===');
    const updateResult = await updateUserEmailInDatabase(oldEmail, newEmail);
    
    if (updateResult.success) {
      console.log(`\n✅ Successfully updated email from ${oldEmail} to ${newEmail}`);
      
      // Test authentication with new email after update
      console.log('\nTesting authentication with new email after update...');
      
      for (const password of passwords) {
        const authTest = await testUserAuthentication(newEmail, password);
        
        if (authTest.success) {
          console.log(`✅ Successfully authenticated with ${newEmail} using password: ${password}`);
          break;
        }
      }
    } else {
      console.log(`\n❌ Failed to update email from ${oldEmail} to ${newEmail}`);
    }
  } else {
    console.log('\nTo update the email in the database, run:');
    console.log(`node fix-email-mismatch.js ${oldEmail} ${newEmail} --update`);
  }
};

// Run the main function
main(); 