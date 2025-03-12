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

-- Populate HR employees table with test data
INSERT INTO hr_employees (id, name, email, status, company_id, created_at, updated_at, rag_status, current_rag_status, last_rag_update)
VALUES 
  (uuid_generate_v4(), 'John Doe', 'john.doe@example.com', 'active', '4fb1a692-3995-40ee-8aa5-292fd8ebf029', NOW(), NOW(), 'green', 'green', NOW()),
  (uuid_generate_v4(), 'Jane Smith', 'jane.smith@example.com', 'active', '4fb1a692-3995-40ee-8aa5-292fd8ebf029', NOW(), NOW(), 'green', 'green', NOW());

-- Test notice
RAISE NOTICE 'Test data population complete!'; 