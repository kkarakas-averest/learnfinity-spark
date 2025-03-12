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