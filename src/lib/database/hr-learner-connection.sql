-- HR-Learner Connection Tables
-- These tables form the connection between the HR management system and 
-- the learner experience platform.

-- First, let's get information about the hr_employees table
-- Comment this out after you've identified the correct column name
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hr_employees';

-- Learning Path Assignments Table
-- Tracks which learning paths are assigned to which users by HR
CREATE TABLE IF NOT EXISTS learning_path_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL, -- HR user who assigned this
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(10) CHECK (priority IN ('high', 'medium', 'low')),
  mandatory BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, learning_path_id)
);

-- Agent Activity Tracking Table
-- Used to track all agent activities, including HR actions
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(20) NOT NULL, -- 'hr', 'educator', 'coach', etc.
  agent_name VARCHAR(100) NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'learning_path_assignment', 'course_recommendation', etc.
  description TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee to User Mapping Table
-- Maps HR employee records to auth.users for learning platform access
CREATE TABLE IF NOT EXISTS employee_user_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id),
  UNIQUE(user_id)
);

-- Add required fields to existing tables

-- Add fields to learner_profiles table
ALTER TABLE IF EXISTS learner_profiles
ADD COLUMN IF NOT EXISTS employee_id UUID,
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS title VARCHAR(100),
ADD COLUMN IF NOT EXISTS hire_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_hr_sync TIMESTAMP WITH TIME ZONE;

-- Add fields to learning_paths table
ALTER TABLE IF EXISTS learning_paths
ADD COLUMN IF NOT EXISTS hr_assigned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mandatory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_by UUID,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

-- Add fields to course_enrollments table
ALTER TABLE IF EXISTS course_enrollments 
ADD COLUMN IF NOT EXISTS rag_status VARCHAR(10) CHECK (rag_status IN ('red', 'amber', 'green')),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;

-- Add RLS Policies

-- Learning Path Assignments policies
ALTER TABLE learning_path_assignments ENABLE ROW LEVEL SECURITY;

-- First, drop any existing policies to avoid errors
DROP POLICY IF EXISTS "HR users can view all learning path assignments" ON learning_path_assignments;
DROP POLICY IF EXISTS "HR users can insert learning path assignments" ON learning_path_assignments;
DROP POLICY IF EXISTS "HR users can update learning path assignments" ON learning_path_assignments;
DROP POLICY IF EXISTS "Learners can view their own assignments" ON learning_path_assignments;

-- HR users can view and manage all assignments
-- Since hr_employees doesn't have a direct auth link, we'll use email
CREATE POLICY "HR users can view all learning path assignments"
  ON learning_path_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

CREATE POLICY "HR users can insert learning path assignments"
  ON learning_path_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

CREATE POLICY "HR users can update learning path assignments"
  ON learning_path_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

-- Learners can view only their own assignments
CREATE POLICY "Learners can view their own assignments"
  ON learning_path_assignments
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Agent Activities policies
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for agent activities
DROP POLICY IF EXISTS "HR users can view all agent activities" ON agent_activities;
DROP POLICY IF EXISTS "HR users can insert agent activities" ON agent_activities;
DROP POLICY IF EXISTS "Learners can view their own agent activities" ON agent_activities;

-- HR users can view all agent activities
CREATE POLICY "HR users can view all agent activities"
  ON agent_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

-- HR users can insert agent activities
CREATE POLICY "HR users can insert agent activities"
  ON agent_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

-- Learners can view only their own agent activities
CREATE POLICY "Learners can view their own agent activities"
  ON agent_activities
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Employee User Mapping policies
ALTER TABLE employee_user_mapping ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for employee user mapping
DROP POLICY IF EXISTS "HR users can view all employee user mappings" ON employee_user_mapping;
DROP POLICY IF EXISTS "HR users can insert employee user mappings" ON employee_user_mapping;
DROP POLICY IF EXISTS "HR users can update employee user mappings" ON employee_user_mapping;
DROP POLICY IF EXISTS "Learners can view their own mapping" ON employee_user_mapping;

-- HR users can view and manage all mappings
CREATE POLICY "HR users can view all employee user mappings"
  ON employee_user_mapping
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

CREATE POLICY "HR users can insert employee user mappings"
  ON employee_user_mapping
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

CREATE POLICY "HR users can update employee user mappings"
  ON employee_user_mapping
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hr_employees, auth.users
      WHERE hr_employees.email = auth.users.email
      AND auth.users.id = auth.uid()
    )
  );

-- Learners can view only their own mapping
CREATE POLICY "Learners can view their own mapping"
  ON employee_user_mapping
  FOR SELECT
  USING (
    user_id = auth.uid()
  ); 