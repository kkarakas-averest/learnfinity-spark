# LearnFinity LMS - Database Structure

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

### HR & Employee Management

#### `hr_employees`
Core employee records managed by HR.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR | Full name |
| email | VARCHAR | Email (unique) |
| department_id | UUID | References departments |
| position_id | UUID | References positions |
| skills | TEXT[] | Array of skills |
| rag_status | VARCHAR | green, amber, red |
| user_id | UUID | Link to auth.users if applicable |

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
| status | VARCHAR | draft, published, archived |

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
| rag_status | VARCHAR | green, amber, red |

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

## Row Level Security (RLS)

The database implements comprehensive RLS policies to ensure:
- Data privacy
- Access control based on user roles
- Secure multi-tenant environments

## Database Functions & Triggers

Key functions support:
- Automatic timestamp updates
- User profile creation
- RAG status tracking
- Conversation management

## Performance Considerations

- Strategic indexing on foreign key columns
- JSON column optimizations
- Time-based query performance tuning

## Future Expansion Opportunities

- Enhanced analytics tracking
- More granular AI agent interactions
- Multilingual content support
- Advanced content versioning

## Security Recommendations

- Regularly audit RLS policies
- Implement strong authentication
- Use prepared statements
- Limit database user permissions

## Conclusion

This database structure supports a sophisticated AI-powered learning management system with personalized content delivery, advanced analytics, and flexible employee development tracking.

**Last Updated**: 2024-04-22