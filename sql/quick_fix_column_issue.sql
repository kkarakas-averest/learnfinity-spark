-- Quick fix for the "column created_at does not exist" error
-- Run this in the Supabase SQL Editor immediately

-- Add created_at to hr_employee_activities if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hr_employee_activities' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.hr_employee_activities 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- If createdAt exists, copy its values to created_at
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'hr_employee_activities' 
      AND column_name = 'createdAt'
    ) THEN
      UPDATE public.hr_employee_activities 
      SET created_at = "createdAt";
    END IF;
    
    RAISE NOTICE 'Added created_at column to hr_employee_activities';
  ELSE
    RAISE NOTICE 'created_at column already exists in hr_employee_activities';
  END IF;
END $$; 