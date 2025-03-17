# Supabase Database Access with Claude

This project contains scripts and utilities for accessing your Supabase database directly from Claude via the command line. While MCP integration may have challenges due to authentication requirements, these tools offer an alternative approach.

## Files Overview

1. **test-supabase.js** - Simple test script to verify Supabase connection
2. **explore-db.js** - More extensive script to explore your database structure
3. **claude-supabase-api.js** - Command-line tool for Claude to query your database

## Using claude-supabase-api.js

This is a command-line tool designed to be used easily from Claude for database operations:

```bash
# Show available commands
node claude-supabase-api.js

# List all available tables
node claude-supabase-api.js list-tables

# Show structure of a table
node claude-supabase-api.js describe-table hr_employees

# Query data from a table (limit defaults to 10)
node claude-supabase-api.js query hr_departments 5

# Get employees with their departments and positions
node claude-supabase-api.js employees

# List all departments
node claude-supabase-api.js departments

# List all positions
node claude-supabase-api.js positions
```

## Database Structure

Your Supabase database has the following key tables:

1. **hr_departments** - Departments in the organization
   - id (UUID)
   - name (VARCHAR)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **hr_positions** - Job positions linked to departments
   - id (UUID)
   - title (VARCHAR)
   - department_id (UUID) - Foreign key to hr_departments
   - salary_range_min (DECIMAL)
   - salary_range_max (DECIMAL)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

3. **hr_employees** - Employee records
   - id (UUID)
   - name (VARCHAR)
   - email (VARCHAR)
   - department_id (UUID) - Foreign key to hr_departments
   - position_id (UUID) - Foreign key to hr_positions
   - status (VARCHAR)
   - rag_status (VARCHAR)
   - and additional fields...

4. **learning_paths**, **learning_path_courses**, **courses** - Additional tables for the learning platform

## Troubleshooting MCP Connection

If you're experiencing issues with MCP connection, try these steps:

1. Make sure your `.cursor/mcp.json` file is using the anon key, not the password:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-postgres", 
        "postgres://postgres.ujlqzkkkfatehxeqtbdl:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
      ]
    }
  }
}
```

2. Check if npm and npx are properly installed and updated
3. Restart Cursor after changes
4. Use the claude-supabase-api.js script as a reliable alternative 