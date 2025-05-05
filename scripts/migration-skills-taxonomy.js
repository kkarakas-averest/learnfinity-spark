#!/usr/bin/env node
// migration-skills-taxonomy.js - Script to create all tables needed for the skills taxonomy system

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client with credentials from .env
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if the exec_sql function exists or create it
async function ensureExecSqlFunction() {
  console.log('🔍 Checking if exec_sql function exists...');
  
  try {
    // Try to use the function
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('⚙️ Creating exec_sql function...');
      
      // Create the function using REST API directly
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: createFunctionSql
        })
      });
      
      if (!response.ok) {
        console.error('❌ Failed to create exec_sql function. You may need to create it manually in the Supabase SQL editor with:');
        console.error(createFunctionSql);
        process.exit(1);
      }
      
      console.log('✅ exec_sql function created successfully!');
    } else if (!error) {
      console.log('✅ exec_sql function already exists.');
    } else {
      console.log('⚠️ Error checking exec_sql function:', error.message);
      console.log('Attempting to continue...');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Will attempt to create tables directly, but may fail if exec_sql function is not available.');
  }
}

// Table definitions with their corresponding SQL
const tables = [
  {
    name: 'skill_taxonomy_categories',
    sql: `
      CREATE TABLE IF NOT EXISTS skill_taxonomy_categories (
        id UUID PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'skill_taxonomy_subcategories',
    sql: `
      CREATE TABLE IF NOT EXISTS skill_taxonomy_subcategories (
        id UUID PRIMARY KEY,
        category_id UUID NOT NULL REFERENCES skill_taxonomy_categories(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'skill_taxonomy_groups',
    sql: `
      CREATE TABLE IF NOT EXISTS skill_taxonomy_groups (
        id UUID PRIMARY KEY,
        subcategory_id UUID NOT NULL REFERENCES skill_taxonomy_subcategories(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'skill_taxonomy_items',
    sql: `
      CREATE TABLE IF NOT EXISTS skill_taxonomy_items (
        id UUID PRIMARY KEY,
        group_id UUID NOT NULL REFERENCES skill_taxonomy_groups(id) ON DELETE CASCADE,
        external_id VARCHAR,
        name VARCHAR NOT NULL,
        description TEXT,
        keywords JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'hr_employee_skills',
    sql: `
      CREATE TABLE IF NOT EXISTS hr_employee_skills (
        id UUID PRIMARY KEY,
        employee_id UUID NOT NULL,
        taxonomy_skill_id UUID REFERENCES skill_taxonomy_items(id),
        raw_skill VARCHAR NOT NULL,
        proficiency INTEGER NOT NULL DEFAULT 1,
        verified BOOLEAN NOT NULL DEFAULT false,
        source VARCHAR NOT NULL DEFAULT 'cv',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  },
  {
    name: 'position_skill_requirements',
    sql: `
      CREATE TABLE IF NOT EXISTS position_skill_requirements (
        id UUID PRIMARY KEY,
        position_id UUID NOT NULL,
        taxonomy_skill_id UUID NOT NULL REFERENCES skill_taxonomy_items(id) ON DELETE CASCADE,
        importance_level INTEGER NOT NULL DEFAULT 3,
        required_proficiency INTEGER NOT NULL DEFAULT 3,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (position_id, taxonomy_skill_id)
      );
    `
  },
  {
    name: 'skill_normalization_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS skill_normalization_logs (
        id UUID PRIMARY KEY,
        raw_skill VARCHAR NOT NULL,
        taxonomy_skill_id UUID REFERENCES skill_taxonomy_items(id),
        confidence FLOAT,
        source VARCHAR NOT NULL DEFAULT 'api',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }
];

// Indexes for performance
const indexes = [
  {
    name: 'idx_skill_taxonomy_items_name',
    sql: `CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_items_name ON skill_taxonomy_items (name);`
  },
  {
    name: 'idx_skill_taxonomy_items_external_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_items_external_id ON skill_taxonomy_items (external_id);`
  },
  {
    name: 'idx_employee_skills_employee_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON hr_employee_skills (employee_id);`
  },
  {
    name: 'idx_employee_skills_taxonomy_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_employee_skills_taxonomy_id ON hr_employee_skills (taxonomy_skill_id);`
  },
  {
    name: 'idx_position_skill_requirements_position_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_position_skill_requirements_position_id ON position_skill_requirements (position_id);`
  }
];

// Full-text search
const ftsIndexes = [
  {
    name: 'tsvector_skill_taxonomy_items',
    sql: `
      ALTER TABLE skill_taxonomy_items 
      ADD COLUMN IF NOT EXISTS search_vector tsvector 
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED;
      
      CREATE INDEX IF NOT EXISTS idx_skill_taxonomy_items_search ON skill_taxonomy_items USING GIN (search_vector);
    `
  }
];

// Functions to sync taxonomy data between tables
const functions = [
  {
    name: 'update_skill_timestamps_function',
    sql: `
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
  }
];

// Triggers to keep timestamps updated
const triggers = [
  {
    name: 'skill_taxonomy_categories_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON skill_taxonomy_categories;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON skill_taxonomy_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  },
  {
    name: 'skill_taxonomy_subcategories_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON skill_taxonomy_subcategories;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON skill_taxonomy_subcategories
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  },
  {
    name: 'skill_taxonomy_groups_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON skill_taxonomy_groups;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON skill_taxonomy_groups
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  },
  {
    name: 'skill_taxonomy_items_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON skill_taxonomy_items;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON skill_taxonomy_items
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  },
  {
    name: 'hr_employee_skills_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON hr_employee_skills;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON hr_employee_skills
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  },
  {
    name: 'position_skill_requirements_timestamp_trigger',
    sql: `
      DROP TRIGGER IF EXISTS update_timestamp ON position_skill_requirements;
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON position_skill_requirements
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `
  }
];

// Function to execute SQL safely
async function executeSql(name, sql) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${name}:`, error);
      return false;
    } else {
      console.log(`✓ ${name} executed successfully`);
      return true;
    }
  } catch (err) {
    console.error(`Error executing ${name}:`, err.message);
    return false;
  }
}

async function runMigration() {
  console.log('Starting Skills Taxonomy migration...');
  
  // Ensure the exec_sql function exists
  await ensureExecSqlFunction();
  
  // Create tables
  for (const table of tables) {
    console.log(`Creating table: ${table.name}`);
    await executeSql(`table ${table.name}`, table.sql);
  }
  
  // Create functions
  for (const func of functions) {
    console.log(`Creating function: ${func.name}`);
    await executeSql(`function ${func.name}`, func.sql);
  }
  
  // Create triggers
  for (const trigger of triggers) {
    console.log(`Creating trigger: ${trigger.name}`);
    await executeSql(`trigger ${trigger.name}`, trigger.sql);
  }
  
  // Create indexes
  for (const index of indexes) {
    console.log(`Creating index: ${index.name}`);
    await executeSql(`index ${index.name}`, index.sql);
  }
  
  // Create full-text search indexes
  for (const ftsIndex of ftsIndexes) {
    console.log(`Creating FTS index: ${ftsIndex.name}`);
    await executeSql(`FTS index ${ftsIndex.name}`, ftsIndex.sql);
  }
  
  console.log('\nSkills Taxonomy migration completed!');
}

// Run the migration
runMigration()
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 