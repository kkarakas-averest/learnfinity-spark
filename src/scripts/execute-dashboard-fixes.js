import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Supabase credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'dashboard-fixes.sql');

// Check if the SQL file exists
if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

// Function to create exec_sql function if it doesn't exist
async function ensureExecSqlFunction() {
  try {
    console.log('Checking if exec_sql function exists...');
    
    // Check if function exists by trying to use it
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('Creating exec_sql function...');
      
      // We can't create the function with anon key, so let's modify our approach
      console.log('You need to create the exec_sql function in the Supabase dashboard SQL editor:');
      console.log(`
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `);
      
      console.log('Continuing with direct SQL execution...');
      return false;
    } else if (!error) {
      console.log('exec_sql function already exists.');
      return true;
    } else {
      console.log('Error checking function:', error.message);
      return false;
    }
  } catch (err) {
    console.error('Error checking exec_sql function:', err);
    return false;
  }
}

// Function to execute SQL statements directly
async function executeStatementDirectly(stmt) {
  try {
    // Parse statement to determine the operation
    const operation = stmt.trim().split(' ')[0].toUpperCase();
    
    if (operation === 'ALTER' && stmt.toUpperCase().includes('ADD COLUMN')) {
      // For ADD COLUMN, we need to determine the table and column
      const tableMatch = stmt.match(/ALTER\s+TABLE\s+(\w+)/i);
      const columnMatch = stmt.match(/ADD\s+COLUMN\s+(\w+)/i);
      
      if (tableMatch && columnMatch) {
        const table = tableMatch[1];
        const column = columnMatch[1];
        console.log(`Adding column ${column} to table ${table}...`);
        
        // We can try a migration approach instead of direct execution
        console.log(`For this operation, please run the following in the Supabase dashboard SQL editor: 
          ${stmt}`);
        return true;
      }
    } 
    else if (operation === 'CREATE' && stmt.toUpperCase().includes('TABLE')) {
      // For CREATE TABLE, extract the table name
      const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      
      if (tableMatch) {
        const table = tableMatch[1];
        console.log(`Creating table ${table}...`);
        
        // We can try a migration approach instead of direct execution
        console.log(`For this operation, please run the following in the Supabase dashboard SQL editor: 
          ${stmt}`);
        return true;
      }
    }
    else if (operation === 'INSERT') {
      // For INSERT statements, we can try to use the from() method
      const tableMatch = stmt.match(/INSERT\s+INTO\s+(\w+)/i);
      
      if (tableMatch) {
        const table = tableMatch[1];
        console.log(`Inserting data into ${table}...`);
        
        // For inserts, we need to extract values - this is complex
        // For simplicity, suggest running in SQL editor
        console.log(`For this operation, please run the following in the Supabase dashboard SQL editor: 
          ${stmt}`);
        return true;
      }
    }
    else if (operation === 'UPDATE') {
      // For UPDATE statements
      const tableMatch = stmt.match(/UPDATE\s+(\w+)/i);
      
      if (tableMatch) {
        const table = tableMatch[1];
        console.log(`Updating data in ${table}...`);
        
        // For updates, we need to extract values - this is complex
        // For simplicity, suggest running in SQL editor
        console.log(`For this operation, please run the following in the Supabase dashboard SQL editor: 
          ${stmt}`);
        return true;
      }
    }
    else if (operation === 'SELECT') {
      // We can execute SELECT statements if needed
      console.log(`Executing SELECT statement...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`Error executing SELECT: ${error.message}`);
        return false;
      } else {
        console.log(`SELECT executed successfully. Results:`, data);
        return true;
      }
    }
    
    // For other statements, recommend SQL editor
    console.log(`For this operation, please run the following in the Supabase dashboard SQL editor: 
      ${stmt}`);
    return true;
  } catch (err) {
    console.error(`Error executing statement directly: ${err.message}`);
    return false;
  }
}

// Main function to execute SQL
async function executeSql() {
  try {
    console.log('Reading SQL file...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into statements
    const statements = sqlContent.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements.`);
    
    // Check if we can use the exec_sql function
    const hasExecSql = await ensureExecSqlFunction();
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      if (hasExecSql) {
        try {
          // Try to execute with exec_sql
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          
          if (error) {
            console.error(`Error with exec_sql: ${error.message}`);
            console.log('Trying direct execution...');
            await executeStatementDirectly(stmt);
          } else {
            console.log(`Statement ${i + 1} executed successfully with exec_sql.`);
          }
        } catch (err) {
          console.error(`Exception with exec_sql: ${err.message}`);
          console.log('Trying direct execution...');
          await executeStatementDirectly(stmt);
        }
      } else {
        // Try direct execution
        await executeStatementDirectly(stmt);
      }
    }
    
    console.log('\nSQL execution completed!');
    console.log('Note: Some statements may require manual execution in the Supabase dashboard SQL editor.');
    
  } catch (err) {
    console.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run the main function
executeSql().catch(console.error); 