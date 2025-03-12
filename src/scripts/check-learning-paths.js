#!/usr/bin/env node

// Simple script to check the learning_paths table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Ensure Supabase credentials are available
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using anon key instead of service key. This might cause permission issues.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main function
async function main() {
  try {
    console.log('🔍 Checking learning_paths table...');
    
    // Try to select a single row from the table
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying learning_paths:', error.message);
      return;
    }
    
    console.log('✅ Successfully queried learning_paths table');
    console.log('📊 Sample data:', data);
    
    // Try to get the table definition
    console.log('\n🔍 Attempting to get column names...');
    
    try {
      // This is a workaround to get column names from the first row
      if (data && data.length > 0) {
        const columnNames = Object.keys(data[0]);
        console.log('📋 Column names:', columnNames);
      } else {
        console.log('ℹ️ No data found in learning_paths table to extract column names');
        
        // Try an alternative approach with a dummy insert that will fail
        console.log('\n🔍 Trying alternative approach to get column info...');
        
        const dummyInsert = await supabase
          .from('learning_paths')
          .insert([{ dummy: 'value' }]);
        
        if (dummyInsert.error) {
          console.log('ℹ️ Error message from dummy insert (may contain column info):', dummyInsert.error.message);
        }
      }
    } catch (err) {
      console.error('❌ Error getting column names:', err.message);
    }
    
    console.log('\n🎉 Check completed!');
  } catch (err) {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
}); 