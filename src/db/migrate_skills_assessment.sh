#!/bin/bash

# Apply the skills assessment schema to the database
# This script requires the Supabase CLI to be installed

echo "Applying skills assessment schema..."

# Get the Supabase URL and key from environment
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_KEY=$(grep VITE_SUPABASE_SERVICE_KEY .env | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY not found in .env file"
  exit 1
fi

# Apply the schema using curl or another HTTP client
curl -X POST \
  -H "Content-Type: application/sql" \
  -H "apikey: $SUPABASE_KEY" \
  --data-binary @src/db/skills-assessment-schema.sql \
  "$SUPABASE_URL/rest/v1/sql"

echo "Skills assessment schema applied successfully" 