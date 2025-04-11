
# LearnFinity LMS - Database Structure Documentation

## Overview

LearnFinity LMS uses a Supabase PostgreSQL database with a comprehensive schema designed for an AI-powered Learning Management System. This document provides detailed information about the database structure, including tables, relationships, Row Level Security (RLS) policies, and more.

## Core Table Groups

The database is organized into several logical groups of tables:

1. **User & Authentication** - User accounts, profiles, roles, and preferences
2. **HR & Employee Management** - Employee records, departments, positions
3. **Course Management** - Courses, modules, sections, and content
4. **Learning Paths** - Structured learning journeys combining multiple courses
5. **Progress Tracking** - User progress, completions, and assessments
6. **AI & Personalization** - Generated content, RAG system, and agent data

## Key Tables & Relationships

### User Management

#### `user_profiles`
Stores extended user information beyond what's in the auth.users table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key (references auth.users) |
| name | TEXT | User's full name |
| email | TEXT | User's email address |
| role | TEXT | User role (learner, admin, etc.) |
| department | TEXT | Department name |
| experience_level | TEXT | Beginner, intermediate, advanced, expert |

**RLS Policies**: Users can view/edit only their own profiles.

#### `user_preferences`
Stores user configuration preferences, including LLM settings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | References auth.users |
| llm_config | JSONB | LLM configuration settings |
| ui_preferences | JSONB | UI configuration preferences |

**RLS Policies**: Users can only view/modify their own preferences.

#### `user_roles`
Implements role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | References auth.users |
| role | TEXT | Role name |

**RLS Policies**: Protected to prevent unauthorized role changes.

### HR & Employee Management

#### `hr_employees`
Core employee records managed by HR.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR | Full name |
| email | VARCHAR | Email (unique) |
| department_id | UUID | References hr_departments |
| position_id | UUID | References hr_positions |
| manager_id | UUID | Self-reference to manager |
| status | VARCHAR | active, inactive, etc. |
| hire_date | DATE | When employee was hired |
| skills | TEXT[] | Array of skills |
| rag_status | VARCHAR | green, amber, red |
| user_id | UUID | Link to auth.users if applicable |

**Foreign Keys**:
- department_id → hr_departments.id
- position_id → hr_positions.id
- manager_id → hr_employees.id (self-reference)

#### `hr_departments`
Organizational departments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR | Department name (unique) |

#### `hr_positions`
Job positions within the organization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | VARCHAR | Position title |
| department_id | UUID | References hr_departments |
| salary_range_min | DECIMAL | Minimum salary |
| salary_range_max | DECIMAL | Maximum salary |

**Foreign Keys**:
- department_id → hr_departments.id

#### `employee_user_mapping`
Links HR employee records to authentication users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | References hr_employees |
| user_id | UUID | References auth.users |

**Foreign Keys**:
- employee_id → hr_employees.id
- user_id → auth.users.id

### Course Management

#### `hr_courses`
Main course catalog table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | VARCHAR | Course title |
| description | TEXT | Course description |
| department_id | UUID | Optional department association |
| skill_level | VARCHAR | Difficulty level |
| duration | INTEGER | Estimated minutes to complete |
| status | VARCHAR | draft, published, archived |
| thumbnail_url | TEXT | Course thumbnail image |
| skills | JSONB | Skills taught in course |

**RLS Policies**: Publicly viewable for enrolled users.

#### `course_modules`
Modules within courses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| course_id | UUID | References courses |
| title | TEXT | Module title |
| description | TEXT | Module description |
| order_index | INTEGER | Module sequence |
| duration | INTEGER | Estimated minutes |

**Foreign Keys**:
- course_id → courses.id

#### `module_sections`
Content sections within modules.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| module_id | UUID | References course_modules |
| title | TEXT | Section title |
| content | TEXT | Section content (often markdown) |
| order_index | INTEGER | Section sequence |
| duration | INTEGER | Estimated minutes |

**Foreign Keys**:
- module_id → course_modules.id

### Enrollment & Progress

#### `hr_course_enrollments`
Tracks user enrollment in courses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | References hr_employees |
| course_id | UUID | References hr_courses |
| status | VARCHAR | enrolled, completed, dropped |
| progress | INTEGER | 0-100% completion |
| enrollment_date | TIMESTAMP | When enrolled |
| completion_date | TIMESTAMP | When completed (if applicable) |
| score | DECIMAL | Optional final score |
| rag_status | VARCHAR | green, amber, red |
| personalized_content_id | UUID | References personalized content if generated |

**Foreign Keys**:
- employee_id → hr_employees.id
- course_id → hr_courses.id
- personalized_content_id → dynamic_course_content.id

**RLS Policies**: Users can view their own enrollments; HR can view all.

#### `hr_employee_activities`
Logs all learning-related activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | References hr_employees |
| activity_type | VARCHAR | Type of activity |
| description | TEXT | Activity description |
| course_id | UUID | Optional course reference |
| timestamp | TIMESTAMP | When activity occurred |

**Foreign Keys**:
- employee_id → hr_employees.id
- course_id → hr_courses.id

### Learning Paths

#### `hr_learning_paths`
Defined learning journeys consisting of multiple courses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | VARCHAR | Path title |
| description | TEXT | Path description |
| skill_level | VARCHAR | Overall difficulty |
| skills | JSONB | Skills developed |

#### `hr_learning_path_courses`
Junction table mapping courses to learning paths.

| Column | Type | Description |
|--------|------|-------------|
| learning_path_id | UUID | References learning_paths |
| course_id | UUID | References courses |
| sequence_order | INTEGER | Course order in path |

**Foreign Keys**:
- learning_path_id → hr_learning_paths.id
- course_id → hr_courses.id

**Primary Key**: (learning_path_id, course_id)

#### `hr_learning_path_enrollments`
Learning path enrollments for employees.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | References hr_employees |
| learning_path_id | UUID | References learning_paths |
| status | VARCHAR | in_progress, completed |
| progress | INTEGER | 0-100% completion |
| enrollment_date | TIMESTAMP | Start date |
| completion_date | TIMESTAMP | End date if completed |
| estimated_completion_date | TIMESTAMP | Target completion date |

**Foreign Keys**:
- employee_id → hr_employees.id
- learning_path_id → hr_learning_paths.id

### AI & Content Generation

#### `dynamic_course_content`
Stores AI-generated personalized content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | TEXT | Target employee |
| course_id | TEXT | Source course |
| content | JSONB | Generated content |
| version | INTEGER | Content version |

#### `ai_generated_course_content`
Stores AI-generated course content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | TEXT | Content title |
| course_id | UUID | Associated course |
| content | JSONB | Generated content |
| created_by | UUID | Creator reference |
| is_published | BOOLEAN | Publication status |
| personalization_params | JSONB | Parameters used for generation |

#### `ai_course_content_sections`
Individual content sections for AI-generated content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| content_id | UUID | References ai_generated_course_content |
| module_id | UUID | Module reference |
| section_id | UUID | Section reference |
| title | TEXT | Section title |
| content | TEXT | Section content |
| order_index | INTEGER | Section sequence |

#### `ai_course_quiz_questions`
Quiz questions generated by AI.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| content_id | UUID | Generated content reference |
| module_id | UUID | Module reference |
| question | TEXT | Question text |
| options | JSONB | Answer options array |
| correct_answer | TEXT | Correct option |
| explanation | TEXT | Explanation of answer |
| difficulty | VARCHAR | Question difficulty |

### Assessment System

#### `assessments`
Course assessments and quizzes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| title | VARCHAR | Assessment title |
| description | TEXT | Assessment description |
| course_id | UUID | Associated course |
| module_id | UUID | Optional module association |
| questions | JSONB | Questions data |
| total_points | INTEGER | Maximum points |
| time_limit | INTEGER | Minutes allowed |
| passing_score | INTEGER | % required to pass |

#### `assessment_attempts`
Individual assessment attempts by users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| assessment_id | UUID | References assessments |
| user_id | UUID | User who attempted |
| started_at | TIMESTAMP | When attempt started |
| submitted_at | TIMESTAMP | When submitted |
| responses | JSONB | User responses |
| score | NUMERIC | Score achieved |
| passed | BOOLEAN | Pass/fail status |
| time_spent | INTEGER | Seconds taken |

### RAG System & Interventions

#### `employee_rag_history`
Records changes to employee RAG status.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | References hr_employees |
| status | VARCHAR | green, amber, red |
| previous_status | VARCHAR | Previous RAG status |
| reason | TEXT | Reason for status change |
| created_by | UUID | Who made the change |
| created_at | TIMESTAMP | When status changed |
| related_intervention_id | UUID | Optional intervention reference |

#### `interventions`
Interventions created to address employee learning issues.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | Target employee |
| created_by | UUID | Creator reference |
| intervention_type | VARCHAR | Type of intervention |
| content | TEXT | Intervention content |
| notes | TEXT | Additional notes |
| status | VARCHAR | pending, delivered, completed |
| created_at | TIMESTAMP | Creation timestamp |
| due_date | TIMESTAMP | Optional deadline |

#### `content_modifications`
Content modifications made as interventions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| content_id | VARCHAR | Content being modified |
| intervention_id | UUID | References interventions |
| original_content | TEXT | Original content state |
| modified_content | TEXT | New content state |
| content_type | VARCHAR | Type of content modified |
| reason | TEXT | Reason for modification |

### Notification System

#### `user_notifications`
System notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | Target user |
| title | VARCHAR | Notification title |
| message | TEXT | Notification content |
| type | VARCHAR | Notification type |
| priority | VARCHAR | normal, high, low |
| is_read | BOOLEAN | Read status |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | Creation timestamp |

**RLS Policies**: Users can only see their own notifications.

## Row Level Security Overview

The database implements comprehensive Row Level Security (RLS) policies to ensure data privacy and access control:

1. **User-specific data** - Users can only access their own profile data, preferences, and activity records.
2. **HR access controls** - HR personnel can view all employee data but may have restrictions on certain sensitive fields.
3. **Course enrollment restrictions** - Users can only access course content they're enrolled in.
4. **Administrative access** - Admins have broader access but still have limits on sensitive user data.

## Important Database Functions

Several PostgreSQL functions support application functionality:

1. `update_timestamp()` - Automatically updates `updated_at` fields.
2. `handle_new_user()` - Creates profile records when a new user signs up.
3. `update_rag_status_timestamp()` - Updates timestamp when RAG status changes.
4. `update_employee_rag_status()` - Updates employee RAG status based on interventions.

## Database Triggers

Key triggers that maintain data integrity:

1. **Automatic timestamps** - Updates timestamps on record changes.
2. **User creation hooks** - Creates necessary related records when users sign up.
3. **RAG status history** - Records history when employee RAG status changes.
4. **Conversation updates** - Updates last message time for conversations.

## Schema Migrations and Updates

The database schema is managed through SQL migration files in the codebase:

1. `sql/create_tables.sql` - Creates core tables.
2. `src/scripts/update-schema.sql` - Handles schema updates.
3. `src/db/migrations/` - Contains versioned migrations.

## Future Considerations

Areas for potential schema expansion:

1. **Analytics enhancements** - Additional tables for more granular analytics.
2. **Enhanced AI agent storage** - For more complex agent-based interactions.
3. **Localization support** - For multilingual content storage.
4. **Improved content versioning** - For more robust content management.

## Indexing Strategy

The database uses strategic indexing to optimize common queries:

1. Foreign key columns for efficient joins.
2. Timestamp fields for date-range queries.
3. Status fields for filtered queries.
4. User IDs for user-specific data retrieval.

## Data Types and Conventions

The database follows these conventions:

1. **IDs** - Always UUID primary keys.
2. **Timestamps** - Always with timezone for global compatibility.
3. **Status fields** - Usually VARCHAR with defined options.
4. **JSON data** - Stored as JSONB for better indexing and operations.
5. **Text content** - TEXT type for flexibility.
6. **Names/titles** - VARCHAR with appropriate length limits.

## Conclusion

This database structure supports a sophisticated AI-powered learning management system with personalized content delivery, analytics, and intervention capabilities. The schema is designed to maintain data integrity while enabling flexible content generation and management.
