#!/usr/bin/env node

// Script to populate test data by executing SQL directly
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// Get current file directory (ES module version)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or key not found in environment variables.');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) are set in your .env file.');
  process.exit(1);
}

// Using service key is preferred for admin operations
const isUsingServiceKey = supabaseKey === process.env.SUPABASE_SERVICE_KEY;
if (!isUsingServiceKey) {
  console.warn('⚠️ Warning: Using anon key instead of service key. Some operations may fail due to permissions.');
  console.warn('For full access, add SUPABASE_SERVICE_KEY to your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'populate-test-data.sql');

// Function to execute SQL
async function executeSql() {
  try {
    console.log('📂 Reading SQL file...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into statements
    // This is a simple approach and might not work for all SQL files
    // For complex statements, you might need a more sophisticated parser
    const statements = sqlContent.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      process.stdout.write(`⏳ Executing statement ${i + 1}/${statements.length}... `);
      
      try {
        // Execute the SQL statement using Supabase REST API
        // Note: This might not work for all statements due to permissions
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.error(`❌ Error: ${error.message}`);
          // Continue executing remaining statements even if one fails
        } else {
          console.log('✅');
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
      }
    }
    
    console.log('\n🎉 SQL execution completed!');
    console.log('Note: Some statements might have failed due to permissions or syntax. Check the output above.');
    
  } catch (err) {
    console.error(`❌ Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Check if the exec_sql function exists or create it
async function ensureExecSqlFunction() {
  console.log('🔍 Checking if exec_sql function exists...');
  
  try {
    // Try to use the function
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('⚙️ Creating exec_sql function...');
      
      // Create the function
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `;
      
      // Using raw REST API to create the function
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: createFunctionSql
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Failed to create exec_sql function:', errorData);
        console.error('You might need to manually create this function using admin privileges.');
        console.error(`SQL to create function: ${createFunctionSql}`);
        process.exit(1);
      }
      
      console.log('✅ exec_sql function created successfully!');
    } else if (!error) {
      console.log('✅ exec_sql function already exists.');
    } else {
      console.error('❌ Error checking exec_sql function:', error);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting test data population...');
  
  // Ensure the exec_sql function exists
  await ensureExecSqlFunction();
  
  // Execute the SQL file
  await executeSql();
}

main().catch(err => {
  console.error('❌ Uncaught error:', err);
  process.exit(1);
}); 