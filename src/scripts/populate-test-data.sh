#!/bin/bash

# Learnfinity Spark - Test Data Population Script
# This script populates the database with realistic test data

echo "Starting test data population process..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI not found."
    echo "Please install Supabase CLI first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: Not in a Supabase project directory."
    echo "Please run this script from your project root."
    exit 1
fi

# Ask for confirmation
echo "This script will populate your database with test data."
echo "It's recommended to run this on a development database only."
read -p "Continue? (y/n): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Execute the SQL script using Supabase CLI
echo "Executing test data population SQL script..."
supabase db execute --file src/scripts/populate-test-data.sql

# Check if execution was successful
if [ $? -eq 0 ]; then
    echo "✅ Test data population complete!"
    echo "You can now use this data to test the HR Dashboard and AI Agents."
    echo "Note: For complete testing, ensure you have created corresponding auth.users with matching emails."
else
    echo "❌ Error: Failed to execute SQL script."
    echo "Please check the error messages above."
fi 