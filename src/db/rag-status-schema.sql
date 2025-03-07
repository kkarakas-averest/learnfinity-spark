-- RAG Status History Schema
-- This file contains SQL DDL for RAG status history tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create RAG status history table
CREATE TABLE IF NOT EXISTS employee_rag_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('green', 'amber', 'red')),
  previous_status VARCHAR(10) CHECK (previous_status IN ('green', 'amber', 'red')),
  reason TEXT,
  related_intervention_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  -- Add foreign key relationship to employees table
  CONSTRAINT fk_employee
    FOREIGN KEY(employee_id)
    REFERENCES hr_employees(id)
    ON DELETE CASCADE,
    
  -- Add foreign key relationship to interventions table (if exists)
  CONSTRAINT fk_intervention
    FOREIGN KEY(related_intervention_id)
    REFERENCES interventions(id)
    ON DELETE SET NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_rag_history_employee_id ON employee_rag_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_rag_history_created_at ON employee_rag_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_history_status ON employee_rag_history(status);

-- Add current_rag_status and last_rag_update columns to employees table if they don't exist
DO $$
BEGIN
    -- Check if the columns already exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees' AND column_name = 'current_rag_status'
    ) THEN
        -- Add current_rag_status column
        ALTER TABLE hr_employees 
        ADD COLUMN current_rag_status VARCHAR(10) DEFAULT 'green' 
        CHECK (current_rag_status IN ('green', 'amber', 'red'));
        
        RAISE NOTICE 'Added current_rag_status column to hr_employees table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees' AND column_name = 'last_rag_update'
    ) THEN
        -- Add last_rag_update column
        ALTER TABLE hr_employees 
        ADD COLUMN last_rag_update TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE 'Added last_rag_update column to hr_employees table';
    END IF;
END $$;

-- Enable RLS on the RAG history table
ALTER TABLE employee_rag_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for RAG history
CREATE POLICY "HR can read all RAG history" 
  ON employee_rag_history 
  FOR SELECT 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('hr', 'superadmin'));

CREATE POLICY "HR can insert RAG history" 
  ON employee_rag_history 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'role' IN ('hr', 'superadmin'));

CREATE POLICY "HR can update RAG history" 
  ON employee_rag_history 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('hr', 'superadmin'));

-- Create a trigger function to update employee status when a new history entry is added
CREATE OR REPLACE FUNCTION update_employee_rag_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the employee's current RAG status and last update timestamp
  UPDATE hr_employees
  SET 
    current_rag_status = NEW.status,
    last_rag_update = NEW.created_at
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function after an insert
DROP TRIGGER IF EXISTS trigger_update_employee_rag_status ON employee_rag_history;
CREATE TRIGGER trigger_update_employee_rag_status
  AFTER INSERT ON employee_rag_history
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_rag_status();

-- Insert sample data for testing (only if the table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM employee_rag_history LIMIT 1) THEN
    -- Insert sample entries only if there are employees
    IF EXISTS (SELECT 1 FROM hr_employees LIMIT 1) THEN
      -- Get first three employee IDs for sample data
      WITH emp_ids AS (
        SELECT id FROM hr_employees LIMIT 3
      )
      INSERT INTO employee_rag_history 
        (employee_id, status, previous_status, reason, created_by, created_at)
      SELECT
        id,
        CASE 
          WHEN random() < 0.3 THEN 'red'
          WHEN random() < 0.6 THEN 'amber'
          ELSE 'green'
        END AS status,
        'green' AS previous_status,
        'Initial RAG status assessment' AS reason,
        id AS created_by, -- Self-assigned for demo
        NOW() - (random() * INTERVAL '30 days') AS created_at
      FROM emp_ids
      WHERE NOT EXISTS (
        -- Only insert if this employee doesn't already have a history entry
        SELECT 1 FROM employee_rag_history WHERE employee_id = emp_ids.id
      );
      
      RAISE NOTICE 'Inserted sample RAG history data for testing';
    END IF;
  END IF;
END $$; 