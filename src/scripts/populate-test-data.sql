-- Learnfinity Spark Test Data Population Script
-- This script populates the database with realistic test data for both HR and learner systems

-- First, let's clear any existing test data to avoid conflicts
-- Only uncomment these if you want to start completely fresh (be careful in production!)
-- DELETE FROM learning_path_assignments WHERE id IS NOT NULL;
-- DELETE FROM agent_activities WHERE id IS NOT NULL;
-- DELETE FROM employee_user_mapping WHERE id IS NOT NULL;
-- DELETE FROM course_enrollments WHERE id IS NOT NULL;
-- DELETE FROM hr_employees WHERE email LIKE '%test.learnfinity.com';

-- Let's use the extension for generating UUIDs if it's not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Insert HR Employees
-- We'll create 25 employees across different departments
INSERT INTO hr_employees (id, first_name, last_name, email, title, department, hire_date, is_active)
VALUES
  -- Engineering Department
  (uuid_generate_v4(), 'Alex', 'Chen', 'alex.chen@test.learnfinity.com', 'Senior Software Engineer', 'Engineering', NOW() - INTERVAL '730 days', TRUE),
  (uuid_generate_v4(), 'Sarah', 'Johnson', 'sarah.johnson@test.learnfinity.com', 'Frontend Developer', 'Engineering', NOW() - INTERVAL '365 days', TRUE),
  (uuid_generate_v4(), 'Miguel', 'Rodriguez', 'miguel.rodriguez@test.learnfinity.com', 'Backend Developer', 'Engineering', NOW() - INTERVAL '180 days', TRUE),
  (uuid_generate_v4(), 'Priya', 'Patel', 'priya.patel@test.learnfinity.com', 'DevOps Engineer', 'Engineering', NOW() - INTERVAL '90 days', TRUE),
  (uuid_generate_v4(), 'David', 'Kim', 'david.kim@test.learnfinity.com', 'QA Engineer', 'Engineering', NOW() - INTERVAL '45 days', TRUE),
  (uuid_generate_v4(), 'Emma', 'Williams', 'emma.williams@test.learnfinity.com', 'Junior Developer', 'Engineering', NOW() - INTERVAL '30 days', TRUE),
  
  -- Marketing Department
  (uuid_generate_v4(), 'James', 'Wilson', 'james.wilson@test.learnfinity.com', 'Marketing Director', 'Marketing', NOW() - INTERVAL '500 days', TRUE),
  (uuid_generate_v4(), 'Sophia', 'Garcia', 'sophia.garcia@test.learnfinity.com', 'Content Strategist', 'Marketing', NOW() - INTERVAL '300 days', TRUE),
  (uuid_generate_v4(), 'Ethan', 'Brown', 'ethan.brown@test.learnfinity.com', 'Digital Marketing Specialist', 'Marketing', NOW() - INTERVAL '150 days', TRUE),
  (uuid_generate_v4(), 'Olivia', 'Lee', 'olivia.lee@test.learnfinity.com', 'Social Media Manager', 'Marketing', NOW() - INTERVAL '100 days', TRUE),
  
  -- HR Department
  (uuid_generate_v4(), 'Benjamin', 'Taylor', 'benjamin.taylor@test.learnfinity.com', 'HR Director', 'Human Resources', NOW() - INTERVAL '800 days', TRUE),
  (uuid_generate_v4(), 'Ava', 'Anderson', 'ava.anderson@test.learnfinity.com', 'Recruiting Manager', 'Human Resources', NOW() - INTERVAL '400 days', TRUE),
  (uuid_generate_v4(), 'Lucas', 'Martinez', 'lucas.martinez@test.learnfinity.com', 'Benefits Coordinator', 'Human Resources', NOW() - INTERVAL '200 days', TRUE),
  
  -- Product Department
  (uuid_generate_v4(), 'Isabella', 'Thomas', 'isabella.thomas@test.learnfinity.com', 'Product Manager', 'Product', NOW() - INTERVAL '450 days', TRUE),
  (uuid_generate_v4(), 'Noah', 'Hernandez', 'noah.hernandez@test.learnfinity.com', 'UX Designer', 'Product', NOW() - INTERVAL '350 days', TRUE),
  (uuid_generate_v4(), 'Mia', 'Walker', 'mia.walker@test.learnfinity.com', 'Product Analyst', 'Product', NOW() - INTERVAL '120 days', TRUE),
  
  -- Sales Department
  (uuid_generate_v4(), 'Liam', 'Gonzalez', 'liam.gonzalez@test.learnfinity.com', 'Sales Director', 'Sales', NOW() - INTERVAL '600 days', TRUE),
  (uuid_generate_v4(), 'Charlotte', 'Nelson', 'charlotte.nelson@test.learnfinity.com', 'Account Executive', 'Sales', NOW() - INTERVAL '250 days', TRUE),
  (uuid_generate_v4(), 'Jacob', 'Mitchell', 'jacob.mitchell@test.learnfinity.com', 'Sales Representative', 'Sales', NOW() - INTERVAL '80 days', TRUE),
  
  -- Finance Department
  (uuid_generate_v4(), 'Amelia', 'Perez', 'amelia.perez@test.learnfinity.com', 'Finance Manager', 'Finance', NOW() - INTERVAL '550 days', TRUE),
  (uuid_generate_v4(), 'William', 'Roberts', 'william.roberts@test.learnfinity.com', 'Financial Analyst', 'Finance', NOW() - INTERVAL '230 days', TRUE),
  
  -- Customer Support
  (uuid_generate_v4(), 'Abigail', 'Turner', 'abigail.turner@test.learnfinity.com', 'Support Manager', 'Customer Support', NOW() - INTERVAL '380 days', TRUE),
  (uuid_generate_v4(), 'Michael', 'Phillips', 'michael.phillips@test.learnfinity.com', 'Customer Support Specialist', 'Customer Support', NOW() - INTERVAL '150 days', TRUE),
  (uuid_generate_v4(), 'Emily', 'Campbell', 'emily.campbell@test.learnfinity.com', 'Technical Support Agent', 'Customer Support', NOW() - INTERVAL '60 days', TRUE);

-- Save the IDs for later use
DO $$
DECLARE
    eng_employees UUID[];
    mkt_employees UUID[];
    hr_employees UUID[];
    product_employees UUID[];
    sales_employees UUID[];
    finance_employees UUID[];
    support_employees UUID[];
BEGIN
    -- Get employee IDs by department for later use
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Engineering' AND email LIKE '%test.learnfinity.com') INTO eng_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Marketing' AND email LIKE '%test.learnfinity.com') INTO mkt_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Human Resources' AND email LIKE '%test.learnfinity.com') INTO hr_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Product' AND email LIKE '%test.learnfinity.com') INTO product_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Sales' AND email LIKE '%test.learnfinity.com') INTO sales_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Finance' AND email LIKE '%test.learnfinity.com') INTO finance_employees;
    SELECT ARRAY(SELECT id FROM hr_employees WHERE department = 'Customer Support' AND email LIKE '%test.learnfinity.com') INTO support_employees;
    
    -- For debugging
    RAISE NOTICE 'Engineering employees: %', eng_employees;
END $$;

-- Step 2: Create Learning Paths
INSERT INTO learning_paths (id, title, description, estimated_hours, created_at)
VALUES
  -- Technical Paths
  (uuid_generate_v4(), 'Full Stack Web Development', 'A comprehensive program covering frontend, backend, and DevOps essentials', 60, NOW() - INTERVAL '90 days'),
  (uuid_generate_v4(), 'Data Science Fundamentals', 'Learn the core concepts of data science, statistics, and machine learning', 45, NOW() - INTERVAL '60 days'),
  (uuid_generate_v4(), 'Cloud Computing Essentials', 'Master cloud platforms, architecture, and deployment strategies', 50, NOW() - INTERVAL '45 days'),
  
  -- Business Paths
  (uuid_generate_v4(), 'Digital Marketing Mastery', 'Strategies for effective online marketing and customer engagement', 40, NOW() - INTERVAL '30 days'),
  (uuid_generate_v4(), 'Sales Excellence Program', 'Advanced techniques for prospecting, negotiation, and closing deals', 35, NOW() - INTERVAL '25 days'),
  (uuid_generate_v4(), 'Product Management Certification', 'Create, develop, and launch successful products', 55, NOW() - INTERVAL '20 days'),
  
  -- Professional Development
  (uuid_generate_v4(), 'Leadership Development', 'Essential skills for emerging and established leaders', 30, NOW() - INTERVAL '15 days'),
  (uuid_generate_v4(), 'Business Communication', 'Effective written and verbal communication in professional settings', 25, NOW() - INTERVAL '10 days'),
  (uuid_generate_v4(), 'Project Management Professional', 'Methodologies and tools for successful project delivery', 50, NOW() - INTERVAL '5 days');

-- Create a temporary table to hold path IDs for easy reference
CREATE TEMP TABLE temp_learning_paths (
  path_name VARCHAR(255),
  path_id UUID
);

INSERT INTO temp_learning_paths (path_name, path_id)
SELECT title, id FROM learning_paths WHERE title IN (
  'Full Stack Web Development',
  'Data Science Fundamentals',
  'Cloud Computing Essentials',
  'Digital Marketing Mastery',
  'Sales Excellence Program',
  'Product Management Certification',
  'Leadership Development',
  'Business Communication',
  'Project Management Professional'
);

-- Step 3: Create Courses for Learning Paths
-- Ensure courses exist in the courses table
INSERT INTO courses (id, title, description, company_id, ai_generated, created_at)
VALUES
  -- Web Development Courses
  (uuid_generate_v4(), 'Modern HTML and CSS', 'Learn the fundamentals of modern web development with HTML5 and CSS3', NULL, false, NOW() - INTERVAL '100 days'),
  (uuid_generate_v4(), 'JavaScript Fundamentals', 'Master the core concepts of JavaScript programming', NULL, false, NOW() - INTERVAL '95 days'),
  (uuid_generate_v4(), 'React Framework', 'Build dynamic user interfaces with React', NULL, false, NOW() - INTERVAL '90 days'),
  (uuid_generate_v4(), 'Node.js Backend Development', 'Create scalable backend applications with Node.js', NULL, false, NOW() - INTERVAL '85 days'),
  (uuid_generate_v4(), 'API Design and Development', 'Design and implement RESTful APIs', NULL, false, NOW() - INTERVAL '80 days'),
  
  -- Data Science Courses
  (uuid_generate_v4(), 'Python for Data Analysis', 'Use Python for data manipulation and analysis', NULL, false, NOW() - INTERVAL '75 days'),
  (uuid_generate_v4(), 'Statistical Methods', 'Apply statistical concepts to data analysis', NULL, false, NOW() - INTERVAL '70 days'),
  (uuid_generate_v4(), 'Machine Learning Basics', 'Introduction to ML algorithms and applications', NULL, false, NOW() - INTERVAL '65 days'),
  (uuid_generate_v4(), 'Data Visualization', 'Create compelling visual representations of data', NULL, false, NOW() - INTERVAL '60 days'),
  
  -- Cloud Computing Courses
  (uuid_generate_v4(), 'AWS Fundamentals', 'Introduction to Amazon Web Services', NULL, false, NOW() - INTERVAL '55 days'),
  (uuid_generate_v4(), 'Docker and Containerization', 'Package applications into standardized containers', NULL, false, NOW() - INTERVAL '50 days'),
  (uuid_generate_v4(), 'Kubernetes Orchestration', 'Manage containerized applications at scale', NULL, false, NOW() - INTERVAL '45 days'),
  (uuid_generate_v4(), 'Cloud Security', 'Best practices for securing cloud deployments', NULL, false, NOW() - INTERVAL '40 days'),
  
  -- Marketing Courses
  (uuid_generate_v4(), 'SEO Fundamentals', 'Optimize websites for search engines', NULL, false, NOW() - INTERVAL '35 days'),
  (uuid_generate_v4(), 'Content Marketing Strategy', 'Create and distribute valuable content', NULL, false, NOW() - INTERVAL '30 days'),
  (uuid_generate_v4(), 'Social Media Marketing', 'Build brand presence on social platforms', NULL, false, NOW() - INTERVAL '25 days'),
  (uuid_generate_v4(), 'Email Marketing Campaigns', 'Design and implement effective email strategies', NULL, false, NOW() - INTERVAL '20 days'),
  
  -- Sales Courses
  (uuid_generate_v4(), 'Consultative Selling', 'Focus on customer needs and solutions', NULL, false, NOW() - INTERVAL '15 days'),
  (uuid_generate_v4(), 'Sales Negotiation Techniques', 'Master the art of negotiation', NULL, false, NOW() - INTERVAL '10 days'),
  (uuid_generate_v4(), 'CRM for Sales Professionals', 'Leverage CRM tools to manage customer relationships', NULL, false, NOW() - INTERVAL '5 days');

-- Create temp table for course IDs
CREATE TEMP TABLE temp_courses (
  course_name VARCHAR(255),
  course_id UUID
);

INSERT INTO temp_courses (course_name, course_id)
SELECT title, id FROM courses ORDER BY created_at DESC LIMIT 20;

-- Step 4: Associate Courses with Learning Paths
-- Web Development Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order)
SELECT 
  (SELECT path_id FROM temp_learning_paths WHERE path_name = 'Full Stack Web Development'),
  course_id,
  ROW_NUMBER() OVER() as sequence_order
FROM temp_courses
WHERE course_name IN ('Modern HTML and CSS', 'JavaScript Fundamentals', 'React Framework', 'Node.js Backend Development', 'API Design and Development');

-- Data Science Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order)
SELECT 
  (SELECT path_id FROM temp_learning_paths WHERE path_name = 'Data Science Fundamentals'),
  course_id,
  ROW_NUMBER() OVER() as sequence_order
FROM temp_courses
WHERE course_name IN ('Python for Data Analysis', 'Statistical Methods', 'Machine Learning Basics', 'Data Visualization');

-- Cloud Computing Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order)
SELECT 
  (SELECT path_id FROM temp_learning_paths WHERE path_name = 'Cloud Computing Essentials'),
  course_id,
  ROW_NUMBER() OVER() as sequence_order
FROM temp_courses
WHERE course_name IN ('AWS Fundamentals', 'Docker and Containerization', 'Kubernetes Orchestration', 'Cloud Security');

-- Digital Marketing Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order)
SELECT 
  (SELECT path_id FROM temp_learning_paths WHERE path_name = 'Digital Marketing Mastery'),
  course_id,
  ROW_NUMBER() OVER() as sequence_order
FROM temp_courses
WHERE course_name IN ('SEO Fundamentals', 'Content Marketing Strategy', 'Social Media Marketing', 'Email Marketing Campaigns');

-- Sales Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order)
SELECT 
  (SELECT path_id FROM temp_learning_paths WHERE path_name = 'Sales Excellence Program'),
  course_id,
  ROW_NUMBER() OVER() as sequence_order
FROM temp_courses
WHERE course_name IN ('Consultative Selling', 'Sales Negotiation Techniques', 'CRM for Sales Professionals');

-- Step 5: Create sample users in auth.users if they don't exist
-- Note: This is typically handled by your auth provider, but we'll insert placeholder code
-- In a real implementation, you'd use your auth provider's API or UI to create these users

-- Instead, let's create a note about this step
DO $$
BEGIN
  RAISE NOTICE 'AUTH USERS STEP: In a real implementation, create corresponding auth.users for each hr_employee using your auth provider.';
  RAISE NOTICE 'For testing purposes, you may need to manually create a few test users with the same emails as the hr_employees.';
END $$;

-- Step 6: Create Learning Path Assignments
-- Assign learning paths to employees based on their department
DO $$
DECLARE
    eng_id UUID;
    mkt_id UUID;
    hr_id UUID;
    product_id UUID;
    sales_id UUID;
    finance_id UUID;
    support_id UUID;
    web_dev_path UUID;
    data_science_path UUID;
    cloud_path UUID;
    marketing_path UUID;
    sales_path UUID;
    product_path UUID;
    leadership_path UUID;
    communication_path UUID;
    project_mgmt_path UUID;
    assigned_by UUID;
BEGIN
    -- Get a sample HR employee to be the assigner
    SELECT id INTO assigned_by FROM hr_employees WHERE department = 'Human Resources' AND title = 'HR Director' LIMIT 1;
    
    -- Get path IDs
    SELECT path_id INTO web_dev_path FROM temp_learning_paths WHERE path_name = 'Full Stack Web Development';
    SELECT path_id INTO data_science_path FROM temp_learning_paths WHERE path_name = 'Data Science Fundamentals';
    SELECT path_id INTO cloud_path FROM temp_learning_paths WHERE path_name = 'Cloud Computing Essentials';
    SELECT path_id INTO marketing_path FROM temp_learning_paths WHERE path_name = 'Digital Marketing Mastery';
    SELECT path_id INTO sales_path FROM temp_learning_paths WHERE path_name = 'Sales Excellence Program';
    SELECT path_id INTO product_path FROM temp_learning_paths WHERE path_name = 'Product Management Certification';
    SELECT path_id INTO leadership_path FROM temp_learning_paths WHERE path_name = 'Leadership Development';
    SELECT path_id INTO communication_path FROM temp_learning_paths WHERE path_name = 'Business Communication';
    SELECT path_id INTO project_mgmt_path FROM temp_learning_paths WHERE path_name = 'Project Management Professional';
    
    -- For each engineering employee, assign appropriate paths
    FOR eng_id IN SELECT id FROM hr_employees WHERE department = 'Engineering' AND email LIKE '%test.learnfinity.com' LOOP
        -- Assume we have a corresponding user_id in auth.users with the same email
        -- In reality, you'd need to look this up or have a mapping
        
        -- Assign technical paths to engineers
        IF random() > 0.3 THEN
            INSERT INTO learning_path_assignments (
                user_id, 
                learning_path_id, 
                assigned_by, 
                due_date, 
                priority, 
                mandatory, 
                notes
            )
            VALUES (
                eng_id, -- This is a simplification; in reality, this should be the auth.users id
                web_dev_path,
                assigned_by,
                NOW() + INTERVAL '90 days',
                'high',
                TRUE,
                'Required technical training for all engineering staff'
            );
        END IF;
        
        IF random() > 0.5 THEN
            INSERT INTO learning_path_assignments (
                user_id, 
                learning_path_id, 
                assigned_by, 
                due_date, 
                priority, 
                mandatory, 
                notes
            )
            VALUES (
                eng_id, -- This is a simplification; in reality, this should be the auth.users id
                cloud_path,
                assigned_by,
                NOW() + INTERVAL '120 days',
                'medium',
                FALSE,
                'Recommended for cloud expertise development'
            );
        END IF;
        
        -- All engineers get leadership training
        INSERT INTO learning_path_assignments (
            user_id, 
            learning_path_id, 
            assigned_by, 
            due_date, 
            priority, 
            mandatory, 
            notes
        )
        VALUES (
            eng_id, -- This is a simplification; in reality, this should be the auth.users id
            leadership_path,
            assigned_by,
            NOW() + INTERVAL '180 days',
            'low',
            FALSE,
            'Professional development track'
        );
    END LOOP;
    
    -- Similar assignments for other departments
    -- Marketing employees get marketing path
    FOR mkt_id IN SELECT id FROM hr_employees WHERE department = 'Marketing' AND email LIKE '%test.learnfinity.com' LOOP
        INSERT INTO learning_path_assignments (
            user_id, 
            learning_path_id, 
            assigned_by, 
            due_date, 
            priority, 
            mandatory, 
            notes
        )
        VALUES (
            mkt_id,
            marketing_path,
            assigned_by,
            NOW() + INTERVAL '60 days',
            'high',
            TRUE,
            'Core marketing curriculum'
        );
    END LOOP;
    
    -- Sales employees get sales path
    FOR sales_id IN SELECT id FROM hr_employees WHERE department = 'Sales' AND email LIKE '%test.learnfinity.com' LOOP
        INSERT INTO learning_path_assignments (
            user_id, 
            learning_path_id, 
            assigned_by, 
            due_date, 
            priority, 
            mandatory, 
            notes
        )
        VALUES (
            sales_id,
            sales_path,
            assigned_by,
            NOW() + INTERVAL '60 days',
            'high',
            TRUE,
            'Required sales training program'
        );
    END LOOP;
    
    -- Everyone gets communication path
    FOR hr_id IN SELECT id FROM hr_employees WHERE email LIKE '%test.learnfinity.com' LOOP
        INSERT INTO learning_path_assignments (
            user_id, 
            learning_path_id, 
            assigned_by, 
            due_date, 
            priority, 
            mandatory, 
            notes
        )
        VALUES (
            hr_id,
            communication_path,
            assigned_by,
            NOW() + INTERVAL '90 days',
            'medium',
            TRUE,
            'Company-wide communication skills development'
        );
    END LOOP;
    
END $$;

-- Step 7: Create some progress data for enrollments
-- This simulates learners who have made progress in their assigned courses

-- First, insert into course_enrollments for the first course in each assigned path
INSERT INTO course_enrollments (
    user_id,
    course_id,
    progress,
    status,
    enrolled_at,
    last_activity_at,
    rag_status
)
SELECT 
    lpa.user_id,
    lpc.course_id,
    CASE 
        WHEN random() < 0.3 THEN floor(random() * 30)::int -- 30% have just started (0-30%)
        WHEN random() < 0.6 THEN 30 + floor(random() * 40)::int -- 30% in middle (30-70%)
        ELSE 70 + floor(random() * 30)::int -- 40% nearly done (70-100%)
    END as progress,
    CASE 
        WHEN random() < 0.8 THEN 'in_progress'
        ELSE 'completed'
    END as status,
    NOW() - (random() * 30)::int * INTERVAL '1 day', -- Enrolled some time in the last month
    NOW() - (random() * 7)::int * INTERVAL '1 day', -- Last activity in the last week
    CASE 
        WHEN random() < 0.7 THEN 'green'
        WHEN random() < 0.9 THEN 'amber'
        ELSE 'red'
    END as rag_status
FROM learning_path_assignments lpa
JOIN learning_path_courses lpc ON lpa.learning_path_id = lpc.learning_path_id
WHERE lpc.sequence_order = 1 -- Just the first course in each path
  AND NOT EXISTS (
    SELECT 1 FROM course_enrollments ce 
    WHERE ce.user_id = lpa.user_id AND ce.course_id = lpc.course_id
  );

-- Step 8: Create agent activities to simulate AI interaction
INSERT INTO agent_activities (
    user_id,
    agent_type,
    agent_name,
    activity_type,
    description,
    metadata,
    timestamp
)
SELECT 
    user_id,
    CASE 
        WHEN random() < 0.4 THEN 'educator'
        WHEN random() < 0.7 THEN 'analyzer'
        ELSE 'hr'
    END as agent_type,
    CASE 
        WHEN random() < 0.4 THEN 'Learning Path Designer'
        WHEN random() < 0.7 THEN 'Progress Analyzer'
        ELSE 'HR Learning Advisor'
    END as agent_name,
    CASE 
        WHEN random() < 0.3 THEN 'learning_path_generated'
        WHEN random() < 0.6 THEN 'progress_analysis'
        WHEN random() < 0.8 THEN 'intervention_recommendation'
        ELSE 'skill_assessment'
    END as activity_type,
    CASE 
        WHEN random() < 0.3 THEN 'Generated personalized learning path based on employee profile'
        WHEN random() < 0.6 THEN 'Analyzed learning progress and identified patterns'
        WHEN random() < 0.8 THEN 'Recommended learning intervention based on progress analysis'
        ELSE 'Assessed current skills and identified gaps'
    END as description,
    jsonb_build_object(
        'confidence', (random() * 100)::int,
        'source', CASE WHEN random() < 0.5 THEN 'profile_analysis' ELSE 'progress_trends' END,
        'action_required', random() < 0.3
    ) as metadata,
    NOW() - (random() * 14)::int * INTERVAL '1 day' -- Activity in the last two weeks
FROM learning_path_assignments
ORDER BY random()
LIMIT 50; -- Create 50 random agent activities

-- Step 9: Create some employee-user mappings
-- Note: In a real implementation, you would ensure these match actual auth.users
-- For testing, we'll use the employee IDs as user_ids too (simplified approach)
INSERT INTO employee_user_mapping (
    employee_id,
    user_id,
    created_at
)
SELECT 
    id as employee_id,
    id as user_id, -- In reality, this would be a different UUID from auth.users
    NOW() - (random() * 30)::int * INTERVAL '1 day'
FROM hr_employees
WHERE email LIKE '%test.learnfinity.com';

-- Clean up temp tables
DROP TABLE temp_learning_paths;
DROP TABLE temp_courses;

-- Final status message
DO $$
BEGIN
    RAISE NOTICE 'Test data population complete.';
    RAISE NOTICE 'Created: 25 employees, 9 learning paths, 20 courses, multiple assignments, enrollments, and agent activities.';
    RAISE NOTICE 'IMPORTANT: For complete testing, ensure you have corresponding auth.users with matching emails.';
END $$; 