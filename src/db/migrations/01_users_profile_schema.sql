-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'learner',
  department TEXT,
  position TEXT,
  learning_style TEXT,
  experience_level TEXT DEFAULT 'beginner',
  skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  completed_courses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a trigger to ensure updated_at is updated
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for user_profiles
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own profile
DROP POLICY IF EXISTS policy_select_own_profile ON user_profiles;
CREATE POLICY policy_select_own_profile ON user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS policy_update_own_profile ON user_profiles;
CREATE POLICY policy_update_own_profile ON user_profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for service role to manage all profiles
DROP POLICY IF EXISTS policy_service_manage_profiles ON user_profiles;
CREATE POLICY policy_service_manage_profiles ON user_profiles
  USING (auth.role() = 'service_role');

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing users who don't have profiles
INSERT INTO public.user_profiles (id, name, email, role)
SELECT 
  au.id, 
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'learner') as role
FROM 
  auth.users au
LEFT JOIN 
  public.user_profiles up ON au.id = up.id
WHERE 
  up.id IS NULL; 