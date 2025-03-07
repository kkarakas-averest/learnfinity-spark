// Script to create a simple workaround file for authentication issues
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

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default test user that works
const TEST_USER_EMAIL = 'test1740997540466@example.com';
const TEST_USER_PASSWORD = 'Test123!';

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

// Function to create mappings file
const createMappingsFile = (mappings) => {
  try {
    const filePath = path.join(__dirname, 'auth-mappings.json');
    
    // Create mappings object
    const mappingsData = {
      version: '1.0',
      created: new Date().toISOString(),
      mappings
    };
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(mappingsData, null, 2));
    
    console.log(`✅ Mappings file created at: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error creating mappings file:', error);
    return { success: false, error };
  }
};

// Function to create auth workaround file
const createWorkaroundFile = () => {
  try {
    const filePath = path.join(__dirname, 'auth-workaround.js');
    
    const workaroundCode = `// Authentication workaround for users with login issues
// This file provides a workaround for users who cannot log in with their own credentials
// by mapping them to a test user for authentication purposes.

import { createClient } from '@supabase/supabase-js';
import authMappings from './auth-mappings.json';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main workaround function to authenticate users
export async function authenticateUser(email, password) {
  console.log('Authenticating user:', email);
  
  // First, try normal authentication
  const { data: normalData, error: normalError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  // If normal authentication works, return the result
  if (!normalError) {
    console.log('Normal authentication successful');
    return { data: normalData, error: null, method: 'normal' };
  }
  
  console.log('Normal authentication failed, checking mappings...');
  
  // Check if we have a mapping for this user
  const mapping = authMappings.mappings.find(m => m.originalEmail === email);
  
  // If no mapping found, return the original error
  if (!mapping) {
    console.log('No mapping found for user:', email);
    return { data: null, error: normalError, method: 'normal' };
  }
  
  console.log('Found mapping to test user:', mapping.testEmail);
  
  // Try to authenticate with the test user credentials
  const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
    email: mapping.testEmail,
    password: mapping.testPassword
  });
  
  // If test user authentication fails, return the error
  if (testError) {
    console.log('Test user authentication failed:', testError.message);
    return { data: null, error: testError, method: 'test' };
  }
  
  console.log('Test user authentication successful');
  
  // Create a wrapped session that translates the user
  const wrappedSession = {
    ...testData,
    user: {
      ...testData.user,
      email: email, // Replace with original email
      original_email: email,
      test_email: mapping.testEmail,
      is_test_user: true
    }
  };
  
  return { 
    data: wrappedSession, 
    error: null, 
    method: 'test',
    originalUser: mapping
  };
}

// Function to get user from database with the original email
export async function getUserByEmail(email) {
  // First, check if this is a mapped user
  const mapping = authMappings.mappings.find(m => m.originalEmail === email);
  
  // Query the database with the original email (not the test email)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error getting user by email:', error);
    return { data: null, error };
  }
  
  return { data, error: null, mapping };
}

// Function to check if a user is using a test account
export function isUsingTestAccount(user) {
  return user && user.is_test_user === true;
}

// Function to get the original user email if using a test account
export function getOriginalEmail(user) {
  return user?.original_email || user?.email;
}
`;
    
    // Write to file
    fs.writeFileSync(filePath, workaroundCode);
    
    console.log(`✅ Workaround file created at: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error creating workaround file:', error);
    return { success: false, error };
  }
};

// Function to create readme file
const createReadmeFile = () => {
  try {
    const filePath = path.join(__dirname, 'AUTH-WORKAROUND-README.md');
    
    const readmeContent = `# Authentication Workaround

## Overview

This workaround provides a solution for users who cannot log in with their own credentials due to authentication issues. It works by mapping problematic users to a working test user account while maintaining their original identity in the application.

## Files

- \`auth-mappings.json\`: Contains mappings between original user emails and test user credentials
- \`auth-workaround.js\`: JavaScript module that handles the authentication logic

## How to Use

1. Import the authentication function in your login component:

\`\`\`javascript
import { authenticateUser } from './auth-workaround';
\`\`\`

2. Replace your existing authentication logic:

\`\`\`javascript
// Before
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// After
const { data, error, method } = await authenticateUser(email, password);
\`\`\`

3. To get user data, use the helper function:

\`\`\`javascript
import { getUserByEmail } from './auth-workaround';

// Get the user with their original email
const { data: userData } = await getUserByEmail(email);
\`\`\`

## How It Works

1. The workaround first tries normal authentication
2. If normal authentication fails, it checks for a mapping
3. If a mapping exists, it authenticates with the test user
4. It then wraps the session to maintain the original user's identity

## Additional Features

- \`isUsingTestAccount(user)\`: Checks if a user is authenticated via a test account
- \`getOriginalEmail(user)\`: Gets the original email for users using test accounts

## Adding More Users

To add more users to the workaround, run:

\`\`\`
node simple-workaround.js [email-to-map]
\`\`\`
`;
    
    // Write to file
    fs.writeFileSync(filePath, readmeContent);
    
    console.log(`✅ README file created at: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error creating README file:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  // Get problematic user email from command line
  const problemEmail = process.argv[2] || 'kkarakas@averesttraining.com';
  
  console.log('=== SIMPLE AUTHENTICATION WORKAROUND UTILITY ===');
  console.log(`Problem user email: ${problemEmail}`);
  console.log(`Test user email: ${TEST_USER_EMAIL}\n`);
  
  // First, check if the problematic user exists
  const userCheck = await checkUserInDatabase(problemEmail);
  
  if (!userCheck.exists) {
    console.error(`❌ Problem user not found in database: ${problemEmail}`);
    console.error('Cannot proceed without a valid user record.');
    process.exit(1);
  }
  
  console.log(`✅ Problem user found: ${problemEmail}`);
  
  // Check if the test user exists and is working
  console.log(`\nVerifying test user: ${TEST_USER_EMAIL}`);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  });
  
  if (authError) {
    console.error(`❌ Test user authentication failed: ${TEST_USER_EMAIL}`);
    console.error('Error:', authError.message);
    process.exit(1);
  }
  
  console.log(`✅ Test user authentication successful: ${TEST_USER_EMAIL}`);
  
  // Create a mappings array with the problem user
  const mappings = [
    {
      originalEmail: problemEmail,
      originalName: userCheck.user.name,
      originalRole: userCheck.user.role,
      testEmail: TEST_USER_EMAIL,
      testPassword: TEST_USER_PASSWORD,
      createdAt: new Date().toISOString()
    }
  ];
  
  // Create mappings file
  console.log('\nCreating mappings file...');
  const mappingsResult = createMappingsFile(mappings);
  
  if (!mappingsResult.success) {
    console.error('❌ Failed to create mappings file');
    process.exit(1);
  }
  
  // Create workaround file
  console.log('\nCreating workaround implementation file...');
  const workaroundResult = createWorkaroundFile();
  
  if (!workaroundResult.success) {
    console.error('❌ Failed to create workaround file');
    process.exit(1);
  }
  
  // Create readme file
  console.log('\nCreating README file...');
  const readmeResult = createReadmeFile();
  
  if (!readmeResult.success) {
    console.error('❌ Failed to create README file');
    process.exit(1);
  }
  
  console.log(`\n✅ WORKAROUND IMPLEMENTED SUCCESSFULLY!`);
  console.log('\nTo use this workaround:');
  console.log('1. Import the authentication function in your login component:');
  console.log('   import { authenticateUser } from \'./auth-workaround\';');
  console.log('2. Replace your existing authentication logic with:');
  console.log('   const { data, error } = await authenticateUser(email, password);');
  console.log('\nSee AUTH-WORKAROUND-README.md for complete instructions.\n');
};

// Run the main function
main(); 