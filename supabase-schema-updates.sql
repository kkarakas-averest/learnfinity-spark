-- RAG Status Tracking for employees
ALTER TABLE hr_employees 
ADD COLUMN IF NOT EXISTS rag_status VARCHAR(10) DEFAULT 'green' CHECK (rag_status IN ('green', 'amber', 'red')),
ADD COLUMN IF NOT EXISTS status_justification TEXT,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES auth.users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  action_link VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id),
  created_by UUID REFERENCES auth.users(id),
  intervention_type VARCHAR(50) NOT NULL CHECK (intervention_type IN ('content_modification', 'remedial_assignment', 'notification', 'other')),
  notes TEXT,
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for quick employee lookups
CREATE INDEX IF NOT EXISTS idx_interventions_employee_id ON interventions(employee_id); 