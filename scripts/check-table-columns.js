#!/usr/bin/env node
// Check specific columns in tables

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to check
const tablesToCheck = [
  'hr_employee_skills',
  'position_skill_requirements'
];

async function checkColumns() {
  console.log('🔍 Checking columns for specific tables...');
  
  for (const table of tablesToCheck) {
    console.log(`\n📋 Table: ${table}`);
    
    // Direct way to execute SQL and retrieve results
    try {
      // Use fetch directly with the Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql: `
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = '${table}'
            ORDER BY ordinal_position;
          `
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const columns = await response.json();
      if (columns && Array.isArray(columns)) {
        console.log('Columns:');
        columns.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type})${col.is_nullable === 'YES' ? ' nullable' : ''}${col.column_default ? ` default: ${col.column_default}` : ''}`);
        });
      } else {
        console.log('Unable to retrieve column information through REST API');
      }
      
      // Alternative approach for specific columns
      for (const column of ['proficiency', 'required_proficiency']) {
        const existsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            sql: `
              SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = '${table}' 
                  AND column_name = '${column}'
              ) AS column_exists;
            `
          })
        });
        
        if (existsResponse.ok) {
          const existsResult = await existsResponse.json();
          if (Array.isArray(existsResult) && existsResult.length > 0) {
            console.log(`Column '${column}' exists: ${existsResult[0].column_exists ? 'YES' : 'NO'}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error checking columns for ${table}:`, err.message);
    }
  }
}

// Run the check
checkColumns()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 