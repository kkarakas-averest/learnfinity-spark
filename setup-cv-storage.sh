#!/bin/bash

# Setup script for CV storage infrastructure

echo "Setting up CV storage infrastructure..."

# Create the necessary tables
psql "$DATABASE_URL" << EOF
-- Add columns to hr_employees table
ALTER TABLE hr_employees 
ADD COLUMN IF NOT EXISTS cv_file_url TEXT,
ADD COLUMN IF NOT EXISTS cv_extracted_data JSONB,
ADD COLUMN IF NOT EXISTS cv_extraction_date TIMESTAMP WITH TIME ZONE;

-- Create extractions tracking table
CREATE TABLE IF NOT EXISTS hr_employee_cv_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  original_file_url TEXT,
  extracted_data JSONB,
  extraction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  extraction_status VARCHAR(20) DEFAULT 'pending'
);
EOF

if [ $? -eq 0 ]; then
  echo "✅ Database structure created successfully"
else
  echo "❌ Failed to create database structure"
  exit 1
fi

echo "CV storage infrastructure setup completed successfully!"
exit 0 