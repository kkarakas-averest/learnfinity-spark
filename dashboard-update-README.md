# Dashboard Update: Real Data with Fallbacks

This update modifies the learner dashboard to show real data from the HR database while only using mock data for fields that don't exist. This creates a more accurate and useful dashboard experience.

## Overview of Changes

1. **Database Schema Updates**
   - Added missing fields to existing tables
   - Created new tables for dashboard preferences, statistics, and achievements
   - Added triggers to keep learning path progress in sync with course progress

2. **Hybrid Data Approach**
   - Uses real user/employee data from HR system
   - Shows real course enrollments and progress
   - Shows real learning paths if available
   - Only uses mock data for missing fields (thumbnails, skills, etc.)

3. **Data Population**
   - Script to populate missing fields with realistic data
   - Creates learner preferences, statistics, and achievements

## Setup Instructions

### 1. Update Database Schema

Run the following SQL script to update your database schema:

```bash
# In Supabase SQL Editor, run:
cat src/db/update-dashboard-schema.sql | psql -h $SUPABASE_HOST -p $SUPABASE_PORT -d $SUPABASE_DB -U $SUPABASE_USER
```

Or copy and paste the contents of `src/db/update-dashboard-schema.sql` into the Supabase SQL Editor and run it.

### 2. Run the Data Population Script

This script will add missing fields like thumbnails, skills, preferences, etc. to your existing data:

```bash
# Install required dependencies
npm install @supabase/supabase-js dotenv uuid

# Run the script
node src/scripts/populate-dashboard-fields.js
```

### 3. Update API Endpoint

The dashboard API endpoint has been updated to use the hybrid data approach. When a user requests dashboard data, it will:

1. Fetch real data from the HR database
2. Only fill in mock data for fields that don't exist
3. Return a consistent dashboard structure

## Testing

You can test the updated dashboard by:

1. Running the SQL schema updates
2. Running the data population script 
3. Accessing the dashboard for the user `kkarakass@averesttraining.com`

You should now see real data about course assignments, including:
- "Data Analysis with Python"
- "Communication Skills for Professionals"

## Troubleshooting

If you encounter any errors:

- Check if all tables exist in your database
- Ensure the employee has course enrollments
- Check for any SQL errors in the schema update
- Look at the console logs from the population script

## Files to Review

- `src/db/update-dashboard-schema.sql` - SQL schema updates
- `src/scripts/populate-dashboard-fields.js` - Data population script
- `src/app/api/learner/dashboard/hybrid-data.ts` - Hybrid data utilities
- `src/app/api/learner/dashboard/route.ts` - Updated API endpoint 