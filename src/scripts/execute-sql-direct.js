#!/usr/bin/env node

// Script to execute SQL directly using the Supabase client
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Function to execute SQL
async function executeSql() {
  try {
    console.log('🔄 Executing SQL...');
    
    // Generate a unique identifier for the test employee
    const timestamp = new Date().toISOString();
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    // Execute the SQL directly using Supabase
    const { data, error } = await supabase
      .from('hr_employees')
      .insert([
        { 
          name: `Test Employee ${timestamp}`, 
          email: uniqueEmail, 
          status: 'active',
          company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
          rag_status: 'green',
          current_rag_status: 'green',
          last_rag_update: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    console.log('📊 Result:', data);
    
    // Now try to insert a learning path
    console.log('\n🔄 Attempting to insert a learning path...');
    
    // First, get the ID of the employee we just inserted
    const employeeId = data[0].id;
    
    const { data: pathData, error: pathError } = await supabase
      .from('learning_paths')
      .insert([
        {
          name: `Test Learning Path ${timestamp}`,
          description: 'A test learning path created by the data population script',
          creator_id: employeeId,
          estimated_hours: 10,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (pathError) {
      console.error('❌ Error inserting learning path:', pathError.message);
      // Continue despite error
    } else {
      console.log('✅ Learning path inserted successfully');
      console.log('📊 Learning path result:', pathData);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error executing SQL:', err.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Execute the SQL
    const success = await executeSql();
    
    if (success) {
      console.log('🎉 SQL execution completed successfully!');
    } else {
      console.error('❌ SQL execution failed.');
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