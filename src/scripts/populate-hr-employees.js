#!/usr/bin/env node

// Script to populate hr_employees table with test data
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

// Sample employee data
const employees = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'active',
    company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
    rag_status: 'green',
    current_rag_status: 'green'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    status: 'active',
    company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
    rag_status: 'green',
    current_rag_status: 'green'
  },
  {
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    status: 'active',
    company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
    rag_status: 'amber',
    current_rag_status: 'amber'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    status: 'active',
    company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
    rag_status: 'green',
    current_rag_status: 'green'
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    status: 'active',
    company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
    rag_status: 'red',
    current_rag_status: 'red'
  }
];

// Function to insert employees
async function insertEmployees() {
  try {
    console.log('🔄 Inserting employees...');
    
    // Insert employees one by one to handle errors individually
    for (const employee of employees) {
      try {
        // Add timestamp to email to make it unique
        const timestamp = Date.now();
        const uniqueEmail = `${employee.email.split('@')[0]}_${timestamp}@example.com`;
        
        const { data, error } = await supabase
          .from('hr_employees')
          .insert([{
            ...employee,
            email: uniqueEmail,
            last_rag_update: new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error(`❌ Error inserting employee ${employee.name}:`, error.message);
        } else {
          console.log(`✅ Inserted employee ${employee.name}`);
          console.log('📊 Result:', data);
        }
      } catch (err) {
        console.error(`❌ Error inserting employee ${employee.name}:`, err.message);
      }
    }
    
    console.log('🎉 Employee insertion completed!');
    return true;
  } catch (err) {
    console.error('❌ Error inserting employees:', err.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Insert employees
    const success = await insertEmployees();
    
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