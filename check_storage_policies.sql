-- Check existing storage buckets
SELECT * FROM storage.buckets;

-- Check storage.objects permissions
SELECT obj_id, name, owner, bucket_id, created_at, updated_at, path_tokens 
FROM storage.objects 
LIMIT 10;

-- Check current RLS policies for objects table
SELECT *
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- SQL to enable authenticated users to access employee-files bucket
-- Run this to create a bucket and set up appropriate RLS policies:
BEGIN;

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-files', 'employee-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy for authenticated users to create objects
CREATE POLICY "Employee Files Upload Policy" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
      bucket_id = 'employee-files'
    );

-- 3. Policy for authenticated users to read objects
CREATE POLICY "Employee Files Read Policy" ON storage.objects
    FOR SELECT TO authenticated USING (
      bucket_id = 'employee-files'
    );

-- 4. Policy for anyone to read objects (for public URLs)
CREATE POLICY "Employee Files Public Read Policy" ON storage.objects
    FOR SELECT TO anon USING (
      bucket_id = 'employee-files' AND owner IS NOT NULL
    );

-- 5. Policy for authenticated users to update their own objects
CREATE POLICY "Employee Files Update Policy" ON storage.objects
    FOR UPDATE TO authenticated USING (
      bucket_id = 'employee-files' AND owner = auth.uid()
    );

-- 6. Policy for authenticated users to delete their own objects
CREATE POLICY "Employee Files Delete Policy" ON storage.objects
    FOR DELETE TO authenticated USING (
      bucket_id = 'employee-files' AND owner = auth.uid()
    );

-- 7. Special policy for service role to manage all objects (useful for APIs)
CREATE POLICY "Service Role Admin Policy" ON storage.objects
    FOR ALL TO service_role USING (
      bucket_id = 'employee-files'
    );

COMMIT; 