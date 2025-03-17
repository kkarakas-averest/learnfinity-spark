#!/usr/bin/env node

// Supabase Database API for Claude
// This script allows Claude to interact with your Supabase database
// via command line operations

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your project URL and anon key
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Process different commands
async function processCommand() {
  try {
    if (!command) {
      console.log('Please provide a command. Available commands:');
      console.log('  list-tables                  - List all available tables');
      console.log('  describe-table [table_name]  - Show structure of a table');
      console.log('  query [table_name] [limit]   - Query data from a table');
      console.log('  employees                    - List employees with departments and positions');
      console.log('  departments                  - List all departments');
      console.log('  positions                    - List all positions');
      return;
    }

    switch (command) {
      case 'list-tables':
        await listTables();
        break;
      case 'describe-table':
        if (!args[1]) {
          console.error('Error: Table name is required');
          return;
        }
        await describeTable(args[1]);
        break;
      case 'query':
        if (!args[1]) {
          console.error('Error: Table name is required');
          return;
        }
        const limit = args[2] ? parseInt(args[2]) : 10;
        await queryTable(args[1], limit);
        break;
      case 'employees':
        await queryEmployees();
        break;
      case 'departments':
        await queryDepartments();
        break;
      case 'positions':
        await queryPositions();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// List all tables in the database
async function listTables() {
  try {
    // First try to use pg_catalog query if available
    const { data, error } = await supabase.rpc('get_tables', { schema_name: 'public' });
    
    if (error) {
      // Fallback to directly querying some common tables we know about
      console.log('Known tables in the database:');
      const tables = [
        'hr_departments',
        'hr_positions',
        'hr_employees',
        'learning_paths',
        'learning_path_courses',
        'learning_path_assignments',
        'courses'
      ];
      
      for (const table of tables) {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (!tableError) {
          console.log(`- ${table}`);
        }
      }
    } else {
      console.log('Tables in the database:');
      data.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
  } catch (error) {
    console.error('Error listing tables:', error.message);
  }
}

// Describe the structure of a table
async function describeTable(tableName) {
  try {
    // Query a single row to get column information
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`Error accessing table ${tableName}:`, error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log(`Table ${tableName} exists but has no data`);
      return;
    }
    
    console.log(`Table structure for ${tableName}:`);
    console.log('------------------------------------');
    
    // Show column names and their data types based on the first row
    const firstRow = data[0];
    Object.keys(firstRow).forEach(column => {
      const value = firstRow[column];
      const type = value !== null ? typeof value : 'NULL';
      console.log(`${column} (${type})`);
    });
    
    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log('------------------------------------');
      console.log(`Total rows: ${count}`);
    }
  } catch (error) {
    console.error(`Error describing table ${tableName}:`, error.message);
  }
}

// Query data from a table
async function queryTable(tableName, limit = 10) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
      
    if (error) {
      console.error(`Error querying table ${tableName}:`, error.message);
      return;
    }
    
    console.log(`Data from ${tableName} (${data.length} rows):`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error querying table ${tableName}:`, error.message);
  }
}

// Query employees with departments and positions
async function queryEmployees() {
  try {
    const { data, error } = await supabase
      .from('hr_employees')
      .select(`
        id,
        name,
        email,
        status,
        rag_status,
        department_id,
        position_id,
        hr_departments(id, name),
        hr_positions(id, title)
      `)
      .limit(20);
      
    if (error) {
      console.error('Error querying employees:', error.message);
      return;
    }
    
    console.log(`Employees with departments and positions (${data.length} rows):`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error querying employees:', error.message);
  }
}

// Query all departments
async function queryDepartments() {
  try {
    const { data, error } = await supabase
      .from('hr_departments')
      .select('*');
      
    if (error) {
      console.error('Error querying departments:', error.message);
      return;
    }
    
    console.log(`Departments (${data.length}):`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error querying departments:', error.message);
  }
}

// Query all positions
async function queryPositions() {
  try {
    const { data, error } = await supabase
      .from('hr_positions')
      .select(`
        id,
        title,
        department_id,
        hr_departments(id, name)
      `);
      
    if (error) {
      console.error('Error querying positions:', error.message);
      return;
    }
    
    console.log(`Positions (${data.length}):`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error querying positions:', error.message);
  }
}

// Execute the command
processCommand(); 