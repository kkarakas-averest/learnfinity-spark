-- Fix script for consolidating RAG status columns
-- This script ensures consistent RAG status tracking across the HR system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, ensure hr_employees table has the correct RAG status columns
DO $$
BEGIN
    -- Drop any duplicate RAG status columns if they exist
    ALTER TABLE hr_employees 
    DROP COLUMN IF EXISTS rag_status,
    DROP COLUMN IF EXISTS status_justification,
    DROP COLUMN IF EXISTS status_updated_at,
    DROP COLUMN IF EXISTS status_history,
    DROP COLUMN IF EXISTS current_rag_status,
    DROP COLUMN IF EXISTS last_rag_update;

    -- Add the consolidated RAG status columns
    ALTER TABLE hr_employees 
    ADD COLUMN IF NOT EXISTS rag_status VARCHAR(10) DEFAULT 'green' 
        CHECK (rag_status IN ('green', 'amber', 'red')),
    ADD COLUMN IF NOT EXISTS rag_status_reason TEXT,
    ADD COLUMN IF NOT EXISTS rag_status_updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS rag_status_updated_by UUID;
END $$;

-- Ensure employee_rag_history table exists with correct structure
CREATE TABLE IF NOT EXISTS employee_rag_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('green', 'amber', 'red')),
    previous_status VARCHAR(10) CHECK (previous_status IN ('green', 'amber', 'red')),
    reason TEXT,
    related_intervention_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_history_employee_id ON employee_rag_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_rag_history_created_at ON employee_rag_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_history_status ON employee_rag_history(status);

-- Create trigger function to update rag_status_updated_at
CREATE OR REPLACE FUNCTION update_rag_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.rag_status_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rag_status updates
DROP TRIGGER IF EXISTS update_hr_employees_rag_status_timestamp ON hr_employees;
CREATE TRIGGER update_hr_employees_rag_status_timestamp
    BEFORE UPDATE OF rag_status ON hr_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_status_timestamp();

-- Insert initial RAG history records for existing employees
INSERT INTO employee_rag_history (employee_id, status, previous_status, reason, created_by)
SELECT 
    id AS employee_id,
    rag_status AS status,
    'green' AS previous_status,
    'Initial RAG status assessment' AS reason,
    gen_random_uuid() AS created_by
FROM hr_employees
WHERE NOT EXISTS (
    SELECT 1 FROM employee_rag_history 
    WHERE employee_rag_history.employee_id = hr_employees.id
); 