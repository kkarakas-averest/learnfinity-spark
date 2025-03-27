-- HR Module Schema
-- This file contains the schema for the HR module of Learnfinity
-- It defines tables for managing employees, departments, positions, skills, courses, and activities

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Departments Table
CREATE TABLE IF NOT EXISTS hr_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_departments' AND column_name = 'description'
  ) THEN
    ALTER TABLE hr_departments ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create Positions Table
CREATE TABLE IF NOT EXISTS hr_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES hr_departments(id),
  description TEXT,
  salary_range JSONB,
  requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_positions' AND column_name = 'description'
  ) THEN
    ALTER TABLE hr_positions ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create Employees Table
CREATE TABLE IF NOT EXISTS hr_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  hire_date DATE,
  department_id UUID REFERENCES hr_departments(id),
  position_id UUID REFERENCES hr_positions(id),
  status VARCHAR(20) DEFAULT 'active',
  profile_image_url TEXT,
  resume_url TEXT,
  company_id UUID,
  last_active_at TIMESTAMP WITH TIME ZONE,
  current_rag_status VARCHAR(10) DEFAULT 'green',
  last_rag_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Employee Skills Table
CREATE TABLE IF NOT EXISTS hr_employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) NOT NULL,
  is_in_progress BOOLEAN DEFAULT false,
  verification_status VARCHAR(20) DEFAULT 'unverified',
  verified_by UUID,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_name)
);

-- Create Courses Table
CREATE TABLE IF NOT EXISTS hr_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  difficulty_level VARCHAR(20),
  tags JSONB,
  provider VARCHAR(100),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'description'
  ) THEN
    ALTER TABLE hr_courses ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'duration_hours'
  ) THEN
    ALTER TABLE hr_courses ADD COLUMN duration_hours INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE hr_courses ADD COLUMN difficulty_level VARCHAR(20);
  END IF;
END $$;

-- Create Course Enrollments Table
CREATE TABLE IF NOT EXISTS hr_course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  course_id UUID REFERENCES hr_courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'enrolled',
  last_activity_date TIMESTAMP WITH TIME ZONE,
  certification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, course_id)
);

-- Create Employee Activities Table
CREATE TABLE IF NOT EXISTS hr_employee_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  course_id UUID REFERENCES hr_courses(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Employee RAG History Table (Red, Amber, Green status tracking)
CREATE TABLE IF NOT EXISTS employee_rag_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL,
  notes TEXT,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_employee_department ON hr_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_position ON hr_employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_skills ON hr_employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_employee ON hr_course_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON hr_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_employee_activities_employee ON hr_employee_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activities_type ON hr_employee_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_rag_history_employee ON employee_rag_history(employee_id);

-- Sample data insertion for testing
-- Insert departments with backward compatibility for existing schema
DO $$ 
BEGIN
  -- Insert with description if column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_departments' AND column_name = 'description'
  ) THEN
    INSERT INTO hr_departments (name, description) VALUES
    ('Engineering', 'Software development and technical operations'),
    ('Marketing', 'Brand management and customer acquisition'),
    ('Human Resources', 'Employee management and company culture'),
    ('Finance', 'Financial operations and reporting'),
    ('Sales', 'Revenue generation and customer relationships')
    ON CONFLICT (name) DO NOTHING;
  ELSE
    -- Insert without description if column doesn't exist
    INSERT INTO hr_departments (name) VALUES
    ('Engineering'),
    ('Marketing'),
    ('Human Resources'),
    ('Finance'),
    ('Sales')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Insert Positions with backward compatibility for existing schema
DO $$ 
BEGIN
  -- Insert with description if column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_positions' AND column_name = 'description'
  ) THEN
    INSERT INTO hr_positions (title, department_id, description) VALUES
    ('Software Engineer', (SELECT id FROM hr_departments WHERE name = 'Engineering'), 'Develops and maintains software applications'),
    ('Marketing Specialist', (SELECT id FROM hr_departments WHERE name = 'Marketing'), 'Creates and executes marketing campaigns'),
    ('HR Manager', (SELECT id FROM hr_departments WHERE name = 'Human Resources'), 'Oversees HR operations and employee relations'),
    ('Financial Analyst', (SELECT id FROM hr_departments WHERE name = 'Finance'), 'Analyzes financial data and prepares reports'),
    ('Sales Representative', (SELECT id FROM hr_departments WHERE name = 'Sales'), 'Generates leads and closes sales')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Insert without description if column doesn't exist
    INSERT INTO hr_positions (title, department_id) VALUES
    ('Software Engineer', (SELECT id FROM hr_departments WHERE name = 'Engineering')),
    ('Marketing Specialist', (SELECT id FROM hr_departments WHERE name = 'Marketing')),
    ('HR Manager', (SELECT id FROM hr_departments WHERE name = 'Human Resources')),
    ('Financial Analyst', (SELECT id FROM hr_departments WHERE name = 'Finance')),
    ('Sales Representative', (SELECT id FROM hr_departments WHERE name = 'Sales'))
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Courses with backward compatibility for existing schema
DO $$ 
BEGIN
  -- Check if all columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'description'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'duration_hours'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'hr_courses' AND column_name = 'difficulty_level'
  ) THEN
    -- Insert with all columns
    INSERT INTO hr_courses (title, description, duration_hours, difficulty_level) VALUES
    ('Introduction to TypeScript', 'Learn the basics of TypeScript programming', 10, 'beginner'),
    ('Advanced React Development', 'Master React hooks, context, and performance optimization', 15, 'advanced'),
    ('Communication Skills for Professionals', 'Enhance your workplace communication effectiveness', 8, 'intermediate'),
    ('Leadership Fundamentals', 'Essential skills for new and aspiring leaders', 12, 'intermediate'),
    ('Data Analysis with Python', 'Learn to analyze and visualize data using Python', 20, 'intermediate')
    ON CONFLICT DO NOTHING;
  ELSE
    -- Insert with just title for maximum compatibility
    INSERT INTO hr_courses (title) VALUES
    ('Introduction to TypeScript'),
    ('Advanced React Development'),
    ('Communication Skills for Professionals'),
    ('Leadership Fundamentals'),
    ('Data Analysis with Python')
    ON CONFLICT DO NOTHING;
  END IF;
END $$; 