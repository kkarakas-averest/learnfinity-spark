/**
 * Script to create course content tables in the database
 * 
 * This script creates the following tables:
 * 1. course_modules - Course modules table
 * 2. module_sections - Module sections (individual learning units)
 * 3. course_resources - Additional resources for courses/modules
 * 4. content_completions - Track completed modules and sections
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Creating course content tables...');

    // 1. Create course_modules table
    console.log('Creating course_modules table...');
    const { error: modulesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'course_modules',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        duration INTEGER, -- in minutes
        content_type TEXT DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });

    if (modulesError) throw modulesError;

    // 2. Create module_sections table
    console.log('Creating module_sections table...');
    const { error: sectionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'module_sections',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        content_type TEXT DEFAULT 'text',
        order_index INTEGER NOT NULL DEFAULT 0,
        duration INTEGER, -- in minutes
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });

    if (sectionsError) throw sectionsError;

    // 3. Create course_resources table
    console.log('Creating course_resources table...');
    const { error: resourcesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'course_resources',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        type TEXT DEFAULT 'file',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });

    if (resourcesError) throw resourcesError;

    // 4. Create content_completions table
    console.log('Creating content_completions table...');
    const { error: completionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'content_completions',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        content_id UUID NOT NULL,
        content_type TEXT NOT NULL, -- 'module' or 'section'
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, content_id, content_type)
      `
    });

    if (completionsError) throw completionsError;

    console.log('All course content tables created successfully!');
    
    // Setup RLS policies for the tables
    await setupRLSPolicies();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

async function setupRLSPolicies() {
  try {
    console.log('Setting up Row Level Security policies...');
    
    // Enable RLS on the tables
    const tables = [
      'course_modules',
      'module_sections',
      'course_resources',
      'content_completions'
    ];
    
    for (const table of tables) {
      console.log(`Enabling RLS on ${table}...`);
      const { error } = await supabase.rpc('enable_row_level_security', {
        target_table: table
      });
      
      if (error) throw error;
    }
    
    // Setup select policies for authenticated users
    for (const table of tables) {
      console.log(`Creating select policy for ${table}...`);
      const { error } = await supabase.rpc('create_rls_policy', {
        target_table: table,
        policy_name: `${table}_select_policy`,
        operation: 'SELECT',
        policy_definition: 'true',
        policy_roles: 'authenticated'
      });
      
      if (error) throw error;
    }
    
    // Setup insert/update policies for content_completions
    console.log('Creating insert policy for content_completions...');
    const { error: insertError } = await supabase.rpc('create_rls_policy', {
      target_table: 'content_completions',
      policy_name: 'content_completions_insert_policy',
      operation: 'INSERT',
      policy_definition: 'auth.uid() = user_id',
      policy_roles: 'authenticated'
    });
    
    if (insertError) throw insertError;
    
    console.log('Creating update policy for content_completions...');
    const { error: updateError } = await supabase.rpc('create_rls_policy', {
      target_table: 'content_completions',
      policy_name: 'content_completions_update_policy',
      operation: 'UPDATE',
      policy_definition: 'auth.uid() = user_id',
      policy_roles: 'authenticated'
    });
    
    if (updateError) throw updateError;
    
    console.log('RLS policies setup completed!');
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
    throw error;
  }
}

// Run the creation script
createTables()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 