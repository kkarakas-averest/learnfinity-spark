-- HR Module Database Schema
-- This schema creates all necessary tables for the HR module

-- Departments Table
CREATE TABLE IF NOT EXISTS hr_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Positions Table
CREATE TABLE IF NOT EXISTS hr_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES hr_departments(id),
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(title, department_id)
);

-- Employees Table
CREATE TABLE IF NOT EXISTS hr_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  hire_date DATE,
  department_id UUID REFERENCES hr_departments(id),
  position_id UUID REFERENCES hr_positions(id),
  manager_id UUID REFERENCES hr_employees(id),
  status VARCHAR(20) DEFAULT 'active',
  profile_image_url TEXT,
  resume_url TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS hr_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES hr_departments(id),
  skill_level VARCHAR(20) DEFAULT 'beginner',
  duration INTEGER, -- in minutes
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS hr_course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  course_id UUID REFERENCES hr_courses(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0,
  score DECIMAL(5,2),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(employee_id, course_id)
);

-- Employee Activities Table
CREATE TABLE IF NOT EXISTS hr_employee_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  course_id UUID REFERENCES hr_courses(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Paths Table
CREATE TABLE IF NOT EXISTS hr_learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  skill_level VARCHAR(20) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Path Courses Junction Table
CREATE TABLE IF NOT EXISTS hr_learning_path_courses (
  learning_path_id UUID REFERENCES hr_learning_paths(id) ON DELETE CASCADE,
  course_id UUID REFERENCES hr_courses(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  PRIMARY KEY (learning_path_id, course_id)
);

-- Employee Learning Path Enrollments
CREATE TABLE IF NOT EXISTS hr_learning_path_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES hr_learning_paths(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress',
  progress INTEGER DEFAULT 0,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(employee_id, learning_path_id)
);

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table to handle updated_at
DO $$
DECLARE
  tables TEXT[] := array['hr_departments', 'hr_positions', 'hr_employees', 'hr_courses', 'hr_learning_paths'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_timestamp ON %s', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_timestamp BEFORE UPDATE ON %s FOR EACH ROW EXECUTE PROCEDURE update_timestamp()', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employee_activities ENABLE ROW LEVEL SECURITY;

-- Create Policy for HR role to access all HR tables
CREATE POLICY hr_access_policy ON hr_departments
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_positions
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_employees
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_course_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_learning_paths
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_learning_path_courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_policy ON hr_employee_activities
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

-- Employees can view their own records
CREATE POLICY employee_view_policy ON public.hr_employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY employee_view_policy ON public.hr_course_enrollments
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.hr_employees WHERE id = hr_course_enrollments.employee_id
  ));

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_hr_departments_timestamp
BEFORE UPDATE ON public.hr_departments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_positions_timestamp
BEFORE UPDATE ON public.hr_positions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_employees_timestamp
BEFORE UPDATE ON public.hr_employees
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_courses_timestamp
BEFORE UPDATE ON public.hr_courses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_course_enrollments_timestamp
BEFORE UPDATE ON public.hr_course_enrollments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_learning_paths_timestamp
BEFORE UPDATE ON public.hr_learning_paths
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hr_learning_path_courses_timestamp
BEFORE UPDATE ON public.hr_learning_path_courses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hr_employees_department_id ON public.hr_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_position_id ON public.hr_employees(position_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_hr_courses_department_id ON public.hr_courses(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_courses_status ON public.hr_courses(status);
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_employee_id ON public.hr_course_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_course_id ON public.hr_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_status ON public.hr_course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_hr_learning_paths_department_id ON public.hr_learning_paths(department_id);
CREATE INDEX IF NOT EXISTS idx_hr_learning_path_courses_learning_path_id ON public.hr_learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_hr_employee_activities_employee_id ON public.hr_employee_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_employee_activities_activity_type ON public.hr_employee_activities(activity_type); 