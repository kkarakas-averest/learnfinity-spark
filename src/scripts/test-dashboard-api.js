// Test dashboard API script
// This script tests the dashboard API after patching to ensure it includes new fields
// Run with: node src/scripts/test-dashboard-api.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// API endpoints to test
const apiEndpoints = [
  'http://localhost:3000/api/learner/dashboard',
  'http://localhost:3001/api/learner/dashboard',
  'http://localhost:3083/api/learner/dashboard',
];

// Get a user to test with
async function getTestUser() {
  console.log('Fetching a test user from the database...');
  
  try {
    const { data: employees, error } = await supabase
      .from('hr_employees')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching employees:', error);
      return null;
    }
    
    if (!employees || employees.length === 0) {
      console.error('No employees found in the database');
      return null;
    }
    
    console.log(`Found test user: ${employees[0].name} (${employees[0].email})`);
    return employees[0];
  } catch (err) {
    console.error('Exception fetching test user:', err);
    return null;
  }
}

// Test API endpoints
async function testEndpoints(userId) {
  console.log(`Testing API endpoints with user ID: ${userId}`);
  
  let successfulTests = 0;
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`\nTesting endpoint: ${endpoint}`);
      
      // Add user ID as query parameter
      const url = `${endpoint}?userId=${userId}`;
      console.log(`Request URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log('Response received!');
      
      // Check if response has expected structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid response format');
        continue;
      }
      
      // Check if learningPaths exist
      if (!Array.isArray(data.learningPaths)) {
        console.error('No learning paths array in response');
        continue;
      }
      
      console.log(`Found ${data.learningPaths.length} learning paths in response`);
      
      // Check if new fields exist in learning paths
      let hasNewFields = false;
      
      for (const path of data.learningPaths) {
        if ('estimatedCompletionDate' in path || 'enrollmentDate' in path) {
          hasNewFields = true;
          console.log('✅ New fields found in learning path data:');
          console.log(`  - ID: ${path.id}`);
          console.log(`  - Title: ${path.title}`);
          console.log(`  - Estimated completion date: ${path.estimatedCompletionDate || 'not set'}`);
          console.log(`  - Enrollment date: ${path.enrollmentDate || 'not set'}`);
          break;
        }
      }
      
      if (!hasNewFields) {
        console.warn('⚠️ New fields not found in any learning paths');
      } else {
        successfulTests++;
      }
      
      // Check if courses exist
      if (!data.courses || !Array.isArray(data.courses.items)) {
        console.error('No courses array in response');
        continue;
      }
      
      console.log(`Found ${data.courses.items.length} courses in response`);
      
    } catch (err) {
      console.error(`Exception testing endpoint ${endpoint}:`, err);
    }
  }
  
  return successfulTests;
}

// Main function to run tests
async function main() {
  console.log('Starting dashboard API tests...');
  
  // Get test user
  const testUser = await getTestUser();
  
  if (!testUser) {
    console.error('Could not find a test user, exiting.');
    process.exit(1);
  }
  
  // Test endpoints with user ID
  const successCount = await testEndpoints(testUser.id);
  
  if (successCount > 0) {
    console.log(`\n✅ API tests completed with ${successCount}/${apiEndpoints.length} successful endpoints.`);
    
    if (successCount < apiEndpoints.length) {
      console.log('\nNot all endpoints were successful. This could be because:');
      console.log('1. Some API servers are not running');
      console.log('2. Some API servers have not been patched yet');
      console.log('3. The servers are running on different ports than expected');
    }
  } else {
    console.error('\n❌ All API tests failed.');
    console.log('\nPossible issues:');
    console.log('1. API servers are not running');
    console.log('2. API patch was not applied correctly');
    console.log('3. API servers are running on different ports');
    console.log('\nAction items:');
    console.log('1. Make sure the API server is running');
    console.log('2. Run the patch-api-server.js script again');
    console.log('3. Restart the API server after patching');
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nTest script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  }); 