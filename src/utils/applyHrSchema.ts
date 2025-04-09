import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyHrSchema() {
  try {
    console.log('Starting HR schema application process...');
    
    // Read the HR schema SQL file
    const hrSchemaPath = path.join(process.cwd(), 'src', 'db', 'hr-schema.sql');
    const hrSchemaContent = fs.readFileSync(hrSchemaPath, 'utf8');
    
    console.log('HR schema file loaded successfully.');
    
    // Execute the HR schema SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: hrSchemaContent
    });
    
    if (error) {
      console.error('Error applying HR schema:', error);
      throw error;
    }
    
    console.log('HR schema applied successfully!');
    
    // Next, apply the dashboard schema updates
    const dashboardSchemaPath = path.join(process.cwd(), 'src', 'db', 'update-dashboard-schema.sql');
    const dashboardSchemaContent = fs.readFileSync(dashboardSchemaPath, 'utf8');
    
    console.log('Dashboard schema file loaded successfully.');
    
    // Execute the dashboard schema SQL
    const { data: dashboardData, error: dashboardError } = await supabase.rpc('exec_sql', {
      sql_string: dashboardSchemaContent
    });
    
    if (dashboardError) {
      console.error('Error applying dashboard schema:', dashboardError);
      throw dashboardError;
    }
    
    console.log('Dashboard schema applied successfully!');
    
    // Verify key tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'hr_employees', 
        'hr_courses', 
        'hr_course_enrollments',
        'employee_user_mapping'
      ]);
    
    if (tablesError) {
      console.error('Error verifying tables:', tablesError);
    } else {
      console.log('Tables verified:', tables?.map(t => t.table_name).join(', '));
    }
    
    console.log('Schema application complete.');
  } catch (error) {
    console.error('Unexpected error during schema application:', error);
    process.exit(1);
  }
}

// Run the script
applyHrSchema(); 