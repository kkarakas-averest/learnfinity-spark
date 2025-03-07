-- RAG Status History Schema for LearnFinity HR Dashboard
-- This file contains SQL DDL for RAG status history tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First check if the employees table exists with correct name and add RAG status columns
DO $$
BEGIN
    -- Check if hr_employees table exists
    IF EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'hr_employees'
    ) THEN
        RAISE NOTICE 'Using hr_employees table for RAG status columns';
        
        -- Add RAG status columns to hr_employees if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'hr_employees' AND column_name = 'current_rag_status'
        ) THEN
            ALTER TABLE hr_employees 
            ADD COLUMN current_rag_status VARCHAR(10) DEFAULT 'green' 
            CHECK (current_rag_status IN ('green', 'amber', 'red'));
            
            RAISE NOTICE 'Added current_rag_status column to hr_employees table';
        ELSE
            RAISE NOTICE 'current_rag_status column already exists in hr_employees table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'hr_employees' AND column_name = 'last_rag_update'
        ) THEN
            ALTER TABLE hr_employees 
            ADD COLUMN last_rag_update TIMESTAMPTZ DEFAULT NOW();
            
            RAISE NOTICE 'Added last_rag_update column to hr_employees table';
        ELSE
            RAISE NOTICE 'last_rag_update column already exists in hr_employees table';
        END IF;
    -- Check if just "employees" table exists (legacy reference)
    ELSIF EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'employees'
    ) THEN
        RAISE NOTICE 'Using employees table for RAG status columns (legacy)';
        
        -- Add RAG status columns to employees if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'current_rag_status'
        ) THEN
            ALTER TABLE employees 
            ADD COLUMN current_rag_status VARCHAR(10) DEFAULT 'green' 
            CHECK (current_rag_status IN ('green', 'amber', 'red'));
            
            RAISE NOTICE 'Added current_rag_status column to employees table';
        ELSE
            RAISE NOTICE 'current_rag_status column already exists in employees table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'last_rag_update'
        ) THEN
            ALTER TABLE employees 
            ADD COLUMN last_rag_update TIMESTAMPTZ DEFAULT NOW();
            
            RAISE NOTICE 'Added last_rag_update column to employees table';
        ELSE
            RAISE NOTICE 'last_rag_update column already exists in employees table';
        END IF;
    ELSE
        RAISE WARNING 'Neither hr_employees nor employees table found. Proceeding with RAG history table creation, but employee columns will be added later.';
    END IF;
END $$;

-- Create RAG status history table
CREATE TABLE IF NOT EXISTS employee_rag_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('green', 'amber', 'red')),
  previous_status VARCHAR(10) CHECK (previous_status IN ('green', 'amber', 'red')),
  reason TEXT,
  related_intervention_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Add foreign key constraints safely by checking if the referenced tables exist
DO $$
BEGIN
    -- Add foreign key to hr_employees if that table exists
    IF EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'hr_employees'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_employee' 
            AND table_name = 'employee_rag_history'
        ) THEN
            ALTER TABLE employee_rag_history
            ADD CONSTRAINT fk_employee
            FOREIGN KEY (employee_id)
            REFERENCES hr_employees(id)
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Added foreign key constraint to hr_employees table';
        END IF;
    -- Add foreign key to employees if that table exists instead
    ELSIF EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'employees'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_employee' 
            AND table_name = 'employee_rag_history'
        ) THEN
            ALTER TABLE employee_rag_history
            ADD CONSTRAINT fk_employee
            FOREIGN KEY (employee_id)
            REFERENCES employees(id)
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Added foreign key constraint to employees table';
        END IF;
    ELSE
        RAISE WARNING 'Cannot add foreign key constraint as neither hr_employees nor employees table exists';
    END IF;
    
    -- Add foreign key to interventions if that table exists
    IF EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'interventions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_intervention' 
            AND table_name = 'employee_rag_history'
        ) THEN
            ALTER TABLE employee_rag_history
            ADD CONSTRAINT fk_intervention
            FOREIGN KEY (related_intervention_id)
            REFERENCES interventions(id)
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Added foreign key constraint to interventions table';
        END IF;
    ELSE
        RAISE NOTICE 'Interventions table does not exist yet, skipping foreign key constraint';
    END IF;
END $$;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_rag_history_employee_id ON employee_rag_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_rag_history_created_at ON employee_rag_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_history_status ON employee_rag_history(status);

-- Enable RLS on the RAG history table
ALTER TABLE employee_rag_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for RAG history
DO $$
BEGIN
    -- Drop existing policies first to avoid conflicts
    DROP POLICY IF EXISTS "HR can read all RAG history" ON employee_rag_history;
    DROP POLICY IF EXISTS "HR can insert RAG history" ON employee_rag_history;
    DROP POLICY IF EXISTS "HR can update RAG history" ON employee_rag_history;
    
    -- Create new policies
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
      
    RAISE NOTICE 'Created or updated RLS policies for employee_rag_history table';
END $$;

-- Create a trigger function to update employee status when a new history entry is added
CREATE OR REPLACE FUNCTION update_employee_rag_status()
RETURNS TRIGGER AS $$
DECLARE
    employee_table_name TEXT;
BEGIN
    -- Determine which table to update
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'hr_employees') THEN
        employee_table_name := 'hr_employees';
    ELSIF EXISTS (SELECT FROM pg_tables WHERE tablename = 'employees') THEN
        employee_table_name := 'employees';
    ELSE
        RAISE WARNING 'Cannot update employee RAG status - no employees table found';
        RETURN NEW;
    END IF;
    
    -- Dynamic SQL to update the appropriate table
    EXECUTE format('
        UPDATE %I
        SET 
            current_rag_status = $1,
            last_rag_update = $2
        WHERE id = $3
    ', employee_table_name)
    USING NEW.status, NEW.created_at, NEW.employee_id;
    
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
DECLARE
    employee_table_name TEXT;
    employee_count INTEGER;
    emp_id UUID;
BEGIN
    -- Determine which employee table to use
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'hr_employees') THEN
        employee_table_name := 'hr_employees';
    ELSIF EXISTS (SELECT FROM pg_tables WHERE tablename = 'employees') THEN
        employee_table_name := 'employees';
    ELSE
        RAISE NOTICE 'Cannot insert sample data - no employees table found';
        RETURN;
    END IF;
    
    -- Only insert sample data if the RAG history table is empty
    IF NOT EXISTS (SELECT 1 FROM employee_rag_history LIMIT 1) THEN
        -- Check if there are any employees to use
        EXECUTE format('SELECT COUNT(*) FROM %I', employee_table_name) INTO employee_count;
        
        IF employee_count > 0 THEN
            -- Get up to 3 employee IDs for sample data
            FOR emp_id IN 
                EXECUTE format('SELECT id FROM %I LIMIT 3', employee_table_name)
            LOOP
                -- Only insert if this employee doesn't already have a history entry
                IF NOT EXISTS (SELECT 1 FROM employee_rag_history WHERE employee_id = emp_id) THEN
                    -- Insert a random status for this employee
                    INSERT INTO employee_rag_history 
                      (employee_id, status, previous_status, reason, created_by, created_at)
                    VALUES (
                      emp_id,
                      (CASE 
                        WHEN random() < 0.3 THEN 'red'
                        WHEN random() < 0.6 THEN 'amber'
                        ELSE 'green'
                      END),
                      'green',
                      'Initial RAG status assessment',
                      emp_id, -- Self-assigned for demo
                      NOW() - (random() * INTERVAL '30 days')
                    );
                END IF;
            END LOOP;
            
            RAISE NOTICE 'Inserted sample RAG history data for testing';
        ELSE
            RAISE NOTICE 'No employees found for sample data';
        END IF;
    ELSE
        RAISE NOTICE 'RAG history table already contains data, skipping sample data insertion';
    END IF;
END $$; 