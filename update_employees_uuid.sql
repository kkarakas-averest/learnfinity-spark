-- First, let's define some UUIDs for our departments and positions
-- We'll use variables to store these UUIDs for later reference

-- Department UUIDs
DO $$
DECLARE
  eng_dept_id UUID := 'b5f7e1d2-5a7e-4f1d-9c7b-d74e1f2a3b4c';
  marketing_dept_id UUID := 'c6f8e2d3-6b8f-5e2d-0d8c-e85f2g3b4c5d';
  sales_dept_id UUID := 'd7f9e3d4-7c9f-6f3d-1e9d-f96g3h4i5j6e';
  hr_dept_id UUID := 'e8f0e4d5-8d0f-7g4e-2f0e-g07h4i5j6k7f';
  finance_dept_id UUID := 'f9g1e5d6-9e1g-8h5f-3g1f-h18i5j6k7l8g';

  -- Position UUIDs
  senior_dev_id UUID := 'a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6';
  marketing_spec_id UUID := 'b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7';
  sales_mgr_id UUID := 'c3d4e5f6-7g8h-9i0j-1k2l-m3n4o5p6q7r8';
  junior_dev_id UUID := 'd4e5f6g7-8h9i-0j1k-2l3m-n4o5p6q7r8s9';
  hr_spec_id UUID := 'e5f6g7h8-9i0j-1k2l-3m4n-o5p6q7r8s9t0';
  financial_analyst_id UUID := 'f6g7h8i9-0j1k-2l3m-4n5o-p6q7r8s9t0u1';
BEGIN
  -- Make sure departments exist
  INSERT INTO hr_departments (id, name)
  VALUES (eng_dept_id, 'Engineering')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_departments (id, name)
  VALUES (marketing_dept_id, 'Marketing')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_departments (id, name)
  VALUES (sales_dept_id, 'Sales')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_departments (id, name)
  VALUES (hr_dept_id, 'Human Resources')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_departments (id, name)
  VALUES (finance_dept_id, 'Finance')
  ON CONFLICT (id) DO NOTHING;

  -- Make sure positions exist
  INSERT INTO hr_positions (id, title, department_id)
  VALUES (senior_dev_id, 'Senior Developer', eng_dept_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_positions (id, title, department_id)
  VALUES (marketing_spec_id, 'Marketing Specialist', marketing_dept_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_positions (id, title, department_id)
  VALUES (sales_mgr_id, 'Sales Manager', sales_dept_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_positions (id, title, department_id)
  VALUES (junior_dev_id, 'Junior Developer', eng_dept_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_positions (id, title, department_id)
  VALUES (hr_spec_id, 'HR Specialist', hr_dept_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO hr_positions (id, title, department_id)
  VALUES (financial_analyst_id, 'Financial Analyst', finance_dept_id)
  ON CONFLICT (id) DO NOTHING;

  -- Now update employees with diverse departments and positions

  -- 1. Engineering employees
  UPDATE hr_employees
  SET 
    department_id = eng_dept_id,
    position_id = senior_dev_id
  WHERE 
    name LIKE '%Michael%' OR
    name LIKE '%Robert%';

  -- 2. Marketing employees
  UPDATE hr_employees
  SET 
    department_id = marketing_dept_id,
    position_id = marketing_spec_id
  WHERE 
    name LIKE '%Emily%';

  -- 3. Sales employees
  UPDATE hr_employees
  SET 
    department_id = sales_dept_id,
    position_id = sales_mgr_id
  WHERE 
    name LIKE '%Jane%';

  -- 4. HR employees
  UPDATE hr_employees
  SET 
    department_id = hr_dept_id,
    position_id = hr_spec_id
  WHERE 
    name LIKE '%John%';

  -- 5. Finance employees
  UPDATE hr_employees
  SET 
    department_id = finance_dept_id,
    position_id = financial_analyst_id
  WHERE 
    name LIKE '%Kubilay%' OR
    name LIKE '%Test%';

  -- Fallback for any employees that might not have been caught by the above
  UPDATE hr_employees
  SET 
    department_id = eng_dept_id,
    position_id = junior_dev_id
  WHERE 
    department_id IS NULL OR
    position_id IS NULL;

  -- Log how many employees were updated
  RAISE NOTICE 'Employee update complete';
END $$; 