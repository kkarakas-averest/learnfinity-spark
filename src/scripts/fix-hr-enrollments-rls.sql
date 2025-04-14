-- Fix RLS policy for hr_course_enrollments to allow both HR and learner access

-- First, drop existing policies for hr_course_enrollments
DROP POLICY IF EXISTS hr_access_policy ON hr_course_enrollments;
DROP POLICY IF EXISTS employee_view_policy ON hr_course_enrollments;
DROP POLICY IF EXISTS service_role_policy ON hr_course_enrollments;

-- Create policy for HR role to have full access
CREATE POLICY hr_admin_policy ON hr_course_enrollments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'hr' OR auth.jwt() ->> 'role' = 'superadmin');

-- Create policy for employees to view their own enrollments
CREATE POLICY employee_view_policy ON hr_course_enrollments
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM hr_employees WHERE id = hr_course_enrollments.employee_id
    )
  );

-- Create policy to allow employees to update their own enrollment progress
CREATE POLICY employee_update_policy ON hr_course_enrollments
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM hr_employees WHERE id = hr_course_enrollments.employee_id
    )
  );

-- Create policy for service role to have full access (bypassing RLS)
CREATE POLICY service_role_policy ON hr_course_enrollments
  FOR ALL
  USING (auth.role() = 'service_role');

-- Log policy setup
INSERT INTO system_logs (category, action, details)
VALUES (
  'database', 
  'update_rls_policy', 
  jsonb_build_object(
    'table', 'hr_course_enrollments',
    'policies', jsonb_build_array(
      'hr_admin_policy',
      'employee_view_policy',
      'employee_update_policy',
      'service_role_policy'
    )
  )
); 