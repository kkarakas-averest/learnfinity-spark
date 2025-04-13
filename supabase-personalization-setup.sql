-- SQL commands to set up content personalization for Learnfinity
-- Execute this in the Supabase SQL Editor

-- Create system_logs table for detailed logging
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  category TEXT,
  action TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_category_action
ON system_logs(category, action);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp
ON system_logs(timestamp);

-- Add columns to hr_course_enrollments table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_generation_status') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_generation_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_started_at') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_started_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_completed_at') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_id') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_id UUID REFERENCES ai_course_content(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create a function to automatically set personalization status to 'pending' when a new course enrollment is created
CREATE OR REPLACE FUNCTION set_personalization_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set status to pending for new enrollments that don't already have a status
  IF NEW.personalized_content_generation_status IS NULL THEN
    NEW.personalized_content_generation_status = 'pending';
    NEW.personalized_content_started_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert on hr_course_enrollments
DROP TRIGGER IF EXISTS trigger_set_personalization_pending ON hr_course_enrollments;

CREATE TRIGGER trigger_set_personalization_pending
BEFORE INSERT ON hr_course_enrollments
FOR EACH ROW
EXECUTE FUNCTION set_personalization_pending();

-- Also create a trigger for updates to catch enrollments that are updated
DROP TRIGGER IF EXISTS trigger_set_personalization_pending_on_update ON hr_course_enrollments;

CREATE TRIGGER trigger_set_personalization_pending_on_update
BEFORE UPDATE ON hr_course_enrollments
FOR EACH ROW
WHEN (
  -- Only trigger when status is null and course_id is being modified
  OLD.personalized_content_generation_status IS NULL AND
  (OLD.course_id != NEW.course_id OR OLD.course_id IS NULL)
)
EXECUTE FUNCTION set_personalization_pending();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_personalization_status
ON hr_course_enrollments(personalized_content_generation_status);

CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_personalized_content_id
ON hr_course_enrollments(personalized_content_id); 