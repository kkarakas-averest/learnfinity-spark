#!/bin/bash
# Script to fix hr_course_enrollments RLS policies

# Load environment variables
set -a
source .env
set +a

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL not set"
  exit 1
fi

# Default to using the service key if available
DB_URL="${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_KEY:-$SUPABASE_ANON_KEY}"

echo "🔧 Fixing hr_course_enrollments permissions..."

# Run SQL script
psql "$DB_URL" -f src/scripts/fix-hr-enrollments-rls.sql

echo "✅ Fixed permissions for hr_course_enrollments table"
echo "👉 Now ensure you've set the SUPABASE_SERVICE_KEY in your environment" 