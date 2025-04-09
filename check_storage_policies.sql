-- Check existing storage buckets
SELECT * FROM storage.buckets;

-- Check bucket policies
SELECT * FROM storage.policies;

-- Check storage.objects permissions
SELECT obj_id, name, owner, bucket_id, created_at, updated_at, path_tokens 
FROM storage.objects 
LIMIT 10;

-- Check current RLS policies for 'employee-files' bucket
SELECT *
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check for owner policy (who can manage buckets)
SELECT *
FROM storage.policies
WHERE name LIKE '%bucket%owner%';

-- SQL to enable authenticated users to access employee-files bucket
-- Run this to create a bucket policy to fix the issue:
BEGIN;

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-files', 'employee-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create policy for authenticated users to create objects
INSERT INTO storage.policies (name, definition, owner, bucket_id)
VALUES (
  'Employee Files Storage - Upload Policy',
  'CREATE OR REPLACE POLICY "Employee Files Upload Policy" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
      bucket_id = ''employee-files''
    )',
  'authenticated',
  'employee-files'
) ON CONFLICT DO NOTHING;

-- 3. Create policy for authenticated users to read objects
INSERT INTO storage.policies (name, definition, owner, bucket_id)
VALUES (
  'Employee Files Storage - Read Policy', 
  'CREATE OR REPLACE POLICY "Employee Files Read Policy" ON storage.objects
    FOR SELECT TO authenticated USING (
      bucket_id = ''employee-files''
    )',
  'authenticated',
  'employee-files'
) ON CONFLICT DO NOTHING;

-- 4. Create policy for anyone to read objects (for public URLs)
INSERT INTO storage.policies (name, definition, owner, bucket_id)
VALUES (
  'Employee Files Storage - Public Read Policy', 
  'CREATE OR REPLACE POLICY "Employee Files Public Read Policy" ON storage.objects
    FOR SELECT TO anon USING (
      bucket_id = ''employee-files'' AND owner IS NOT NULL
    )',
  'anon',
  'employee-files'
) ON CONFLICT DO NOTHING;

-- 5. Create policy for authenticated users to update their own objects
INSERT INTO storage.policies (name, definition, owner, bucket_id)
VALUES (
  'Employee Files Storage - Update Policy', 
  'CREATE OR REPLACE POLICY "Employee Files Update Policy" ON storage.objects
    FOR UPDATE TO authenticated USING (
      bucket_id = ''employee-files'' AND owner = auth.uid()
    )',
  'authenticated',
  'employee-files'
) ON CONFLICT DO NOTHING;

-- 6. Create policy for authenticated users to delete their own objects
INSERT INTO storage.policies (name, definition, owner, bucket_id)
VALUES (
  'Employee Files Storage - Delete Policy', 
  'CREATE OR REPLACE POLICY "Employee Files Delete Policy" ON storage.objects
    FOR DELETE TO authenticated USING (
      bucket_id = ''employee-files'' AND owner = auth.uid()
    )',
  'authenticated',
  'employee-files'
) ON CONFLICT DO NOTHING;

COMMIT; 