-- Get list of all tables in the database
SELECT 
  table_schema, 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY 
  table_schema, 
  table_name;

-- Get detailed information about hr_employees table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_employees'
ORDER BY 
  ordinal_position;

-- Get detailed information about hr_courses table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_courses'
ORDER BY 
  ordinal_position;

-- Get detailed information about hr_course_enrollments table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_course_enrollments'
ORDER BY 
  ordinal_position;

-- Get detailed information about hr_learning_paths table (if exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_learning_paths'
ORDER BY 
  ordinal_position;

-- Get detailed information about hr_learning_path_enrollments table (if exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_learning_path_enrollments'
ORDER BY 
  ordinal_position;

-- Get detailed information about hr_employee_activities table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'hr_employee_activities'
ORDER BY 
  ordinal_position;

-- Check for auth.users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'auth' AND 
  table_name = 'users'
ORDER BY 
  ordinal_position;

-- Get foreign key relationships
SELECT
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name; 