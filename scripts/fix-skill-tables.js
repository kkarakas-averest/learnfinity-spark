#!/usr/bin/env node
// Fix missing columns in skill taxonomy tables

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fixes to apply
const fixes = [
  {
    name: "Add proficiency column to hr_employee_skills",
    sql: `
      ALTER TABLE hr_employee_skills 
      ADD COLUMN IF NOT EXISTS proficiency INTEGER NOT NULL DEFAULT 1;
    `
  },
  {
    name: "Add required_proficiency column to position_skill_requirements",
    sql: `
      ALTER TABLE position_skill_requirements 
      ADD COLUMN IF NOT EXISTS required_proficiency INTEGER NOT NULL DEFAULT 3;
    `
  },
  {
    name: "Create positions table if it doesn't exist",
    sql: `
      CREATE TABLE IF NOT EXISTS hr_positions (
        id UUID PRIMARY KEY,
        title VARCHAR NOT NULL,
        department VARCHAR,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: "Add foreign key constraint to position_skill_requirements",
    sql: `
      -- First drop existing constraint if it exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'position_skill_requirements_position_id_fkey'
          AND table_name = 'position_skill_requirements'
        ) THEN
          ALTER TABLE position_skill_requirements 
          DROP CONSTRAINT position_skill_requirements_position_id_fkey;
        END IF;
      END
      $$;
      
      -- Add new constraint with proper references
      ALTER TABLE position_skill_requirements
      ADD CONSTRAINT position_skill_requirements_position_id_fkey
      FOREIGN KEY (position_id) REFERENCES hr_positions(id);
    `
  },
  {
    name: "Refresh schema cache",
    sql: `
      COMMENT ON TABLE position_skill_requirements IS 'Position skill requirements table';
      COMMENT ON TABLE hr_employee_skills IS 'Employee skills table';
    `
  }
];

// Function to execute SQL safely
async function executeSql(name, sql) {
  try {
    console.log(`Executing: ${name}`);
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${name}:`, error);
      return false;
    } else {
      console.log(`✅ ${name} executed successfully`);
      return true;
    }
  } catch (err) {
    console.error(`Error executing ${name}:`, err.message);
    return false;
  }
}

// Run all the fixes
async function applyFixes() {
  console.log('Starting table fixes...');
  
  for (const fix of fixes) {
    await executeSql(fix.name, fix.sql);
  }
  
  console.log('\nFixes completed!');
}

// Run the script
applyFixes().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 