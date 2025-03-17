// Explore Supabase Database
import { createClient } from '@supabase/supabase-js';

// Copy your project URL and API key directly from the .env file
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E';

// Initialize Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// List of tables to explore - based on what we found in the codebase
const tables = [
  'hr_departments',
  'hr_positions',
  'hr_employees',
  'learning_paths',
  'learning_path_courses',
  'learning_path_assignments',
  'courses'
];

async function exploreTable(tableName) {
  console.log(`\n📋 Exploring table: ${tableName}`);
  
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
      
    if (error) {
      console.error(`❌ Error accessing table ${tableName}:`, error);
      return null;
    }
    
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (!countError) {
      console.log(`📊 Total rows: ${count}`);
    }
    
    if (data && data.length > 0) {
      // Show sample data
      console.log(`🔍 Sample data (${data.length} rows):`);
      console.log(data);
      
      // Show columns by examining first row
      console.log('📋 Columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const sample = data[0][col];
        const type = sample !== null ? typeof sample : 'null';
        console.log(`   - ${col} (${type})`);
      });
      
      return {
        exists: true,
        rowCount: count,
        sampleData: data,
        columns: columns
      };
    } else {
      console.log('ℹ️ Table exists but has no data');
      return {
        exists: true,
        rowCount: 0,
        sampleData: [],
        columns: []
      };
    }
  } catch (err) {
    console.error(`❌ Exception exploring table ${tableName}:`, err);
    return null;
  }
}

async function main() {
  console.log('🔍 Exploring Supabase Database');
  console.log('==============================');
  
  const results = {};
  
  // Explore each table
  for (const table of tables) {
    results[table] = await exploreTable(table);
  }
  
  // Show relationship between HR tables
  if (results.hr_departments && results.hr_positions && results.hr_employees) {
    console.log('\n🔄 Exploring HR table relationships');
    
    try {
      // Get employees with department and position information
      const { data: employees, error } = await supabase
        .from('hr_employees')
        .select(`
          id, 
          name, 
          department_id, 
          position_id,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .limit(5);
        
      if (error) {
        console.error('❌ Error querying employee relationships:', error);
      } else {
        console.log('🔍 Employees with Department and Position:');
        console.log(JSON.stringify(employees, null, 2));
      }
    } catch (err) {
      console.error('❌ Exception exploring relationships:', err);
    }
  }
  
  console.log('\n✅ Database exploration complete');
}

main().catch(console.error); 