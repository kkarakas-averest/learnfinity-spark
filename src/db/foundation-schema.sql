-- LearnFinity Foundation Data Structure Schema
-- This file contains the complete schema definition for the core data structures
-- including learners, courses, assessments, and agent state

------------------------
-- EMPLOYEE/LEARNER DATA
------------------------

-- Employee table (if not already existing)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(100),
  department VARCHAR(100),
  profile_image_url VARCHAR(255),
  rag_status VARCHAR(10) DEFAULT 'green' CHECK (rag_status IN ('green', 'amber', 'red')),
  rag_status_last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  hire_date TIMESTAMP WITH TIME ZONE,
  employee_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning preferences
CREATE TABLE IF NOT EXISTS learning_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  primary_style VARCHAR(20) CHECK (primary_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  secondary_styles JSONB, -- Array of learning styles
  preferred_content_formats JSONB, -- Array of formats (video, text, audio, etc.)
  preferred_session_duration INTEGER, -- in minutes
  preferred_learning_times JSONB, -- Array of preferred times
  preferred_device VARCHAR(20) CHECK (preferred_device IN ('desktop', 'laptop', 'tablet', 'mobile')),
  self_reported BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id)
);

-- Learning metadata (analytics)
CREATE TABLE IF NOT EXISTS learning_metadata (
  employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  average_session_duration INTEGER, -- in minutes
  most_active_time_of_day VARCHAR(20),
  most_used_device VARCHAR(20),
  completion_rate NUMERIC(4,3), -- 0-1 scale
  average_quiz_score NUMERIC(5,2), -- 0-100 scale
  engagement_score NUMERIC(3,1), -- 0-10 scale
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Skills inventory
CREATE TABLE IF NOT EXISTS skill_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  proficiency_score NUMERIC(4,3), -- 0-1 scale
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  last_demonstrated TIMESTAMP WITH TIME ZONE,
  associated_courses JSONB, -- Array of course IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Career goals
CREATE TABLE IF NOT EXISTS career_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE,
  related_skills JSONB, -- Array of skill names
  required_courses JSONB, -- Array of course IDs
  progress NUMERIC(4,3), -- 0-1 scale
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'deferred')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning history
CREATE TABLE IF NOT EXISTS learning_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('course_started', 'module_completed', 'assessment_taken', 'skill_gained', 'intervention_received')),
  related_item_id UUID,
  related_item_name VARCHAR(255),
  completion_status VARCHAR(20) CHECK (completion_status IN ('completed', 'failed', 'in_progress')),
  score NUMERIC(5,2),
  time_spent INTEGER, -- in minutes
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course completion records
CREATE TABLE IF NOT EXISTS course_completion_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  course_id UUID,
  course_name VARCHAR(255) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER, -- in minutes
  average_score NUMERIC(5,2), -- 0-100 scale
  certificate_id UUID,
  feedback TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

------------------------
-- COURSE CONTENT
------------------------

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  thumbnail VARCHAR(255),
  banner_image VARCHAR(255),
  skills_gained JSONB, -- Array of skill names
  level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  category VARCHAR(100),
  tags JSONB, -- Array of tags
  estimated_duration INTEGER, -- in minutes
  is_published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modules
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT TRUE,
  prerequisite_module_ids JSONB, -- Array of module IDs
  unlock_criteria JSONB, -- JSON with criteria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'text', 'audio', 'interactive', 'quiz', 'assessment', 'discussion', 'exercise', 'project')),
  content TEXT,
  order_index INTEGER NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content metadata
CREATE TABLE IF NOT EXISTS content_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('course', 'module', 'section')),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_duration INTEGER, -- in minutes
  keywords JSONB, -- Array of keywords
  skills JSONB, -- Array of skill names
  prerequisites JSONB, -- Array of content IDs
  last_updated TIMESTAMP WITH TIME ZONE,
  version VARCHAR(20),
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content variants (for adaptive learning)
CREATE TABLE IF NOT EXISTS content_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_content_id UUID NOT NULL,
  target_learning_style VARCHAR(20) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'text', 'audio', 'interactive', 'quiz', 'assessment', 'discussion', 'exercise', 'project')),
  content TEXT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prerequisite relationships
CREATE TABLE IF NOT EXISTS prerequisite_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('course', 'module', 'section')),
  target_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('course', 'module', 'section', 'skill')),
  is_required BOOLEAN DEFAULT TRUE,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course templates
CREATE TABLE IF NOT EXISTS course_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  structure JSONB NOT NULL, -- Module structure and defaults
  default_duration INTEGER, -- in minutes
  target_skill_level VARCHAR(20) CHECK (target_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  target_audience JSONB, -- Array of audience descriptors
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course metrics
CREATE TABLE IF NOT EXISTS course_metrics (
  course_id UUID PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(4,3) DEFAULT 0, -- 0-1 scale
  average_rating NUMERIC(3,2) DEFAULT 0, -- 1-5 scale
  review_count INTEGER DEFAULT 0,
  average_time_to_complete INTEGER DEFAULT 0, -- in days
  top_feedback_keywords JSONB, -- Array of keywords
  completions_by_department JSONB, -- JSON mapping departments to counts
  average_quiz_scores JSONB, -- JSON mapping module IDs to scores
  most_challenging JSONB, -- Info about most challenging module
  dropped_off_at JSONB, -- JSON mapping module IDs to counts
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

------------------------
-- ASSESSMENT FRAMEWORK
------------------------

-- Question bank
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'multiple_select', 'short_answer', 'long_answer', 'true_false', 'matching', 'ordering', 'fill_blank', 'code_entry', 'file_upload')),
  text TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  skills JSONB, -- Array of skill names
  explanation TEXT,
  hint TEXT,
  tags JSONB, -- Array of tags
  content JSONB NOT NULL, -- Question-specific data (options, correct answers, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('quiz', 'exam', 'practice', 'pre_assessment', 'post_assessment', 'certification', 'self_assessment')),
  questions JSONB NOT NULL, -- Array of question IDs
  total_points INTEGER NOT NULL,
  time_limit INTEGER, -- in minutes
  randomize_questions BOOLEAN DEFAULT FALSE,
  questions_per_attempt INTEGER,
  grading_criteria JSONB NOT NULL, -- Includes passing score, attempts, etc.
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  section_id UUID,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- Array of question responses
  score NUMERIC(5,2),
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by VARCHAR(255), -- "auto" or user ID
  time_spent INTEGER, -- in seconds
  feedback TEXT,
  attempt_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment results (for analytics)
CREATE TABLE IF NOT EXISTS assessment_results (
  assessment_id UUID PRIMARY KEY REFERENCES assessments(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  pass_rate NUMERIC(4,3) DEFAULT 0, -- 0-1 scale
  average_score NUMERIC(5,2) DEFAULT 0, -- 0-100 scale
  average_time_spent INTEGER DEFAULT 0, -- in seconds
  most_missed_questions JSONB, -- Array of most frequently missed question IDs
  score_distribution JSONB, -- Histogram-like data structure
  attempts_per_user JSONB, -- JSON mapping user IDs to attempt counts
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

------------------------
-- AGENT SYSTEM STATE
------------------------

-- Agent state persistence
CREATE TABLE IF NOT EXISTS agent_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(100) NOT NULL,
  agent_type VARCHAR(50) NOT NULL, -- manager, personalization, content_creator, feedback, rag, reporting
  memory JSONB DEFAULT '{}',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id)
);

-- Agent decision records
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(100) NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  context JSONB NOT NULL, -- Input context
  reasoning TEXT, -- Agent's reasoning process
  decision JSONB NOT NULL, -- Final decision made
  confidence NUMERIC(4,3), -- 0-1 scale
  execution_time INTEGER, -- in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent communication
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id VARCHAR(100) NOT NULL,
  recipient_id VARCHAR(100) NOT NULL,
  message_type VARCHAR(100) NOT NULL,
  content JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  agent_id VARCHAR(100) PRIMARY KEY,
  requests_processed INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0, -- in milliseconds
  success_rate NUMERIC(4,3) DEFAULT 1, -- 0-1 scale
  error_count INTEGER DEFAULT 0,
  metrics_by_task_type JSONB, -- JSON mapping task types to metrics
  last_error JSONB, -- Details of last error
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

------------------------
-- ORGANIZATION STRUCTURE
------------------------

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  head_employee_id UUID REFERENCES employees(id),
  parent_department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_lead_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(100),
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, employee_id)
);

------------------------
-- INDEXES FOR PERFORMANCE
------------------------

-- Employees and learning
CREATE INDEX IF NOT EXISTS idx_employee_rag_status ON employees(rag_status);
CREATE INDEX IF NOT EXISTS idx_learning_history_employee ON learning_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_activity_type ON learning_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_skill_records_employee ON skill_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_skill_records_skill_name ON skill_records(skill_name);
CREATE INDEX IF NOT EXISTS idx_career_goals_employee ON career_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON career_goals(status);

-- Courses and content
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_module ON sections(module_id);
CREATE INDEX IF NOT EXISTS idx_sections_content_type ON sections(content_type);

-- Assessments
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_module ON assessments(module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agent_states_type ON agent_states(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON agent_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_processed ON agent_messages(processed);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee ON team_members(employee_id);

------------------------
-- ROW LEVEL SECURITY POLICIES
------------------------

-- Enable RLS on tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Basic policies (to be expanded based on application requirements)
-- HR users can see all employee data
CREATE POLICY "HR can view all employee data" 
  ON employees FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'hr' OR auth.jwt() ->> 'role' = 'superadmin');

-- Users can view their own data
CREATE POLICY "Users can view their own data" 
  ON employees FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only see their own learning preferences
CREATE POLICY "Users can view their own learning preferences" 
  ON learning_preferences FOR SELECT 
  USING (EXISTS (SELECT 1 FROM employees WHERE employees.id = learning_preferences.employee_id AND employees.user_id = auth.uid()));

-- HR and superadmins can view all learning preferences
CREATE POLICY "HR can view all learning preferences" 
  ON learning_preferences FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'hr' OR auth.jwt() ->> 'role' = 'superadmin');

-- Similar policies would be created for other tables
