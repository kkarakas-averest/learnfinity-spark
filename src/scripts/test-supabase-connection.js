/**
 * Script to test Supabase connection with various API keys
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('Testing Supabase connection...');

// Get various API keys
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const VITE_SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

// Print environment variables (hiding full keys)
console.log('Environment variables:');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_KEY exists:', !!SUPABASE_SERVICE_KEY);
console.log('VITE_SUPABASE_URL:', VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!VITE_SUPABASE_ANON_KEY);
console.log('VITE_SUPABASE_SERVICE_KEY exists:', !!VITE_SUPABASE_SERVICE_KEY);

// Test with service key
async function testConnection(url, key, keyType) {
  console.log(`\nTesting connection with ${keyType}...`);
  
  try {
    if (!url || !key) {
      console.log(`Skipping ${keyType} test - missing URL or key`);
      return;
    }
    
    console.log(`Creating Supabase client with URL: ${url}`);
    const supabase = createClient(url, key);
    
    // Test a simple query
    console.log('Testing query...');
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error(`Error with ${keyType}:`, error);
    } else {
      console.log(`✅ Success with ${keyType}!`);
      console.log('Sample data:', data);
    }
  } catch (error) {
    console.error(`Exception with ${keyType}:`, error);
  }
}

// Run tests
async function runTests() {
  await testConnection(SUPABASE_URL, SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY');
  await testConnection(SUPABASE_URL, SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY');
  await testConnection(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_KEY, 'VITE_SUPABASE_SERVICE_KEY');
  await testConnection(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY');
}

runTests()
  .then(() => {
    console.log('\nAll tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 