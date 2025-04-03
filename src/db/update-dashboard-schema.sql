-- Update Dashboard Schema
-- This script adds missing fields required for the dashboard to show proper data

-- Update the hr_courses table with missing fields
ALTER TABLE IF EXISTS hr_courses
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS module_count INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- in minutes

-- Update the hr_course_enrollments table with missing fields
ALTER TABLE IF EXISTS hr_course_enrollments
  ADD COLUMN IF NOT EXISTS rag_status VARCHAR(20) DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS completed_modules INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_modules INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS course_type VARCHAR(50) DEFAULT 'hr_assigned';

-- Update the hr_learning_paths table with missing fields
ALTER TABLE IF EXISTS hr_learning_paths
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS course_count INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duration INTEGER; -- in minutes

-- Create the learner_dashboard_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS learner_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{
    "preferred_learning_style": "visual",
    "preferred_content_types": ["video", "interactive"],
    "learning_goals": ["Improve technical skills", "Develop leadership abilities"]
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id)
);

-- Create the learner_statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS learner_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  courses_in_progress INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in hours
  average_score NUMERIC(5,2) DEFAULT 0, -- 0-100 scale
  certificates_earned INTEGER DEFAULT 0,
  learning_paths_completed INTEGER DEFAULT 0,
  assigned_courses INTEGER DEFAULT 0,
  skills_acquired INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id)
);

-- Create the learner_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS learner_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- 'skill_acquired', 'course_completed', 'certificate_earned', etc.
  skill VARCHAR(100),
  course_id UUID,
  achievement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update employee_user_mapping table with user_id to hr_employees connection if needed
CREATE TABLE IF NOT EXISTS employee_user_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id),
  UNIQUE(user_id)
);

-- Add any indexes needed for performance
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_progress ON hr_course_enrollments(progress);
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_rag_status ON hr_course_enrollments(rag_status);
CREATE INDEX IF NOT EXISTS idx_learner_statistics_employee_id ON learner_statistics(employee_id);
CREATE INDEX IF NOT EXISTS idx_learner_achievements_employee_id ON learner_achievements(employee_id);
CREATE INDEX IF NOT EXISTS idx_learner_achievements_achievement_type ON learner_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_employee_user_mapping_user_id ON employee_user_mapping(user_id);

-- Create or replace a function to update the progress in learning paths 
-- when course progress is updated
CREATE OR REPLACE FUNCTION update_learning_path_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the learning paths that this course belongs to
  WITH path_enrollments AS (
    SELECT
      lpe.id AS enrollment_id,
      lpe.employee_id,
      lpe.learning_path_id,
      COUNT(lpc.course_id) AS total_courses
    FROM
      hr_learning_path_enrollments lpe
      JOIN hr_learning_path_courses lpc ON lpe.learning_path_id = lpc.learning_path_id
    WHERE
      lpe.employee_id = NEW.employee_id
    GROUP BY
      lpe.id, lpe.employee_id, lpe.learning_path_id
  ),
  course_progress AS (
    SELECT
      pe.enrollment_id,
      pe.employee_id,
      pe.learning_path_id,
      COUNT(ce.course_id) FILTER (WHERE ce.progress = 100) AS completed_courses,
      SUM(ce.progress) / COUNT(ce.course_id) AS avg_progress
    FROM
      path_enrollments pe
      JOIN hr_learning_path_courses lpc ON pe.learning_path_id = lpc.learning_path_id
      LEFT JOIN hr_course_enrollments ce ON lpc.course_id = ce.course_id
        AND ce.employee_id = pe.employee_id
    GROUP BY
      pe.enrollment_id, pe.employee_id, pe.learning_path_id
  )
  -- Update the progress for each learning path enrollment
  UPDATE hr_learning_path_enrollments lpe
  SET
    progress = cp.avg_progress,
    completed_courses = cp.completed_courses,
    status = CASE
      WHEN cp.avg_progress = 100 THEN 'completed'
      WHEN cp.avg_progress > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    completion_date = CASE
      WHEN cp.avg_progress = 100 AND lpe.completion_date IS NULL THEN CURRENT_TIMESTAMP
      ELSE lpe.completion_date
    END
  FROM
    course_progress cp
  WHERE
    lpe.id = cp.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating learning path progress when course progress changes
DROP TRIGGER IF EXISTS update_learning_path_progress_trigger ON hr_course_enrollments;
CREATE TRIGGER update_learning_path_progress_trigger
AFTER UPDATE OF progress ON hr_course_enrollments
FOR EACH ROW
WHEN (OLD.progress IS DISTINCT FROM NEW.progress)
EXECUTE FUNCTION update_learning_path_progress(); 