# HR Course Assignment Issue Fix

## Problem Description

Users were unable to see HR-assigned courses in the Learner Dashboard. The console logs showed several issues:

1. Missing required tables in the database:
   - `hr_course_enrollments`
   - `hr_courses`
   - `hr_employees`
   - `employee_user_mapping`

2. Column naming issues:
   - `hr_courses.thumbnail` referenced, but the column is actually named `thumbnail_url`
   - `courses.user_id` referenced, but this column doesn't exist

3. Mapping between users and employees was missing, so the system couldn't associate auth users with HR employees.

## Solution

We implemented a comprehensive fix that includes:

1. **Schema Creation Scripts**:
   - `src/utils/applyHrSchema.ts`: Applies the HR schema to create all required HR tables
   - `src/utils/createEmployeeUserMappings.ts`: Creates mappings between auth users and HR employees

2. **API Fixes**:
   - Updated the column name in the query from `thumbnail` to `thumbnail_url`
   - Replaced the direct query to `courses.user_id` with a proper lookup path:
     - First get the employee ID from `employee_user_mapping`
     - Then query `hr_course_enrollments` using the employee ID

3. **Convenience Setup Script**:
   - Created `setupHrDb.sh` to run all the database setup tasks in sequence

## How to Use

1. Ensure your `.env` file has valid Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_KEY=your-service-key
   SUPABASE_DB_HOST=your-db-host
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-db-password
   ```

2. Run the setup script:
   ```
   ./setupHrDb.sh
   ```

3. Restart your application to see the changes take effect.

## Expected Outcome

After applying this fix:

1. All required HR tables will be created in your database
2. Users will be properly mapped to their HR employee records
3. HR-assigned courses will appear on the Learner Dashboard
4. Course thumbnails will display correctly
5. Course progress will be tracked properly

## Technical Details

The fix addresses the following technical issues:

1. **Missing Tables**: Created using the SQL schema definitions in `src/db/hr-schema.sql` and `src/db/update-dashboard-schema.sql`

2. **Employee-User Mapping**: Created by matching emails between `auth.users` and `hr_employees` tables

3. **Query Path**: The correct query path for finding user courses is:
   `auth.users → employee_user_mapping → hr_employees → hr_course_enrollments → hr_courses`

4. **Column Names**: Updated all references to use the correct column names as defined in the schema 