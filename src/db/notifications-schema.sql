-- Notifications Schema for LearnFinity Application
-- This file contains SQL DDL for notification-related tables

-- Notifications table - Stores all user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'alert', 'course_update', 'rag_status_change', 'intervention',
    'assignment', 'deadline', 'feedback_request', 'system'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  action_link VARCHAR(255),
  action_text VARCHAR(50),
  related_entity_id VARCHAR(255),
  related_entity_type VARCHAR(50),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on recipient_id and is_read for fast access
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Notification preferences table - Stores user notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Types of notifications to receive
  alerts_enabled BOOLEAN DEFAULT TRUE,
  course_update_enabled BOOLEAN DEFAULT TRUE,
  rag_status_change_enabled BOOLEAN DEFAULT TRUE,
  intervention_enabled BOOLEAN DEFAULT TRUE,
  assignment_enabled BOOLEAN DEFAULT TRUE,
  deadline_enabled BOOLEAN DEFAULT TRUE,
  feedback_request_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  
  -- Minimum priority level to receive
  minimum_priority VARCHAR(20) DEFAULT 'low' CHECK (minimum_priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start VARCHAR(5),  -- Format: HH:MM (24h)
  quiet_hours_end VARCHAR(5),    -- Format: HH:MM (24h)
  
  -- Scheduled digest
  digest_enabled BOOLEAN DEFAULT FALSE,
  digest_frequency VARCHAR(10) CHECK (digest_frequency IN ('daily', 'weekly')),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates table - Stores templates for generating consistent notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'alert', 'course_update', 'rag_status_change', 'intervention',
    'assignment', 'deadline', 'feedback_request', 'system'
  )),
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  default_priority VARCHAR(20) NOT NULL CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  action_link_template TEXT,
  action_text_template VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies for Notifications

-- Enable RLS on tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notification policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = recipient_id OR recipient_id IS NULL);

-- Only system or the sender can insert notifications
CREATE POLICY "System and senders can create notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE role IN ('hr', 'mentor', 'superadmin')));

-- Only the recipient can mark notifications as read
CREATE POLICY "Recipients can update their notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (
    -- Only allow updating the is_read field
    (OLD.is_read IS DISTINCT FROM NEW.is_read AND 
     OLD.title = NEW.title AND 
     OLD.message = NEW.message AND
     OLD.recipient_id = NEW.recipient_id)
  );

-- Notification preference policies
-- Users can only see their own preferences
CREATE POLICY "Users can view their own notification preferences" 
  ON notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update their own notification preferences" 
  ON notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences" 
  ON notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Notification template policies
-- Anyone can view active templates
CREATE POLICY "Anyone can view active notification templates" 
  ON notification_templates FOR SELECT 
  USING (is_active = TRUE);

-- Only admins can manage templates
CREATE POLICY "Only admins can manage notification templates" 
  ON notification_templates FOR ALL 
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'superadmin'));

-- Sample notification templates
INSERT INTO notification_templates (type, title_template, message_template, default_priority, action_link_template, action_text_template)
VALUES
  (
    'rag_status_change',
    '{{employee_name}} status changed to {{new_status}}',
    'The RAG status for {{employee_name}} has changed from {{old_status}} to {{new_status}}. {{justification}}',
    'high',
    '/hr-dashboard/employees/{{employee_id}}/profile',
    'View Profile'
  ),
  (
    'intervention',
    'Intervention required for {{employee_name}}',
    'An intervention has been recommended for {{employee_name}} due to {{reason}}.',
    'high',
    '/hr-dashboard/interventions/{{intervention_id}}',
    'Take Action'
  ),
  (
    'assignment',
    'New course assigned: {{course_name}}',
    'You have been assigned a new course: {{course_name}}. Please complete it by {{deadline}}.',
    'medium',
    '/learner-dashboard/courses/{{course_id}}',
    'Start Course'
  ),
  (
    'deadline',
    'Upcoming deadline: {{course_name}}',
    'The deadline for completing "{{course_name}}" is approaching. Please complete it by {{deadline}}.',
    'high',
    '/learner-dashboard/courses/{{course_id}}',
    'Continue Course'
  ),
  (
    'feedback_request',
    'Feedback requested for {{course_name}}',
    'Please provide feedback for the course "{{course_name}}" that you recently completed.',
    'low',
    '/learner-dashboard/feedback/{{course_id}}',
    'Provide Feedback'
  )
ON CONFLICT DO NOTHING; 