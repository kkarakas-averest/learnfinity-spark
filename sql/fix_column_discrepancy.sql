-- Direct fix script for the column name discrepancy issue
-- Execute this script in your Supabase SQL Editor

-- First check if createdAt exists but created_at doesn't in hr_employee_activities
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hr_employee_activities' 
    AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hr_employee_activities' 
    AND column_name = 'created_at'
  ) THEN
    -- Add created_at as a copy of createdAt (using STORED GENERATED COLUMN)
    BEGIN
      EXECUTE 'ALTER TABLE public.hr_employee_activities ADD COLUMN created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS ("createdAt") STORED';
      RAISE NOTICE 'Added created_at as a generated column in hr_employee_activities';
    EXCEPTION WHEN OTHERS THEN
      -- If the generated column approach doesn't work, try a simpler approach
      EXECUTE 'ALTER TABLE public.hr_employee_activities ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
      EXECUTE 'UPDATE public.hr_employee_activities SET created_at = "createdAt"';
      RAISE NOTICE 'Added created_at as a regular column and copied values from createdAt';
    END;
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hr_employee_activities' 
    AND column_name = 'created_at'
  ) THEN
    -- Neither column exists, add both
    EXECUTE 'ALTER TABLE public.hr_employee_activities ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
    EXECUTE 'ALTER TABLE public.hr_employee_activities ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
    RAISE NOTICE 'Added both created_at and createdAt columns to hr_employee_activities';
  END IF;
END $$;

-- Same check for user_notifications table
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notifications' 
    AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notifications' 
    AND column_name = 'created_at'
  ) THEN
    -- Add created_at as a copy of createdAt (using STORED GENERATED COLUMN)
    BEGIN
      EXECUTE 'ALTER TABLE public.user_notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS ("createdAt") STORED';
      RAISE NOTICE 'Added created_at as a generated column in user_notifications';
    EXCEPTION WHEN OTHERS THEN
      -- If the generated column approach doesn't work, try a simpler approach
      EXECUTE 'ALTER TABLE public.user_notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
      EXECUTE 'UPDATE public.user_notifications SET created_at = "createdAt"';
      RAISE NOTICE 'Added created_at as a regular column and copied values from createdAt';
    END;
  ELSIF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notifications' 
    AND column_name = 'created_at'
  ) THEN
    -- Neither column exists, add both
    EXECUTE 'ALTER TABLE public.user_notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
    EXECUTE 'ALTER TABLE public.user_notifications ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
    RAISE NOTICE 'Added both created_at and createdAt columns to user_notifications';
  END IF;
END $$;

-- Output the current state of the columns
SELECT 
  table_name, 
  column_name 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('hr_employee_activities', 'user_notifications')
  AND column_name IN ('created_at', 'createdAt')
ORDER BY 
  table_name, 
  column_name; 