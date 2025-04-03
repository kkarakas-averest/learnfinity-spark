-- Check if the user with the provided email exists in hr_employees
SELECT * FROM hr_employees WHERE email = 'kkarakass@averesttraining.com';

-- Get user ID from auth.users for the email
SELECT id, email, created_at FROM auth.users WHERE email = 'kkarakass@averesttraining.com';

-- Get the HR employee profile with related data
SELECT 
  e.id, 
  e.name, 
  e.email, 
  e.phone,
  e.department_id, 
  e.position_id,
  d.name as department_name,
  p.title as position_title,
  e.hire_date,
  e.status,
  e.manager_id
FROM 
  hr_employees e
LEFT JOIN 
  hr_departments d ON e.department_id = d.id
LEFT JOIN 
  hr_positions p ON e.position_id = p.id
WHERE 
  e.email = 'kkarakass@averesttraining.com';

-- Check if user has any course enrollments
SELECT 
  ce.*,
  c.title as course_title,
  c.description as course_description
FROM 
  hr_course_enrollments ce
JOIN 
  hr_employees e ON ce.employee_id = e.id
JOIN 
  hr_courses c ON ce.course_id = c.id
WHERE 
  e.email = 'kkarakass@averesttraining.com';

-- Check if user has any learning path enrollments
SELECT 
  lpe.*,
  lp.title as learning_path_title,
  lp.description as learning_path_description
FROM 
  hr_learning_path_enrollments lpe
JOIN 
  hr_employees e ON lpe.employee_id = e.id
JOIN 
  hr_learning_paths lp ON lpe.learning_path_id = lp.id
WHERE 
  e.email = 'kkarakass@averesttraining.com';

-- Check user activities
SELECT 
  ea.*
FROM 
  hr_employee_activities ea
JOIN 
  hr_employees e ON ea.employee_id = e.id
WHERE 
  e.email = 'kkarakass@averesttraining.com'
ORDER BY 
  ea.timestamp DESC; 