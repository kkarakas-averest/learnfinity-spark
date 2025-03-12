# LearnFinity Database Setup Guide

This document provides step-by-step instructions for setting up the LearnFinity database schema using the provided scripts.

## Overview

The LearnFinity database schema includes tables for:

1. Employee/Learner data (profiles, preferences, skills, history)
2. Course content (courses, modules, sections)
3. Assessments (questions, attempts, results)
4. Agent system state (for AI agents)
5. Organization structure (departments, teams)

## Prerequisites

Before you begin, ensure you have:

1. Access to your Supabase project
2. The service role key from your Supabase project
3. PostgreSQL client installed for direct database access (for the `db:create-exec-sql` script)

## Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```
   cp .env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Supabase Service Role Key (for admin operations)
   SUPABASE_SERVICE_KEY=your-service-role-key
   SUPABASE_URL=https://your-project-ref.supabase.co
   
   # Database Connection (for direct SQL execution)
   SUPABASE_DB_HOST=db.your-project-ref.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-database-password
   ```

   You can find these values in your Supabase project dashboard under Project Settings > API.

## Implementation Steps

### Step 1: Create the `exec_sql` Function

First, we need to create a PostgreSQL function that allows executing SQL statements via RPC:

```bash
npm run db:create-exec-sql
```

This script will connect to your database directly using `psql` and create the `exec_sql` function.

**Note:** If you encounter any issues with this step, you can manually create this function by:
1. Connect to your Supabase database using the SQL Editor in the Supabase dashboard
2. Copy the contents of `src/db/create-exec-sql-function.sql`
3. Execute the SQL in the SQL Editor

### Step 2: Apply the Foundation Schema

Once the `exec_sql` function is created, you can apply the full schema:

```bash
npm run db:apply-schema
```

This script will:
1. Read the `src/db/foundation-schema.sql` file
2. Split it into individual SQL statements
3. Execute each statement using the `exec_sql` function
4. Log the progress and any errors

### Step 3: Verify the Schema Implementation

After applying the schema, you should verify that the tables were created correctly:

1. Go to your Supabase dashboard
2. Navigate to the Table Editor
3. Verify that all the tables defined in the schema are present
4. Check a few key tables to ensure their structure matches the schema

## One-Step Implementation

If you want to perform both steps in one command, you can use:

```bash
npm run db:setup
```

This will run both the `db:create-exec-sql` and `db:apply-schema` scripts sequentially.

## Schema Modifications

If you need to modify the schema:

1. Edit the `src/db/foundation-schema.sql` file
2. Run the schema application script again:
   ```bash
   npm run db:apply-schema
   ```

**Note:** The scripts use `CREATE TABLE IF NOT EXISTS` to avoid errors when tables already exist. If you need to modify an existing table, you'll need to manually create ALTER TABLE statements or drop the tables first.

## Troubleshooting

### Connection Issues

If you encounter connection issues:
- Verify your Supabase credentials in the `.env` file
- Ensure your IP address is allowed in the Supabase project settings
- Check if the database password is correct

### Permission Issues

If you encounter permission errors:
- Ensure you're using the service role key, not the anon key
- Verify that the `exec_sql` function was created successfully
- Check that the function has the correct permissions

### Schema Errors

If specific SQL statements fail:
- Check the error message in the console
- Fix the SQL in the `foundation-schema.sql` file
- Run the application script again

## Schema Structure

The schema is organized into logical sections:

1. **Employee/Learner Data**
   - employees
   - learning_preferences
   - learning_metadata
   - skill_records
   - career_goals
   - learning_history
   - course_completion_records

2. **Course Content**
   - courses
   - modules
   - sections
   - content_metadata
   - content_variants
   - prerequisite_relationships
   - course_templates
   - course_metrics

3. **Assessment Framework**
   - question_bank
   - assessments
   - assessment_attempts
   - assessment_results

4. **Agent System State**
   - agent_states
   - agent_decisions
   - agent_messages
   - agent_metrics

5. **Organization Structure**
   - departments
   - teams
   - team_members

Each section includes appropriate indexes for performance optimization and row-level security policies for data protection.

## Next Steps

After setting up the database schema, you can proceed with:

1. Implementing the service layer to interact with these tables
2. Creating the UI components for the course creation system
3. Integrating the agent system with the database

Refer to the implementation roadmap for details on these next steps.
