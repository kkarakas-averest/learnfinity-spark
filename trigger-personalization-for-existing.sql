-- Script to reset and trigger personalization for existing enrollments
-- Run this in the Supabase SQL Editor

-- First, show enrollments without personalization status
SELECT 
  id,
  employee_id,
  course_id,
  enrollment_date
FROM 
  hr_course_enrollments
WHERE 
  personalized_content_generation_status IS NULL
ORDER BY 
  enrollment_date DESC;

-- Set personalization status to 'pending' for existing enrollments
-- Uncomment the following UPDATE statement to actually run it:

-- UPDATE hr_course_enrollments
-- SET personalized_content_generation_status = 'pending'
-- WHERE personalized_content_generation_status IS NULL;

-- FOR A SPECIFIC ENROLLMENT, use:
-- UPDATE hr_course_enrollments
-- SET personalized_content_generation_status = 'pending'
-- WHERE id = 'your-enrollment-id-here';

-- Reset failed personalization attempts if needed:
-- UPDATE hr_course_enrollments
-- SET 
--   personalized_content_generation_status = 'pending',
--   personalized_content_started_at = NULL,
--   personalized_content_completed_at = NULL
-- WHERE 
--   personalized_content_generation_status = 'failed';

-- To call the personalization endpoint after updating the status, use:
-- curl -X POST https://your-domain.com/api/hr/courses/process-personalization-queue 