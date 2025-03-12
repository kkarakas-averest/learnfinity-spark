#!/usr/bin/env node

/**
 * LearnFinity Foundation Schema Applier
 * 
 * This script applies the foundation schema to your Supabase database.
 * It reads the SQL file and executes it against your Supabase instance.
 * 
 * Usage:
 *   node src/db/apply-foundation-schema.js
 * 
 * Make sure your .env file contains the necessary Supabase credentials:
 *   SUPABASE_URL=your-project-url
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Path to the schema SQL file
const schemaFilePath = path.join(__dirname, 'foundation-schema.sql');

async function applySchema() {
  try {
    console.log('Reading foundation schema file...');
    const schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Split the SQL file into individual statements
    // This is a simple approach and might need refinement for complex SQL
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementPreview = statement.length > 50 
        ? `${statement.substring(0, 47)}...` 
        : statement;
      
      console.log(`Executing statement ${i + 1}/${statements.length}: ${statementPreview}`);
      
      try {
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with next statement instead of halting execution
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully.`);
        }
      } catch (stmtError) {
        console.error(`Exception executing statement ${i + 1}:`, stmtError);
        // Continue with next statement
      }
    }
    
    console.log('Schema application completed. Check logs for any errors.');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

// Execute the function
applySchema().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
