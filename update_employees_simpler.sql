-- Simpler approach using dynamic UUID generation

-- Make sure extension is enabled for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create departments if they don't exist and return their IDs
WITH dept_insertions AS (
  INSERT INTO hr_departments (id, name)
  VALUES 
    (uuid_generate_v4(), 'Engineering'),
    (uuid_generate_v4(), 'Marketing'),
    (uuid_generate_v4(), 'Sales'),
    (uuid_generate_v4(), 'Human Resources'),
    (uuid_generate_v4(), 'Finance')
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
),
all_depts AS (
  SELECT id, name FROM dept_insertions
  UNION
  SELECT id, name FROM hr_departments
)
-- Step 2: Now create positions linked to departments
INSERT INTO hr_positions (id, title, department_id)
SELECT 
  uuid_generate_v4(), 
  pos.title, 
  d.id 
FROM 
  (VALUES
    ('Senior Developer', 'Engineering'),
    ('Junior Developer', 'Engineering'),
    ('Marketing Specialist', 'Marketing'),
    ('Sales Manager', 'Sales'),
    ('HR Specialist', 'Human Resources'),
    ('Financial Analyst', 'Finance')
  ) as pos(title, dept_name)
JOIN all_depts d ON d.name = pos.dept_name
ON CONFLICT (title, department_id) DO NOTHING;

-- Step 3: Update employees with appropriate department and position IDs
-- Engineering employees
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Engineering' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'Senior Developer' LIMIT 1)
WHERE 
  name LIKE '%Michael%' OR
  name LIKE '%Robert%';

-- Marketing employees
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Marketing' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'Marketing Specialist' LIMIT 1)
WHERE 
  name LIKE '%Emily%';

-- Sales employees
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Sales' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'Sales Manager' LIMIT 1)
WHERE 
  name LIKE '%Jane%';

-- HR employees
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Human Resources' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'HR Specialist' LIMIT 1)
WHERE 
  name LIKE '%John%';

-- Finance employees
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Finance' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'Financial Analyst' LIMIT 1)
WHERE 
  name LIKE '%Kubilay%' OR
  name LIKE '%Test%';

-- Set fallback for any remaining employees without department/position
UPDATE hr_employees
SET 
  department_id = (SELECT id FROM hr_departments WHERE name = 'Engineering' LIMIT 1),
  position_id = (SELECT id FROM hr_positions WHERE title = 'Junior Developer' LIMIT 1)
WHERE 
  department_id IS NULL OR
  position_id IS NULL; 