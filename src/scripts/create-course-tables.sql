-- Script to create course content tables
-- Run this in the Supabase SQL Editor

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create course_modules table
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration INTEGER, -- in minutes
  content_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create module_sections table
CREATE TABLE IF NOT EXISTS public.module_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  order_index INTEGER NOT NULL DEFAULT 0,
  duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create course_resources table
CREATE TABLE IF NOT EXISTS public.course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  type TEXT DEFAULT 'file',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create content_completions table
CREATE TABLE IF NOT EXISTS public.content_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'module' or 'section'
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
-- Allow all authenticated users to view course content
CREATE POLICY "Allow select for authenticated users" ON public.course_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated users" ON public.module_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated users" ON public.course_resources
  FOR SELECT TO authenticated USING (true);

-- For content_completions, users should only be able to access their own records
CREATE POLICY "Allow select for own records" ON public.content_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for own records" ON public.content_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update for own records" ON public.content_completions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Now let's create a trigger to update the updated_at field
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_module_sections_updated_at BEFORE UPDATE ON public.module_sections
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_course_resources_updated_at BEFORE UPDATE ON public.course_resources
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_content_completions_updated_at BEFORE UPDATE ON public.content_completions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_sections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_resources TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_completions TO service_role;

GRANT SELECT ON public.course_modules TO anon, authenticated;
GRANT SELECT ON public.module_sections TO anon, authenticated;
GRANT SELECT ON public.course_resources TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.content_completions TO authenticated; 