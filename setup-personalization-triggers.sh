#!/bin/bash

# Script to set up database triggers for content personalization
echo "Setting up content personalization triggers..."

# Get database connection string from .env file
DB_URL=$(grep SUPABASE_CONNECTION_STRING .env | cut -d '=' -f 2)

if [ -z "$DB_URL" ]; then
  echo "Error: SUPABASE_CONNECTION_STRING not found in .env file"
  exit 1
fi

# Execute the SQL file to create triggers
psql "$DB_URL" -f src/db/ai-personalization-trigger.sql

# Check result
if [ $? -eq 0 ]; then
  echo "✅ Personalization triggers created successfully"
else
  echo "❌ Failed to create personalization triggers"
  exit 1
fi

# Add status column if it doesn't exist
echo "Checking for required columns..."
psql "$DB_URL" -c "
-- Add personalized_content_generation_status column if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_generation_status') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_generation_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_started_at') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_started_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_completed_at') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_completed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hr_course_enrollments' 
                   AND column_name='personalized_content_id') THEN
        ALTER TABLE hr_course_enrollments 
        ADD COLUMN personalized_content_id UUID REFERENCES ai_course_content(id) ON DELETE SET NULL;
    END IF;
END \$\$;
"

# Create indexes
echo "Creating indexes..."
psql "$DB_URL" -c "
-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_personalization_status
ON hr_course_enrollments(personalized_content_generation_status);

CREATE INDEX IF NOT EXISTS idx_hr_course_enrollments_personalized_content_id
ON hr_course_enrollments(personalized_content_id);
"

echo "🎉 Content personalization setup completed!" 