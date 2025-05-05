#!/usr/bin/env node
// Check if the skill taxonomy tables contain data

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to check
const tables = [
  'skill_taxonomy_categories',
  'skill_taxonomy_subcategories',
  'skill_taxonomy_groups',
  'skill_taxonomy_items',
  'hr_employee_skills',
  'position_skill_requirements'
];

async function checkTables() {
  console.log('🔍 Checking if tables exist and contain data...');
  
  for (const table of tables) {
    // First check if the table exists
    try {
      // Try to count rows in the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table ${table} does not exist`);
        } else {
          console.log(`❌ Error checking table ${table}:`, error.message);
        }
      } else {
        console.log(`✅ Table ${table} exists with ${count} rows`);
        
        // If there's data, show a sample
        if (count > 0) {
          const { data: sampleData, error: sampleError } = await supabase
            .from(table)
            .select('*')
            .limit(3);
          
          if (!sampleError && sampleData) {
            console.log(`   Sample data:`, JSON.stringify(sampleData, null, 2).substring(0, 500) + (JSON.stringify(sampleData, null, 2).length > 500 ? '...' : ''));
          }
        }
      }
    } catch (err) {
      console.error(`❌ Error checking table ${table}:`, err);
    }
  }
  
  // Try to run exec_sql function to verify it works
  try {
    console.log('\n🔍 Checking if exec_sql function exists...');
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error) {
      console.log('❌ exec_sql function does not exist or encountered an error:', error.message);
    } else {
      console.log('✅ exec_sql function exists and is working');
    }
  } catch (err) {
    console.error('❌ Error checking exec_sql function:', err);
  }
}

// Run the check
checkTables()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 