-- Interventions Schema for LearnFinity HR Dashboard
-- This file contains SQL DDL for intervention-related tables

-- Main interventions table - Stores all HR interventions
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'content_modification', 'resource_assignment', 'schedule_adjustment', 
    'mentor_assignment', 'feedback_request', 'custom'
  )),
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'pending', 'active', 'completed', 'cancelled'
  )),
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    'rag_status_change', 'progress_slowdown', 'low_engagement', 
    'poor_performance', 'employee_request', 'periodic_review', 'custom'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rag_status_at_creation VARCHAR(10) CHECK (rag_status_at_creation IN ('green', 'amber', 'red')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster access
CREATE INDEX IF NOT EXISTS idx_interventions_employee_id ON interventions(employee_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_due_date ON interventions(due_date);

-- Content modifications table - Stores content changes
CREATE TABLE IF NOT EXISTS content_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN (
    'module', 'quiz', 'video', 'document', 'other'
  )),
  original_content TEXT,
  modified_content TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource assignments table - Stores assigned resources
CREATE TABLE IF NOT EXISTS resource_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN (
    'document', 'video', 'course', 'quiz', 'other'
  )),
  resource_name VARCHAR(255) NOT NULL,
  resource_url TEXT NOT NULL,
  reason TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schedule adjustments table - Stores schedule changes
CREATE TABLE IF NOT EXISTS schedule_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
  original_due_date TIMESTAMP WITH TIME ZONE,
  new_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  affected_content_ids JSONB NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mentor assignments table - Stores mentor assignments
CREATE TABLE IF NOT EXISTS mentor_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_name VARCHAR(255) NOT NULL,
  session_count INTEGER DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  focus_areas JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback requests table - Stores feedback requests
CREATE TABLE IF NOT EXISTS feedback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID REFERENCES interventions(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN (
    'course', 'content', 'experience', 'progress', 'other'
  )),
  target_content_ids JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Intervention templates table - Stores reusable templates
CREATE TABLE IF NOT EXISTS intervention_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'content_modification', 'resource_assignment', 'schedule_adjustment', 
    'mentor_assignment', 'feedback_request', 'custom'
  )),
  reasons_for_use JSONB NOT NULL,
  content_template TEXT,
  required_resource_ids JSONB,
  suggested_mentor_ids JSONB,
  feedback_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policies for Interventions

-- Enable RLS on tables
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_templates ENABLE ROW LEVEL SECURITY;

-- Intervention policies
-- HR users can view all interventions
CREATE POLICY "HR users can view all interventions" 
  ON interventions FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

-- Employees can view their own interventions
CREATE POLICY "Employees can view their own interventions" 
  ON interventions FOR SELECT 
  USING (auth.uid() = employee_id);

-- Only HR can create and update interventions
CREATE POLICY "HR users can create interventions" 
  ON interventions FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "HR users can update interventions" 
  ON interventions FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

-- Similar policies for related tables
-- Content modifications
CREATE POLICY "HR users can manage content modifications" 
  ON content_modifications FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "Employees can view their content modifications" 
  ON content_modifications FOR SELECT 
  USING (auth.uid() IN (SELECT employee_id FROM interventions WHERE id = intervention_id));

-- Resource assignments
CREATE POLICY "HR users can manage resource assignments" 
  ON resource_assignments FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "Employees can view their resource assignments" 
  ON resource_assignments FOR SELECT 
  USING (auth.uid() IN (SELECT employee_id FROM interventions WHERE id = intervention_id));

-- Schedule adjustments
CREATE POLICY "HR users can manage schedule adjustments" 
  ON schedule_adjustments FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "Employees can view their schedule adjustments" 
  ON schedule_adjustments FOR SELECT 
  USING (auth.uid() IN (SELECT employee_id FROM interventions WHERE id = intervention_id));

-- Mentor assignments
CREATE POLICY "HR users can manage mentor assignments" 
  ON mentor_assignments FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "Employees can view their mentor assignments" 
  ON mentor_assignments FOR SELECT 
  USING (auth.uid() IN (SELECT employee_id FROM interventions WHERE id = intervention_id));

CREATE POLICY "Mentors can view their assignments" 
  ON mentor_assignments FOR SELECT 
  USING (auth.uid() = mentor_id);

-- Feedback requests
CREATE POLICY "HR users can manage feedback requests" 
  ON feedback_requests FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "Employees can view their feedback requests" 
  ON feedback_requests FOR SELECT 
  USING (auth.uid() IN (SELECT employee_id FROM interventions WHERE id = intervention_id));

-- Intervention templates
CREATE POLICY "HR users can manage intervention templates" 
  ON intervention_templates FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'superadmin')));

CREATE POLICY "All users can view active intervention templates" 
  ON intervention_templates FOR SELECT 
  USING (is_active = TRUE);

-- Sample intervention templates
INSERT INTO intervention_templates (
  name, 
  description, 
  type, 
  reasons_for_use, 
  content_template, 
  feedback_questions
)
VALUES
  (
    'Performance Improvement Plan',
    'A structured plan for employees who are struggling with course completion',
    'content_modification',
    '["poor_performance", "progress_slowdown"]',
    'We have noticed that you are having some difficulty with the course material. This personalized plan is designed to help you overcome these challenges.',
    '["What specific challenges are you facing with the current content?", "What learning style works best for you?", "Is there anything specific we can do to better support your learning?"]'
  ),
  (
    'Additional Resources Package',
    'Supplementary materials for employees who need more context',
    'resource_assignment',
    '["low_engagement", "poor_performance"]',
    'To help you better understand the concepts, we have assigned these additional resources.',
    '["Did you find these additional resources helpful?", "Which format of materials do you prefer?"]'
  ),
  (
    'Deadline Extension',
    'Extended timeline for course completion',
    'schedule_adjustment',
    '["progress_slowdown", "employee_request"]',
    'We have adjusted your deadline to provide more time for completion.',
    '["Is the new timeline more manageable for you?", "What factors were impacting your ability to meet the original deadline?"]'
  ),
  (
    'Mentor Support Program',
    'One-on-one guidance with an experienced mentor',
    'mentor_assignment',
    '["rag_status_change", "poor_performance"]',
    'To provide additional support, we have assigned a mentor who will guide you through the challenging aspects of this course.',
    '["How helpful were the mentoring sessions?", "What specific areas did the mentor help you with?"]'
  ),
  (
    'Learning Experience Feedback',
    'Detailed feedback request to improve course content',
    'feedback_request',
    '["periodic_review"]',
    'We value your input on the learning experience. Please provide detailed feedback to help us improve.',
    '["How would you rate the overall quality of the course materials?", "Were the learning objectives clear?", "What aspects of the course could be improved?", "What did you find most valuable about the course?"]'
  )
ON CONFLICT DO NOTHING; 