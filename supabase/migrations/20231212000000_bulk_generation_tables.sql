-- Create bulk generation jobs table
CREATE TABLE IF NOT EXISTS ai_bulk_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id VARCHAR(100) NOT NULL,
  group_type VARCHAR(50) NOT NULL CHECK (group_type IN ('department', 'position')),
  base_title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Create bulk generation tasks table
CREATE TABLE IF NOT EXISTS ai_bulk_generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES ai_bulk_generation_jobs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  content_id UUID REFERENCES ai_course_content(id) ON DELETE SET NULL,
  course_id UUID REFERENCES hr_courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulk_generation_jobs_status ON ai_bulk_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_generation_jobs_group ON ai_bulk_generation_jobs(group_type, group_id);
CREATE INDEX IF NOT EXISTS idx_bulk_generation_tasks_job_id ON ai_bulk_generation_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_bulk_generation_tasks_employee_id ON ai_bulk_generation_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_bulk_generation_tasks_status ON ai_bulk_generation_tasks(status);

-- Add RLS policies for access control
ALTER TABLE ai_bulk_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_bulk_generation_tasks ENABLE ROW LEVEL SECURITY;

-- HR users can access all bulk generation jobs and tasks
CREATE POLICY hr_access_bulk_jobs ON ai_bulk_generation_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr');

CREATE POLICY hr_access_bulk_tasks ON ai_bulk_generation_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'hr'); 