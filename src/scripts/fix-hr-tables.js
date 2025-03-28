/**
 * Script to fix HR tables
 * 
 * This script creates missing HR tables required for the employee profile functionality.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Try different environment variable patterns to find working credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your environment variables.');
  console.error('Expected one of: VITE_SUPABASE_URL, SUPABASE_URL, or NEXT_PUBLIC_SUPABASE_URL');
  console.error('Expected one of: VITE_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key available: ${!!supabaseKey}`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Creates the HR employee skills table
 */
async function createEmployeeSkillsTable() {
  try {
    console.log('Creating hr_employee_skills table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employee_skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
          skill_name VARCHAR(100) NOT NULL,
          proficiency_level VARCHAR(20) NOT NULL,
          is_in_progress BOOLEAN DEFAULT false,
          verification_status VARCHAR(20) DEFAULT 'unverified',
          verified_by UUID,
          verification_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(employee_id, skill_name)
        );
      `
    });
    
    if (error) {
      console.error('Error creating hr_employee_skills table:', error);
      return false;
    }
    
    console.log('hr_employee_skills table created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error creating hr_employee_skills table:', error);
    return false;
  }
}

/**
 * Creates the HR employee activities table
 */
async function createEmployeeActivitiesTable() {
  try {
    console.log('Creating hr_employee_activities table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employee_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          course_id UUID,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (error) {
      console.error('Error creating hr_employee_activities table:', error);
      return false;
    }
    
    console.log('hr_employee_activities table created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error creating hr_employee_activities table:', error);
    return false;
  }
}

/**
 * Adds a required column to the hr_employees table
 */
async function addUserIdToEmployeesTable() {
  try {
    console.log('Checking for user_id column in hr_employees...');
    
    // First check if the column exists
    const { data, error: checkError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees' AND column_name = 'user_id';
      `
    });
    
    if (checkError) {
      console.error('Error checking for user_id column:', checkError);
      return false;
    }
    
    // If column doesn't exist, add it
    if (!data || data.length === 0) {
      console.log('Adding user_id column to hr_employees table...');
      
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE hr_employees ADD COLUMN user_id UUID;
        `
      });
      
      if (error) {
        console.error('Error adding user_id column:', error);
        return false;
      }
      
      console.log('user_id column added to hr_employees table');
    } else {
      console.log('user_id column already exists in hr_employees table');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error adding user_id column:', error);
    return false;
  }
}

/**
 * Main function
 */
async function fixHrTables() {
  try {
    console.log('Starting HR tables fix...');
    
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
    
    // Add user_id column to employees table
    const userIdResult = await addUserIdToEmployeesTable();
    if (!userIdResult) {
      console.error('Failed to add user_id column to employees table');
    }
    
    console.log('HR tables fix completed');
    
  } catch (error) {
    console.error('Error fixing HR tables:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixHrTables(); 