-- SQL Script to update the database schema for dashboard enhancements
-- Execute this in the Supabase SQL Editor or with the Supabase CLI

-- Add estimated_completion_date column to hr_learning_path_enrollments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_learning_path_enrollments' 
          AND column_name = 'estimated_completion_date'
    ) THEN
        ALTER TABLE hr_learning_path_enrollments 
        ADD COLUMN estimated_completion_date TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added estimated_completion_date column to hr_learning_path_enrollments table';
    ELSE
        RAISE NOTICE 'estimated_completion_date column already exists in hr_learning_path_enrollments table';
    END IF;
END $$;

-- Update existing learning path enrollments with estimated dates (30 days from enrollment date)
UPDATE hr_learning_path_enrollments
SET estimated_completion_date = enrollment_date + INTERVAL '30 days'
WHERE estimated_completion_date IS NULL 
  AND enrollment_date IS NOT NULL;

-- For enrollments without enrollment_date, use current_date + 30 days
UPDATE hr_learning_path_enrollments
SET estimated_completion_date = CURRENT_DATE + INTERVAL '30 days'
WHERE estimated_completion_date IS NULL;

-- Create indexes to improve query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'hr_learning_path_enrollments' 
          AND indexname = 'idx_learning_path_enrollments_employee_id'
    ) THEN
        CREATE INDEX idx_learning_path_enrollments_employee_id 
        ON hr_learning_path_enrollments(employee_id);
        
        RAISE NOTICE 'Created index on hr_learning_path_enrollments(employee_id)';
    ELSE
        RAISE NOTICE 'Index on employee_id already exists for hr_learning_path_enrollments';
    END IF;
END $$;

SELECT 'Schema update completed successfully!' AS result; 