#!/usr/bin/env node

// Script to execute split SQL files using direct Supabase queries
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

// Path to the split SQL files
const splitSqlDir = path.join(__dirname, 'split-sql');

// Check if the directory exists
if (!fs.existsSync(splitSqlDir)) {
  console.error(`❌ Directory not found: ${splitSqlDir}`);
  console.log('Run the populate-test-data-split.js script first to create the split SQL files.');
  process.exit(1);
}

// Get all SQL files from the directory
const sqlFiles = fs.readdirSync(splitSqlDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort to ensure files are executed in the correct order

if (sqlFiles.length === 0) {
  console.error('❌ No SQL files found in the split-sql directory.');
  process.exit(1);
}

// Function to execute a SQL file
async function executeSqlFile(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📄 Executing ${filePath} (${statements.length} statements)...`);
    
    // Execute each statement
    for (const [index, stmt] of statements.entries()) {
      try {
        // Execute the SQL statement directly using Supabase
        const { error } = await supabase.rpc('exec_single_statement', { 
          sql_statement: stmt 
        });
        
        if (error) {
          console.error(`  ⚠️ Error executing statement ${index + 1}/${statements.length}:`, error.message);
          // Continue with other statements despite errors
        } else {
          console.log(`  ✅ Statement ${index + 1}/${statements.length} executed successfully`);
        }
      } catch (err) {
        console.error(`  ⚠️ Error executing statement ${index + 1}/${statements.length}:`, err.message);
        // Continue with other statements despite errors
      }
    }
    
    return true;
  } catch (err) {
    console.error(`❌ Error reading or executing ${filePath}:`, err.message);
    return false;
  }
}

// Function to check if exec_single_statement function exists, create if not
async function ensureExecFunction() {
  try {
    console.log('🔍 Checking for exec_single_statement function...');
    
    // Create the exec_single_statement function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_single_statement(sql_statement text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_statement;
      END;
      $$;
    `;
    
    const { error } = await supabase.rpc('exec_single_statement', { 
      sql_statement: 'SELECT 1' 
    });
    
    if (error && error.message.includes('function "exec_single_statement" does not exist')) {
      console.log('📝 Creating exec_single_statement function...');
      
      // Execute the SQL to create the function directly using pg
      const result = await supabase.query(createFunctionSql);
      
      if (result.error) {
        console.error('❌ Failed to create exec_single_statement function:', result.error.message);
        return false;
      }
      
      console.log('✅ exec_single_statement function created successfully');
      return true;
    } else if (error) {
      console.error('❌ Error checking exec_single_statement function:', error.message);
      return false;
    }
    
    console.log('✅ exec_single_statement function already exists');
    return true;
  } catch (err) {
    console.error('❌ Error checking or creating exec_single_statement function:', err.message);
    return false;
  }
}

// Main function to execute all SQL files
async function main() {
  console.log('🚀 Starting execution of split SQL files...');
  
  // Ensure exec_single_statement function exists
  const functionExists = await ensureExecFunction();
  if (!functionExists) {
    console.error('❌ Could not ensure exec_single_statement function exists. Aborting.');
    process.exit(1);
  }
  
  // Execute each SQL file in order
  for (const file of sqlFiles) {
    const filePath = path.join(splitSqlDir, file);
    console.log(`\n📂 Processing ${file}...`);
    
    const success = await executeSqlFile(filePath);
    if (!success) {
      console.error(`❌ Failed to execute ${file}. Continuing with next file.`);
      // Continue with other files despite errors
    } else {
      console.log(`✅ Successfully executed ${file}`);
    }
  }
  
  console.log('\n🎉 Finished executing all SQL files!');
}

// Run the main function
main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
}); 