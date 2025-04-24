-- Skills Assessment Schema
-- This file contains tables for storing skills assessment results

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Skills Assessment Table
CREATE TABLE IF NOT EXISTS hr_skill_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assessed_by UUID, -- Reference to the user who performed the assessment
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Skills Assessment Details Table
CREATE TABLE IF NOT EXISTS hr_skill_assessment_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES hr_skill_assessments(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER DEFAULT 0, -- 0-5 scale
  gap_level INTEGER DEFAULT 0, -- 0-5 scale
  course_id UUID REFERENCES hr_courses(id) ON DELETE SET NULL,
  is_missing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_skill_assessments_employee ON hr_skill_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_details ON hr_skill_assessment_details(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skills ON hr_skill_assessment_details(skill_name);

-- Create RLS policies
ALTER TABLE hr_skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_skill_assessment_details ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY hr_skill_assessments_policy ON hr_skill_assessments
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY hr_skill_assessment_details_policy ON hr_skill_assessment_details
  FOR ALL
  TO authenticated
  USING (true); 