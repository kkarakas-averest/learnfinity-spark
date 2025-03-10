# Database Seeding Utilities

This directory contains utilities for seeding the database with sample data for development and testing purposes.

## Overview

The database seeding utilities populate your database with realistic test data for:

1. **Employees/Learners**: User profiles, learning preferences, skills, career goals, and history
2. **Courses**: Course structures, modules, sections, and templates
3. **Assessments**: Question banks, assessments, and attempts

## Usage

### Command Line

You can run the seeding process from the command line using the provided npm script:

```bash
# Seed all data types
npm run db:seed

# Or using a specific environment
NODE_ENV=development npm run db:seed
```

### From Code

You can also import and use the seeding functions in your code:

```typescript
import { seedDatabase } from '@/utils/database/seedDatabase';
import { seedAllEmployeeData } from '@/utils/database/seedEmployees';
import { seedAllCourseData } from '@/utils/database/seedCourses';
import { seedAllAssessmentData } from '@/utils/database/seedAssessments';

// Seed everything
await seedDatabase();

// Or seed specific parts
await seedAllEmployeeData();
await seedAllCourseData();
await seedAllAssessmentData();
```

### Admin UI

For convenience, a UI component is provided at `@/components/admin/DatabaseSeedingPanel.tsx` which allows you to seed the database through a user interface. This component should only be included in development or staging environments.

## File Structure

- **seedDatabase.ts**: Main entry point that coordinates all seeding operations
- **seedEmployees.ts**: Functions for seeding employee/learner data
- **seedCourses.ts**: Functions for seeding course-related data
- **seedAssessments.ts**: Functions for seeding assessment-related data
- **DATABASE-SEEDING-README.md**: This documentation file

## Data Structure

### Employees/Learners

The employee data seeding creates:

- **Employees**: Basic information like name, title, department, etc.
- **Learning Preferences**: Preferred learning styles, formats, times, etc.
- **Skills**: Skill records with proficiency levels and verification status
- **Career Goals**: Professional development goals with progress tracking
- **Learning History**: Record of learning activities and achievements

### Courses

The course data seeding creates:

- **Courses**: Course metadata, structure, and settings
- **Modules**: Learning modules organized within courses
- **Sections**: Content sections within modules
- **Course Templates**: Reusable course structures for easy course creation

### Assessments

The assessment data seeding creates:

- **Question Bank**: Various question types (multiple choice, true/false, etc.)
- **Assessments**: Configured assessments with grading criteria
- **Assessment Attempts**: Sample assessment attempts with responses and scores

## Types of Data Seeded

### Employees/Learners
- Basic user information: name, email, department, role, etc.
- Profile data including skills, interests, and learning preferences
- Learning history and progress data

### Courses
- Course metadata: title, description, duration, difficulty level, etc.
- Course structure: modules, sections, lessons
- Learning objectives and outcomes
- Course resources and materials

### Assessments
The system supports two different assessment formats:

#### Original Assessment Format
- Quiz-style assessments with various question types
- Linked to courses
- Performance metrics and scoring

#### New Assessment Format (V2)
- More structured assessments with multiple question types:
  - Multiple choice
  - True/False
  - Short answer
- Enhanced metadata: passing score, time limits, required status
- Full support for the Assessment Builder UI component
- Individual questions with points, order, and correct answers

## Assessment Builder Feature

The new Assessment Builder component (`src/components/hr/AssessmentBuilder.tsx`) provides a user-friendly interface for HR administrators and course creators to build comprehensive assessments. Key features include:

- Step-by-step wizard interface for creating assessments
- Support for multiple question types (multiple choice, true/false, short answer)
- Assessment configuration (passing score, time limits, required status)
- Live preview of questions during creation
- Automatic saving to the database

The Assessment Builder is integrated into the HR Dashboard and uses the new assessment schema for data storage.

## Configuration

The seeding utilities are designed to use the same database configuration as your main application. The Supabase client is imported from `@/lib/supabase-client.ts`.

### Required Environment Variables

For the seeding scripts to work properly, you need to have the following environment variables configured:

```
# In .env file for Node.js scripts
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# For admin operations (optional)
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

For detailed instructions on setting up Supabase configuration, see the `SUPABASE-CONFIG-README.md` file in the project root.

## Best Practices

1. **Development Only**: These utilities should only be used in development or staging environments, never in production.

2. **Fresh Database**: It's best to run these on a fresh database, or at least be aware that they may create duplicate data if run multiple times.

3. **Consistent IDs**: The seeded data uses UUIDs for IDs, which ensures uniqueness across runs.

4. **Relationships**: Employee/learner data should be seeded before courses and assessments to maintain proper relationships.

## Customization

You can modify the seed data by editing the respective files:

- **Employee Data**: Modify the data in `seedEmployees.ts`
- **Course Data**: Modify the data in `seedCourses.ts`
- **Assessment Data**: Modify the data in `seedAssessments.ts`

## Troubleshooting

If you encounter any issues with the seeding process:

1. **Check Environment Variables**: Ensure that your Supabase credentials are correctly set in your environment.

2. **Check Console Output**: The seeding process logs detailed information to the console.

3. **Database Permissions**: Ensure that your Supabase user has the necessary permissions to insert data.

4. **Network Issues**: Verify that you can connect to your Supabase instance.

If you need additional help, please file an issue in the project repository. 