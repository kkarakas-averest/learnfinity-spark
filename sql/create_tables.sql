-- Create both the hr_employee_activities and user_notifications tables
-- This script can be run in Supabase SQL Editor

-- First, create the hr_employee_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hr_employee_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for hr_employee_activities
CREATE INDEX IF NOT EXISTS idx_hr_employee_activities_employee_id 
  ON public.hr_employee_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_employee_activities_activity_type 
  ON public.hr_employee_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_hr_employee_activities_created_at 
  ON public.hr_employee_activities(created_at);

-- Add table comment
COMMENT ON TABLE public.hr_employee_activities IS 'Stores employee activity records for HR tracking';

-- Next, create the user_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id 
  ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read 
  ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at 
  ON public.user_notifications(created_at);

-- Add table comment
COMMENT ON TABLE public.user_notifications IS 'Stores user notifications for the application';

-- Enable Row Level Security for both tables
ALTER TABLE public.hr_employee_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for hr_employee_activities
-- Allow service role to access all records
CREATE POLICY hr_employee_activities_service_policy 
  ON public.hr_employee_activities 
  USING (auth.role() = 'service_role');

-- Create policies for user_notifications
-- Allow users to see only their own notifications
CREATE POLICY user_notifications_select_policy 
  ON public.user_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update only their own notifications
CREATE POLICY user_notifications_update_policy 
  ON public.user_notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow service role and authenticated users to insert notifications
CREATE POLICY user_notifications_insert_policy 
  ON public.user_notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Create a function to check and fix column names
CREATE OR REPLACE FUNCTION check_and_fix_column_names()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for hr_employee_activities table column issues
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'hr_employee_activities'
  ) THEN
    -- Check if created_at is missing but createdAt exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'hr_employee_activities' 
      AND column_name = 'created_at'
    ) AND EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'hr_employee_activities' 
      AND column_name = 'createdAt'
    ) THEN
      -- Add created_at as an alias to createdAt
      ALTER TABLE public.hr_employee_activities 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS ("createdAt") STORED;
      RAISE NOTICE 'Added created_at as a generated column based on createdAt in hr_employee_activities';
    END IF;
  END IF;
  
  -- Check for user_notifications table column issues
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_notifications'
  ) THEN
    -- Check if created_at is missing but createdAt exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_notifications' 
      AND column_name = 'created_at'
    ) AND EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_notifications' 
      AND column_name = 'createdAt'
    ) THEN
      -- Add created_at as an alias to createdAt
      ALTER TABLE public.user_notifications 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS ("createdAt") STORED;
      RAISE NOTICE 'Added created_at as a generated column based on createdAt in user_notifications';
    END IF;
  END IF;
END;
$$;

-- Update the create_required_tables function to also call the column name check
CREATE OR REPLACE FUNCTION create_required_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will run the above commands if the tables don't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_notifications'
  ) THEN
    -- Create user_notifications table - handled by SQL above
    RAISE NOTICE 'Created user_notifications table';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'hr_employee_activities'
  ) THEN
    -- Create hr_employee_activities table - handled by SQL above
    RAISE NOTICE 'Created hr_employee_activities table';
  END IF;

  -- Check if tables exist but are missing columns
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'hr_employee_activities'
  ) THEN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'hr_employee_activities' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.hr_employee_activities 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added created_at column to hr_employee_activities';
    END IF;
    
    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'hr_employee_activities' 
      AND column_name = 'createdAt'
    ) THEN
      ALTER TABLE public.hr_employee_activities 
      ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added createdAt column to hr_employee_activities';
    END IF;
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_notifications'
  ) THEN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_notifications' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.user_notifications 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added created_at column to user_notifications';
    END IF;
    
    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_notifications' 
      AND column_name = 'createdAt'
    ) THEN
      ALTER TABLE public.user_notifications 
      ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added createdAt column to user_notifications';
    END IF;
  END IF;
  
  -- Call the function to check and fix any column name discrepancies
  PERFORM check_and_fix_column_names();
END;
$$;

-- Execute the function to ensure tables exist and columns are fixed
SELECT create_required_tables(); 