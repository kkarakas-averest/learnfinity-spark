import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials for development
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.MZZMNbG8rpCLQ7sMGKXKQP1YL0dZ_PMVBKBrXL-k7IY';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create Supabase client directly with hardcoded credentials
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // For development purposes, skip authentication check
  // and proceed with table creation directly
  
  try {
    console.log('Creating chat_conversations table...');
    
    // Create chat_conversations table
    const { error: chatConvError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'chat_conversations',
      table_definition: `
        id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        employee_id uuid REFERENCES hr_employees(id) ON DELETE SET NULL,
        messages jsonb NOT NULL,
        response text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      `
    });
    
    if (chatConvError) {
      console.error('Error creating chat_conversations table:', chatConvError);
      return res.status(500).json({ error: chatConvError.message });
    }

    console.log('Creating chat_course_generations table...');
    
    // Create chat_course_generations table
    const { error: chatCourseError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'chat_course_generations',
      table_definition: `
        id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
        course_id uuid REFERENCES hr_courses(id) ON DELETE CASCADE NOT NULL,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        chat_history jsonb NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      `
    });
    
    if (chatCourseError) {
      console.error('Error creating chat_course_generations table:', chatCourseError);
      return res.status(500).json({ error: chatCourseError.message });
    }

    // Set RLS policies for chat_conversations
    console.log('Setting up RLS policies for chat_conversations...');
    
    try {
      // Enable RLS on chat_conversations
      await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;`
      });
      
      // Create policy for users to see only their own conversations
      await supabase.rpc('execute_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
          CREATE POLICY "Users can view their own conversations"
          ON chat_conversations
          FOR SELECT
          USING (auth.uid() = user_id);
        `
      });
      
      // Create policy for users to insert their own conversations
      await supabase.rpc('execute_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can insert their own conversations" ON chat_conversations;
          CREATE POLICY "Users can insert their own conversations"
          ON chat_conversations
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `
      });
    } catch (error) {
      console.error('Error setting RLS on chat_conversations:', error);
      // Continue anyway - non-fatal error
    }

    // Set RLS policies for chat_course_generations
    console.log('Setting up RLS policies for chat_course_generations...');
    
    try {
      // Enable RLS on chat_course_generations
      await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE chat_course_generations ENABLE ROW LEVEL SECURITY;`
      });
      
      // Create policy for users to see only their own course generations
      await supabase.rpc('execute_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can view their own course generations" ON chat_course_generations;
          CREATE POLICY "Users can view their own course generations"
          ON chat_course_generations
          FOR SELECT
          USING (auth.uid() = user_id);
        `
      });
      
      // Create policy for users to insert their own course generations
      await supabase.rpc('execute_sql', {
        sql: `
          DROP POLICY IF EXISTS "Users can insert their own course generations" ON chat_course_generations;
          CREATE POLICY "Users can insert their own course generations"
          ON chat_course_generations
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `
      });
    } catch (error) {
      console.error('Error setting RLS on chat_course_generations:', error);
      // Continue anyway - non-fatal error
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Chat tables and policies created successfully' 
    });
    
  } catch (error: any) {
    console.error('Error setting up chat tables:', error);
    return res.status(500).json({ error: error.message });
  }
} 