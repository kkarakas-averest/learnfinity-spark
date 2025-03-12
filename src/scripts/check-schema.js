#!/usr/bin/env node

// Script to check the schema of the hr_employees table
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

// Function to check if a table exists
async function checkTableExists(tableName) {
  try {
    console.log(`🔍 Checking if table '${tableName}' exists...`);
    
    // Try to select a single row from the table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ Table '${tableName}' does not exist.`);
        return false;
      } else {
        console.error(`❌ Error checking table '${tableName}':`, error.message);
        return false;
      }
    }
    
    console.log(`✅ Table '${tableName}' exists.`);
    return true;
  } catch (err) {
    console.error(`❌ Error checking table '${tableName}':`, err.message);
    return false;
  }
}

// Function to list all tables
async function listTables() {
  try {
    console.log('📋 Listing all tables...');
    
    // Query the information_schema to get all tables
    const { data, error } = await supabase
      .rpc('list_tables');
    
    if (error) {
      console.error('❌ Error listing tables:', error.message);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No tables found or no permission to view tables.');
      return [];
    }
    
    console.log('📊 Tables found:', data);
    return data;
  } catch (err) {
    console.error('❌ Error listing tables:', err.message);
    return [];
  }
}

// Function to check table schema
async function checkTableSchema(tableName) {
  try {
    console.log(`🔍 Checking schema for table '${tableName}'...`);
    
    // Query the information_schema to get column information
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (error) {
      console.error(`❌ Error checking schema for '${tableName}':`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`ℹ️ No columns found for table '${tableName}' or no permission to view schema.`);
      return null;
    }
    
    console.log(`📊 Schema for table '${tableName}':`, data);
    return data;
  } catch (err) {
    console.error(`❌ Error checking schema for '${tableName}':`, err.message);
    return null;
  }
}

// Main function
async function main() {
  try {
    // Check if hr_employees table exists
    const tableExists = await checkTableExists('hr_employees');
    
    if (!tableExists) {
      // List all tables to see what's available
      await listTables();
    } else {
      // Check the schema of hr_employees
      await checkTableSchema('hr_employees');
    }
    
    console.log('🎉 Schema check completed!');
  } catch (err) {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  }
}

// Create RPC functions for listing tables and getting columns
async function createHelperFunctions() {
  try {
    console.log('🔧 Creating helper functions...');
    
    // Create function to list tables
    const listTablesResult = await supabase.rpc('list_tables');
    
    if (listTablesResult.error && listTablesResult.error.message.includes('does not exist')) {
      console.log('📝 Creating list_tables function...');
      
      const createListTablesResult = await supabase.query(`
        CREATE OR REPLACE FUNCTION list_tables()
        RETURNS TABLE (table_name text)
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT table_name::text
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        $$;
      `);
      
      if (createListTablesResult.error) {
        console.error('❌ Error creating list_tables function:', createListTablesResult.error.message);
      } else {
        console.log('✅ list_tables function created successfully');
      }
    }
    
    // Create function to get table columns
    const getTableColumnsResult = await supabase.rpc('get_table_columns', { table_name: 'dummy' });
    
    if (getTableColumnsResult.error && getTableColumnsResult.error.message.includes('does not exist')) {
      console.log('📝 Creating get_table_columns function...');
      
      const createGetTableColumnsResult = await supabase.query(`
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE (
          column_name text,
          data_type text,
          is_nullable boolean
        )
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT 
            column_name::text,
            data_type::text,
            is_nullable::text = 'YES' as is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
          ORDER BY ordinal_position;
        $$;
      `);
      
      if (createGetTableColumnsResult.error) {
        console.error('❌ Error creating get_table_columns function:', createGetTableColumnsResult.error.message);
      } else {
        console.log('✅ get_table_columns function created successfully');
      }
    }
  } catch (err) {
    console.error('❌ Error creating helper functions:', err.message);
  }
}

// Run the main function
createHelperFunctions()
  .then(() => main())
  .catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  }); 