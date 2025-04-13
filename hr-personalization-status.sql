-- SQL to check personalization status and log entries
-- Run this in the Supabase SQL Editor

-- Check the personalization infrastructure setup
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ai_course_content'
  ) AS ai_course_content_table_exists,
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'system_logs'
  ) AS system_logs_table_exists,
  EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hr_course_enrollments' 
    AND column_name = 'personalized_content_generation_status'
  ) AS personalization_status_column_exists,
  EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_set_personalization_pending'
  ) AS personalization_trigger_exists;

-- Check the most recent course enrollments and their personalization status
SELECT 
  hce.id,
  hce.employee_id,
  hce.course_id,
  hce.enrollment_date,
  hce.personalized_content_generation_status,
  hce.personalized_content_started_at,
  hce.personalized_content_completed_at,
  hce.personalized_content_id,
  he.name AS employee_name,
  hc.title AS course_title
FROM 
  hr_course_enrollments hce
LEFT JOIN 
  hr_employees he ON hce.employee_id = he.id
LEFT JOIN 
  hr_courses hc ON hce.course_id = hc.id
ORDER BY 
  hce.enrollment_date DESC
LIMIT 10;

-- Check for AI-generated course content
SELECT 
  id,
  created_for_user_id AS employee_id,
  course_id,
  metadata->>'title' AS title,
  created_at
FROM 
  ai_course_content
ORDER BY 
  created_at DESC
LIMIT 10;

-- Check recent system logs related to content personalization
SELECT 
  timestamp,
  category,
  action,
  details
FROM 
  system_logs
WHERE 
  category IN ('Personalization', 'ContentGenerator')
ORDER BY 
  timestamp DESC
LIMIT 20;

-- Check for enrollments pending personalization
SELECT 
  COUNT(*) AS pending_personalizations
FROM 
  hr_course_enrollments
WHERE 
  personalized_content_generation_status = 'pending';

-- Check for personalization in various states
SELECT 
  personalized_content_generation_status,
  COUNT(*) AS count
FROM 
  hr_course_enrollments
WHERE 
  personalized_content_generation_status IS NOT NULL
GROUP BY 
  personalized_content_generation_status;

-- Get details of enrollments with successful personalization to verify linking
SELECT 
  hce.id AS enrollment_id,
  he.name AS employee_name,
  hc.title AS course_title,
  hce.personalized_content_id,
  acc.id AS content_id,
  acc.metadata->>'title' AS personalized_title,
  acc.created_at AS content_created_at
FROM 
  hr_course_enrollments hce
JOIN 
  hr_employees he ON hce.employee_id = he.id
JOIN 
  hr_courses hc ON hce.course_id = hc.id
LEFT JOIN 
  ai_course_content acc ON hce.personalized_content_id = acc.id
WHERE 
  hce.personalized_content_generation_status = 'completed'
ORDER BY 
  acc.created_at DESC
LIMIT 10; 