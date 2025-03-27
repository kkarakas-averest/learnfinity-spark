-- Create tables for conversations and messages
-- Run this in the Supabase SQL Editor

-- First, create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  hr_user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_employee_id 
  ON public.conversations(employee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_hr_user_id 
  ON public.conversations(hr_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at 
  ON public.conversations(last_message_at);

-- Add table comment
COMMENT ON TABLE public.conversations IS 'Stores conversation threads between HR and employees';

-- Next, create the messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('hr', 'employee')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id 
  ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id 
  ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at 
  ON public.conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_is_read 
  ON public.conversation_messages(is_read);

-- Add table comment
COMMENT ON TABLE public.conversation_messages IS 'Stores individual messages within conversations';

-- Enable Row Level Security for both tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
-- HR users can see all conversations they're part of
CREATE POLICY conversations_hr_select_policy 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid() = hr_user_id);

-- Employees can see only their own conversations
CREATE POLICY conversations_employee_select_policy 
  ON public.conversations 
  FOR SELECT 
  USING (auth.uid() = employee_id);

-- Allow authenticated users to insert conversations
CREATE POLICY conversations_insert_policy 
  ON public.conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = hr_user_id OR auth.uid() = employee_id);

-- Create policies for messages
-- Users can see messages in conversations they're part of
CREATE POLICY conversation_messages_select_policy 
  ON public.conversation_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.hr_user_id = auth.uid() OR c.employee_id = auth.uid())
    )
  );

-- Users can insert messages in conversations they're part of
CREATE POLICY conversation_messages_insert_policy 
  ON public.conversation_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.hr_user_id = auth.uid() OR c.employee_id = auth.uid())
    )
  );

-- Users can update is_read status on messages in conversations they're part of
CREATE POLICY conversation_messages_update_policy 
  ON public.conversation_messages 
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND (c.hr_user_id = auth.uid() OR c.employee_id = auth.uid())
    )
  );

-- Create a function to update the last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update last_message_at when a new message is added
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_timestamp(); 