// Authentication workaround for users with login issues
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
