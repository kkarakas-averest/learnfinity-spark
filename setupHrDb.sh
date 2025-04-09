#!/bin/bash

# Setup HR Database Script
# This script will set up all required HR database tables and mappings

echo "===== LearnFinity HR Database Setup ====="
echo "This script will set up the HR database tables and mappings."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create a .env file with Supabase credentials."
  exit 1
fi

# Ensure we have the required dependencies
echo "Installing required dependencies..."
npm install -g tsx dotenv-cli

# Step 1: Create the exec_sql function if it doesn't exist
echo ""
echo "Step 1: Creating exec_sql function..."
npm run db:create-exec-sql

# Step 2: Apply the HR schema
echo ""
echo "Step 2: Applying HR schema..."
npm run db:apply-hr-schema

# Step 3: Create user-employee mappings
echo ""
echo "Step 3: Creating user-employee mappings..."
npm run db:create-user-mappings

# Done!
echo ""
echo "===== HR Database Setup Complete! ====="
echo "You should now be able to see assigned HR courses in the learner dashboard."
echo "Please restart your application to see the changes." 