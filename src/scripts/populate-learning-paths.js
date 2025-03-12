#!/usr/bin/env node

// Script to populate learning_paths table with test data
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

// Sample learning path data
const learningPaths = [
  {
    hr_assigned: true,
    mandatory: true,
    completed: false
  },
  {
    hr_assigned: true,
    mandatory: false,
    completed: false
  },
  {
    hr_assigned: false,
    mandatory: false,
    completed: true,
    completion_date: new Date().toISOString()
  },
  {
    hr_assigned: true,
    mandatory: true,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    completed: false
  }
];

// Function to insert learning paths
async function insertLearningPaths() {
  try {
    console.log('🔄 Inserting learning paths...');
    
    // Insert learning paths one by one to handle errors individually
    for (let i = 0; i < learningPaths.length; i++) {
      try {
        const { data, error } = await supabase
          .from('learning_paths')
          .insert([learningPaths[i]])
          .select();
        
        if (error) {
          console.error(`❌ Error inserting learning path ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Inserted learning path ${i + 1}`);
          console.log('📊 Result:', data);
        }
      } catch (err) {
        console.error(`❌ Error inserting learning path ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Learning path insertion completed!');
    return true;
  } catch (err) {
    console.error('❌ Error inserting learning paths:', err.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Insert learning paths
    const success = await insertLearningPaths();
    
    if (success) {
      console.log('🎉 Test data population completed successfully!');
    } else {
      console.error('❌ Test data population failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
}); 