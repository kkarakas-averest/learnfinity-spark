-- Fix script for RAG status table references
-- This script addresses the error with "employees" table not existing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First check if the table exists with correct name
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
        RAISE EXCEPTION 'Neither hr_employees nor employees table found. Please create the employees table before adding RAG status columns.';
    END IF;
END $$; 