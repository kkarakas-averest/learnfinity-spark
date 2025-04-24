import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create Supabase server client for auth
  const supabase = createServerSupabaseClient({ req, res });
  
  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Only allow authorized users
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // In a real prod app, we'd check for admin rights here
  // This is just for development setup

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
    
    // Enable RLS on chat_conversations
    await supabase.query(`ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;`);
    
    // Create policy for users to see only their own conversations
    const { error: policyError1 } = await supabase.query(`
      CREATE POLICY "Users can view their own conversations"
      ON chat_conversations
      FOR SELECT
      USING (auth.uid() = user_id);
    `);
    
    if (policyError1) {
      console.error('Error creating select policy for chat_conversations:', policyError1);
    }
    
    // Create policy for users to insert their own conversations
    const { error: policyError2 } = await supabase.query(`
      CREATE POLICY "Users can insert their own conversations"
      ON chat_conversations
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    `);
    
    if (policyError2) {
      console.error('Error creating insert policy for chat_conversations:', policyError2);
    }

    // Set RLS policies for chat_course_generations
    console.log('Setting up RLS policies for chat_course_generations...');
    
    // Enable RLS on chat_course_generations
    await supabase.query(`ALTER TABLE chat_course_generations ENABLE ROW LEVEL SECURITY;`);
    
    // Create policy for users to see only their own course generations
    const { error: policyError3 } = await supabase.query(`
      CREATE POLICY "Users can view their own course generations"
      ON chat_course_generations
      FOR SELECT
      USING (auth.uid() = user_id);
    `);
    
    if (policyError3) {
      console.error('Error creating select policy for chat_course_generations:', policyError3);
    }
    
    // Create policy for users to insert their own course generations
    const { error: policyError4 } = await supabase.query(`
      CREATE POLICY "Users can insert their own course generations"
      ON chat_course_generations
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    `);
    
    if (policyError4) {
      console.error('Error creating insert policy for chat_course_generations:', policyError4);
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