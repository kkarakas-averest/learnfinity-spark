import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Check your .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Create the agent_test_logs table
 */
async function createAgentTestTables() {
  console.log('Creating agent_test_logs table...');
  
  try {
    // Create agent_test_logs table
    const { error: tableError } = await supabase.rpc('create_agent_test_tables', {});
    
    if (tableError) {
      console.log('Attempting to create table manually since RPC might not exist...');
      
      // Check if table exists
      const { error: existsError, data: existsData } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'agent_test_logs')
        .single();
        
      if (existsError) {
        // Create the table directly
        const { error: createError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS agent_test_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            request_type VARCHAR(100) NOT NULL,
            request_data JSONB NOT NULL,
            response_data JSONB,
            duration_ms INTEGER,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES auth.users(id)
          );
          
          -- Add RLS policies
          ALTER TABLE agent_test_logs ENABLE ROW LEVEL SECURITY;
          
          -- Policy to allow admins to read all logs
          CREATE POLICY "Admins can read all agent test logs"
            ON agent_test_logs
            FOR SELECT
            USING (
              auth.uid() IN (
                SELECT id FROM auth.users WHERE email LIKE '%@learnfinity.com'
              )
            );
          
          -- Policy to allow users to read their own logs
          CREATE POLICY "Users can read their own agent test logs"
            ON agent_test_logs
            FOR SELECT
            USING (auth.uid() = created_by);
        `);
        
        if (createError) {
          throw createError;
        }
      } else if (existsData) {
        console.log('✅ agent_test_logs table already exists');
      }
    }
    
    console.log('✅ Agent test tables created successfully');
  } catch (error) {
    console.error('❌ Error creating agent test tables:', error);
    throw error;
  }
}

/**
 * Create the RPC function for creating agent test tables
 */
async function createRpcFunction() {
  console.log('Creating RPC function for agent test tables...');
  
  try {
    const { error } = await supabase.query(`
      CREATE OR REPLACE FUNCTION create_agent_test_tables()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Create agent_test_logs table if it doesn't exist
        CREATE TABLE IF NOT EXISTS agent_test_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          request_type VARCHAR(100) NOT NULL,
          request_data JSONB NOT NULL,
          response_data JSONB,
          duration_ms INTEGER,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by UUID REFERENCES auth.users(id)
        );
        
        -- Add RLS policies if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'agent_test_logs' AND policyname = 'Admins can read all agent test logs'
        ) THEN
          ALTER TABLE agent_test_logs ENABLE ROW LEVEL SECURITY;
          
          -- Policy to allow admins to read all logs
          CREATE POLICY "Admins can read all agent test logs"
            ON agent_test_logs
            FOR SELECT
            USING (
              auth.uid() IN (
                SELECT id FROM auth.users WHERE email LIKE '%@learnfinity.com'
              )
            );
          
          -- Policy to allow users to read their own logs
          CREATE POLICY "Users can read their own agent test logs"
            ON agent_test_logs
            FOR SELECT
            USING (auth.uid() = created_by);
        END IF;
      END;
      $$;
    `);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ RPC function created successfully');
  } catch (error) {
    console.error('❌ Error creating RPC function:', error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting to set up agent test tables...');
    
    // Create the RPC function first
    await createRpcFunction();
    
    // Create the tables
    await createAgentTestTables();
    
    console.log('🎉 All agent test tables and functions created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set up agent test tables:', error);
    process.exit(1);
  }
}

// Execute the main function
main(); 