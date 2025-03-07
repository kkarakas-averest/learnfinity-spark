-- Fix script for due_date column error

-- Create extension for UUID if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if interventions table exists and create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'interventions') THEN
    -- Create interventions table
    CREATE TABLE interventions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      reason VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by UUID NOT NULL,
      rag_status_at_creation VARCHAR(10),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );
    
    RAISE NOTICE 'Created interventions table';
  ELSE
    RAISE NOTICE 'Interventions table already exists';
  END IF;
END $$;

-- Then, check if due_date column exists and add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interventions' AND column_name = 'due_date'
  ) THEN
    -- Add due_date column
    ALTER TABLE interventions ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Added due_date column to interventions table';
  ELSE
    RAISE NOTICE 'due_date column already exists';
  END IF;
END $$;

-- Fix index if needed
DO $$
BEGIN
  -- Drop the index if it exists
  DROP INDEX IF EXISTS idx_interventions_due_date;
  
  -- Create the index
  CREATE INDEX idx_interventions_due_date ON interventions(due_date);
  
  RAISE NOTICE 'Recreated index on due_date column';
END $$; 