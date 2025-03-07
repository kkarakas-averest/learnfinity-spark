// Script to automatically detect and fix users that exist in the application database
// but don't have corresponding auth entries
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

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Constants
const FIXED_PASSWORD = 'Averest123!';

// Generate a temporary password
const generatePassword = () => {
  return FIXED_PASSWORD;
};

// Function to get all users from the application database
const getAllUsers = async () => {
  try {
    console.log('Fetching all users from the application database...');
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${data.length} users in the application database.`);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Function to fix a specific user
const fixUser = async (user) => {
  try {
    console.log(`\nAttempting to fix user: ${user.email}`);
    
    // First, try to sign up the user directly
    const password = generatePassword();
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: user.email,
      password,
      options: {
        data: {
          name: user.name,
          role: user.role,
          user_id: user.id
        }
      }
    });
    
    if (signupError) {
      console.log(`Failed to create auth user for ${user.email}:`, signupError.message);
      return { 
        success: false, 
        email: user.email, 
        error: signupError.message 
      };
    }
    
    console.log(`✅ Successfully created auth user for ${user.email} with password: ${password}`);
    return { 
      success: true, 
      email: user.email, 
      password 
    };
  } catch (error) {
    console.error(`Error fixing user ${user.email}:`, error);
    return { 
      success: false, 
      email: user.email, 
      error: String(error) 
    };
  }
};

// Function to test if a user can authenticate
const testUserAuth = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Function to detect which users need fixing
const detectAndFixUsers = async () => {
  // Get all users from the application database
  const allUsers = await getAllUsers();
  
  if (allUsers.length === 0) {
    console.log('No users found in the application database.');
    return { success: false, message: 'No users found' };
  }
  
  console.log(`\nDetecting users that need fixing...`);
  
  const results = {
    success: true,
    fixed: [],
    failed: [],
    skipped: []
  };
  
  // Check each user
  for (const user of allUsers) {
    console.log(`\nChecking user: ${user.email}`);
    
    // Special handling for the target user
    if (user.email === 'kkarakass@averesttraining.com') {
      console.log('Found target user, attempting to fix...');
      
      // Try to fix this user
      const fixResult = await fixUser(user);
      
      if (fixResult.success) {
        results.fixed.push({
          email: user.email,
          password: fixResult.password
        });
      } else {
        results.failed.push({
          email: user.email,
          error: fixResult.error
        });
      }
      
      continue;
    }
    
    // For other users, first test if they can already authenticate
    const testResult = await testUserAuth(user.email, FIXED_PASSWORD);
    
    if (testResult.success) {
      console.log(`User ${user.email} can already authenticate, skipping.`);
      results.skipped.push({ email: user.email, reason: 'Can already authenticate' });
      continue;
    }
    
    // User needs fixing
    const fixResult = await fixUser(user);
    
    if (fixResult.success) {
      results.fixed.push({
        email: user.email,
        password: fixResult.password
      });
    } else {
      results.failed.push({
        email: user.email,
        error: fixResult.error
      });
    }
  }
  
  return results;
};

// Main function
const main = async () => {
  console.log('=== AUTOMATIC USER AUTHENTICATION FIX UTILITY ===');
  
  // Detect and fix users
  const results = await detectAndFixUsers();
  
  console.log('\n==============================================');
  console.log('FIX RESULTS:');
  console.log('==============================================');
  
  if (!results.success) {
    console.log(results.message);
    return;
  }
  
  console.log(`\n✅ Fixed ${results.fixed.length} users:`);
  results.fixed.forEach(user => {
    console.log(`- ${user.email} (Password: ${user.password})`);
  });
  
  console.log(`\n❌ Failed to fix ${results.failed.length} users:`);
  results.failed.forEach(user => {
    console.log(`- ${user.email}: ${user.error}`);
  });
  
  console.log(`\nℹ️ Skipped ${results.skipped.length} users that didn't need fixing.`);
  
  if (results.fixed.length > 0) {
    console.log('\n==============================================');
    console.log('SUCCESS! Users have been fixed.');
    console.log('You can login with the emails and passwords above.');
    console.log('For the target user:');
    
    const targetUser = results.fixed.find(u => u.email === 'kkarakass@averesttraining.com');
    if (targetUser) {
      console.log(`Email: ${targetUser.email}`);
      console.log(`Password: ${targetUser.password}`);
    } else {
      console.log('Target user not found in fixed users list.');
    }
    console.log('==============================================');
  }
};

// Run the main function
main(); 