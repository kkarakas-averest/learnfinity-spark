-- Fix for learning_path_enrollments table
ALTER TABLE hr_learning_path_enrollments 
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;

-- Add comment to explain this column's purpose
COMMENT ON COLUMN hr_learning_path_enrollments.estimated_completion_date 
IS 'The estimated date when the learning path should be completed';

-- Update the hybrid-data.ts file to handle the case when this column doesn't exist
-- The code already has error handling for this in getHybridLearningPaths function

-- If you want to set values for the new column for existing records
UPDATE hr_learning_path_enrollments
SET estimated_completion_date = enrollment_date + INTERVAL '30 days'
WHERE estimated_completion_date IS NULL;

-- Check if learning path courses are linked correctly
SELECT 
  lp.id AS learning_path_id,
  lp.title AS learning_path_title,
  COUNT(lpc.id) AS course_count
FROM 
  hr_learning_paths lp
LEFT JOIN 
  hr_learning_path_courses lpc ON lp.id = lpc.learning_path_id
GROUP BY 
  lp.id, lp.title;

-- Add missing tables if needed
CREATE TABLE IF NOT EXISTS learner_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id),
  preferences JSONB DEFAULT '{"preferred_learning_style": "visual", "preferred_content_types": ["video", "interactive"], "learning_goals": ["Improve technical skills", "Develop leadership abilities"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert preferences for our target user if not already present
INSERT INTO learner_dashboard_preferences (employee_id, preferences)
SELECT 
  '12f71bd2-e9d4-42bd-9951-5179a5ce9378',
  '{"preferred_learning_style": "visual", "preferred_content_types": ["video", "interactive"], "learning_goals": ["Finance skills", "Leadership abilities"]}'
WHERE 
  NOT EXISTS (
    SELECT 1 FROM learner_dashboard_preferences 
    WHERE employee_id = '12f71bd2-e9d4-42bd-9951-5179a5ce9378'
  );

-- Assign a learning path to our user
INSERT INTO hr_learning_paths (title, description, skill_level, created_at, updated_at)
SELECT 
  'Financial Leadership Mastery', 
  'Comprehensive program designed for finance professionals looking to develop leadership skills',
  'Advanced',
  now(),
  now()
WHERE 
  NOT EXISTS (
    SELECT 1 FROM hr_learning_paths 
    WHERE title = 'Financial Leadership Mastery'
  )
RETURNING id;

-- Use the new learning path ID to create an enrollment for our user
-- Note: You'll need to replace 'NEW_LEARNING_PATH_ID' with the actual ID
INSERT INTO hr_learning_path_enrollments (
  employee_id, 
  learning_path_id, 
  status, 
  progress, 
  enrollment_date, 
  completion_date,
  estimated_completion_date
)
SELECT 
  '12f71bd2-e9d4-42bd-9951-5179a5ce9378',
  id,
  'in_progress',
  25,
  now(),
  NULL,
  now() + INTERVAL '60 days'
FROM 
  hr_learning_paths
WHERE 
  title = 'Financial Leadership Mastery'
AND 
  NOT EXISTS (
    SELECT 1 FROM hr_learning_path_enrollments 
    WHERE 
      employee_id = '12f71bd2-e9d4-42bd-9951-5179a5ce9378' AND
      learning_path_id = id
  ); 