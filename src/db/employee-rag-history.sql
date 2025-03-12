-- Create RAG status history table
CREATE TABLE IF NOT EXISTS employee_rag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('green', 'amber', 'red')),
  previous_status VARCHAR(10) CHECK (previous_status IN ('green', 'amber', 'red')),
  reason TEXT,
  related_intervention_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_rag_history_employee_id ON employee_rag_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_rag_history_created_at ON employee_rag_history(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_history_status ON employee_rag_history(status);

-- Insert sample data for RAG history
INSERT INTO employee_rag_history (employee_id, status, previous_status, reason, created_by)
SELECT 
  id AS employee_id,
  rag_status AS status,
  'green' AS previous_status,
  'Initial RAG status assessment' AS reason,
  gen_random_uuid() AS created_by
FROM hr_employees
WHERE NOT EXISTS (
  SELECT 1 FROM employee_rag_history WHERE employee_rag_history.employee_id = hr_employees.id
)
LIMIT 10; 