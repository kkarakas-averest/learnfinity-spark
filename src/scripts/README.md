# Test Data Population Scripts

This directory contains scripts for populating the database with test data for development and testing purposes.

## Available Scripts

### HR Employees

```bash
node src/scripts/populate-hr-employees.js
```

This script populates the `hr_employees` table with test data. It creates 5 employees with different statuses (green, amber, red).

### Learning Paths

```bash
node src/scripts/populate-learning-paths.js
```

This script populates the `learning_paths` table with test data. It creates 4 learning paths with different configurations (mandatory, completed, with due date, etc.).

## Limitations

- The `learning_path_assignments` table cannot be accessed with the current permissions. It requires a service key or proper authentication.
- The `learning_paths` table has foreign key constraints on `learner_id` and `course_id` fields, so we can only insert records with these fields set to null.

## How to Use

1. Make sure you have the required environment variables set in your `.env` file:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (or preferably `SUPABASE_SERVICE_KEY` for full access)

2. Run the scripts in the following order:
   ```bash
   node src/scripts/populate-hr-employees.js
   node src/scripts/populate-learning-paths.js
   ```

3. Verify the data was inserted correctly by checking the database.

## Adding More Scripts

To add more test data population scripts:

1. Create a new script file in this directory
2. Follow the pattern of existing scripts:
   - Import required dependencies
   - Check for environment variables
   - Create sample data
   - Insert data into the database
   - Handle errors appropriately

3. Make the script executable:
   ```bash
   chmod +x src/scripts/your-script.js
   ```

4. Update this README to document the new script 

## HR Dashboard Data Population Scripts

This directory contains scripts to populate test data for the HR Dashboard, allowing you to test the functionality with realistic data.

### Available Scripts

- `populate-hr-employees.js` - Populates the `hr_employees` table with sample employee data
- `populate-learning-paths.js` - Populates the `learning_paths` table with sample learning path data
- `create-hr-tables-direct.js` - Attempts to create all the required tables for the HR Dashboard
- `check-learning-paths.js` - Checks if learning paths exist in the database
- `simple-check.js` - Simple script to check database connectivity
- `check-schema.js` - Checks database schema and table structure

### How to Use

1. Make sure your `.env` file is configured with the correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key (for admin operations)
   ```

2. Create tables (if they don't exist):
   ```
   node src/scripts/create-hr-tables-direct.js
   ```

3. Populate tables with sample data:
   ```
   node src/scripts/populate-hr-employees.js
   node src/scripts/populate-learning-paths.js
   ```

### Known Issues

#### Course Enrollments Table

The `course_enrollments` table might not be automatically created due to permission issues. We've provided several alternative methods to create this table:

1. **Using the simplified table approach**:
   ```bash
   node src/scripts/create-simple-enrollments.js
   ```
   This creates a version of the table without foreign key constraints.

2. **Using the direct PostgreSQL connection**:
   ```bash
   node src/scripts/create-table-pg-direct.js
   ```
   This requires proper database credentials in your `.env` file:
   ```
   DATABASE_URL=postgres://username:password@hostname:port/database
   # OR individual credentials
   SUPABASE_DB_HOST=db.your-project-ref.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-password
   ```

3. **Using REST API approach**:
   ```bash
   node src/scripts/create-table-rest-api.js
   ```
   This tries multiple methods to create the table through Supabase's REST APIs.

4. **Using Storage API workaround**:
   ```bash
   node src/scripts/create-table-storage-workaround.js
   ```
   This uses Supabase's Storage API as a workaround to create the table.

5. **Manual creation through SQL Editor**:
   If all else fails, you can manually create the table through the Supabase Dashboard SQL Editor using this SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS course_enrollments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     employee_id UUID NOT NULL REFERENCES hr_employees(id),
     course_id UUID NOT NULL,
     status TEXT DEFAULT 'in_progress',
     progress INTEGER DEFAULT 0,
     completion_date TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );
   ```

### Troubleshooting

If you encounter permission issues:

1. Check that you are using the Service Key for admin operations
2. Verify that Row Level Security (RLS) policies allow the operations you're trying to perform
3. If using the anon key, ensure the public tables have appropriate RLS policies

For more complex issues, you may need to:

1. Check the Supabase logs in the dashboard
2. Manually create the tables through the Supabase SQL editor
3. Adjust RLS policies to allow the operations you need 