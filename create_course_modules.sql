-- Create course_modules table
CREATE TABLE IF NOT EXISTS course_modules (
  course_id UUID REFERENCES hr_courses(id),
  module_id TEXT PRIMARY KEY,
  title TEXT NOT NULL, 
  description TEXT,
  order_index INTEGER,
  is_personalized BOOLEAN DEFAULT false,
  created_for UUID
); 