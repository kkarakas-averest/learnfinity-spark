/**
 * Script to create HR tables using Supabase client
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Try different environment variable patterns to find working credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your environment variables.');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key available: ${!!supabaseKey}`);

// Initialize Supabase client with service role key if possible
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Create hr_employee_skills table
 */
async function createEmployeeSkillsTable() {
  try {
    console.log('Checking if hr_employee_skills table exists...');
    const exists = await tableExists('hr_employee_skills');
    
    if (exists) {
      console.log('hr_employee_skills table already exists');
      return true;
    }
    
    console.log('Creating hr_employee_skills table...');
    
    // First create the table with minimal fields
    const { error: createError } = await supabase
      .from('hr_employee_skills')
      .insert([
        { 
          employee_id: '00000000-0000-0000-0000-000000000000', 
          skill_name: 'placeholder',
          proficiency_level: 'beginner',
          is_in_progress: false
        }
      ]);
    
    if (createError) {
      console.error('Error creating hr_employee_skills table:', createError);
      return false;
    }
    
    // Then delete the placeholder record
    const { error: deleteError } = await supabase
      .from('hr_employee_skills')
      .delete()
      .eq('employee_id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.warn('Error cleaning up placeholder record:', deleteError);
    }
    
    console.log('hr_employee_skills table created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error creating hr_employee_skills table:', error);
    return false;
  }
}

/**
 * Create hr_employee_activities table
 */
async function createEmployeeActivitiesTable() {
  try {
    console.log('Checking if hr_employee_activities table exists...');
    const exists = await tableExists('hr_employee_activities');
    
    if (exists) {
      console.log('hr_employee_activities table already exists');
      return true;
    }
    
    console.log('Creating hr_employee_activities table...');
    
    // Create table with minimal fields
    const { error: createError } = await supabase
      .from('hr_employee_activities')
      .insert([
        { 
          employee_id: '00000000-0000-0000-0000-000000000000', 
          activity_type: 'placeholder',
          description: 'Placeholder activity'
        }
      ]);
    
    if (createError) {
      console.error('Error creating hr_employee_activities table:', createError);
      return false;
    }
    
    // Delete the placeholder record
    const { error: deleteError } = await supabase
      .from('hr_employee_activities')
      .delete()
      .eq('employee_id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.warn('Error cleaning up placeholder record:', deleteError);
    }
    
    console.log('hr_employee_activities table created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error creating hr_employee_activities table:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting HR tables creation...');
    
    // Create employee skills table
    const skillsResult = await createEmployeeSkillsTable();
    if (!skillsResult) {
      console.error('Failed to create employee skills table');
    }
    
    // Create employee activities table
    const activitiesResult = await createEmployeeActivitiesTable();
    if (!activitiesResult) {
      console.error('Failed to create employee activities table');
    }
    
    console.log('HR tables creation completed');
    
  } catch (error) {
    console.error('Error creating HR tables:', error);
  } finally {
    process.exit(0);
  }
}

// Run the main function
main(); 