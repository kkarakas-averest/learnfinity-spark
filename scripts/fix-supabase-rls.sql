-- Fix RLS permissions for employee_user_mapping table
-- This script should be run in the Supabase SQL editor

-- 1. Enable RLS on the table if not already enabled
ALTER TABLE employee_user_mapping ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for authenticated users to select their own mapping
CREATE POLICY "Users can view their own employee mapping"
  ON employee_user_mapping
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create policy for admins to manage all mappings
CREATE POLICY "Admins can manage all employee mappings"
  ON employee_user_mapping
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 4. Enable RLS on users table if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for users to view their own user record
CREATE POLICY "Users can view their own user record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 6. Create policy for admins to manage all user records
CREATE POLICY "Admins can manage all user records"
  ON users
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Note: Run this script in your Supabase SQL editor
-- Check if the tables and columns match your actual schema before running
-- You may need to adjust the policies based on your specific requirements 