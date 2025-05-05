#!/usr/bin/env node
// Check the actual schema of the skill taxonomy tables

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to check
const tables = [
  'skill_taxonomy_categories',
  'skill_taxonomy_subcategories',
  'skill_taxonomy_groups',
  'skill_taxonomy_items',
  'hr_employee_skills',
  'position_skill_requirements'
];

async function checkSchema() {
  console.log('🔍 Checking actual schema of tables...');
  
  try {
    // Use exec_sql to run information_schema query
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `
        WITH table_schemas AS (
          SELECT 
            table_name,
            json_agg(
              json_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'is_nullable', is_nullable,
                'column_default', column_default
              )
            ) AS columns
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name IN (
              'skill_taxonomy_categories',
              'skill_taxonomy_subcategories',
              'skill_taxonomy_groups',
              'skill_taxonomy_items',
              'hr_employee_skills',
              'position_skill_requirements'
            )
          GROUP BY table_name
        )
        SELECT * FROM table_schemas;
      `
    });
    
    if (error) {
      console.error('Error checking schema:', error);
      
      // Try a different approach using the REST API directly
      console.log('Trying alternative approach...');
      
      for (const table of tables) {
        // Get the definition by selecting a row with row_definition option
        const { data, error: defError } = await supabase
          .from(table)
          .select('*', { head: true, count: 'exact' });
        
        if (defError) {
          console.error(`Error getting definition for ${table}:`, defError);
        } else {
          // Try to infer the schema from the response object
          console.log(`\n📋 Table: ${table}`);
          
          // Check column definition
          const { data: definitionData, error: metadataError } = await supabase
            .from('_metadata')
            .select('*')
            .eq('table', table);
            
          if (metadataError) {
            console.log(`Could not get metadata: ${metadataError.message}`);
            console.log(`Checking columns from migration script...`);
            
            // Fall back to a direct query
            const { error: infoError } = await supabase.rpc('exec_sql', {
              sql: `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = '${table}'
              `
            });
            
            if (infoError) {
              console.log(`Could not get column info: ${infoError.message}`);
            }
          }
        }
      }
    }
    
    // Just use a direct SQL query with our own function since the information_schema approach might be restricted
    console.log('\n🔍 Using direct SQL execution via exec_sql function...');
    
    for (const table of tables) {
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${table}'
          ORDER BY ordinal_position;
        `
      });
      
      if (tableError) {
        console.error(`Error checking schema for ${table}:`, tableError);
      }
      
      // Try a basic select to see column names from the response
      const { data, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error(`Error selecting from ${table}:`, selectError);
      } else {
        console.log(`\n📋 Table: ${table}`);
        if (data && data.length > 0) {
          console.log('Columns from response:', Object.keys(data[0]).join(', '));
        } else {
          console.log('No data to infer columns');
        }
      }
    }
  } catch (err) {
    console.error('Schema check failed:', err);
  }
}

// Run the schema check
checkSchema()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 