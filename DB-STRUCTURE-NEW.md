# Learnfinity Database Structure

This document outlines the current database structure and proposes a simplified schema that maintains full flexibility while reducing complexity.

## Current Database Structure

The current database schema contains multiple overlapping tables for content storage and a complex relationship model.

### Core Entities

#### HR Employees
- `hr_employees` - Employee information with CV data
  - `id` (uuid, PK)
  - `name` (varchar)
  - `email` (varchar)
  - `department_id` (uuid, FK)
  - `position_id` (uuid, FK)
  - `cv_extracted_data` (jsonb) - Structured CV data extracted by AI
  - `cv_file_url` (text)
  - `cv_extraction_date` (timestamp)
  - `user_id` (uuid) - Direct reference to auth.users

#### Authentication & Mapping
- `employee_user_mapping` - Links employees to user accounts
  - `id` (uuid, PK)
  - `employee_id` (uuid, FK)
  - `user_id` (uuid, FK to auth.users)
  
#### Courses
- `hr_courses` - Course information
  - `id` (uuid, PK)
  - `title` (varchar)
  - `description` (text)
  - `category` (varchar)
  - `difficulty_level` (varchar)
  - `department_id` (uuid, FK)

#### Enrollments
- `hr_course_enrollments` - Employee enrollment in courses
  - `id` (uuid, PK)
  - `employee_id` (uuid, FK)
  - `course_id` (uuid, FK)
  - `status` (varchar)
  - `personalized_content_id` (uuid, FK) - Link to personalized content
  - `personalized_content_generation_status` (varchar)
  - `personalized_content_started_at` (timestamp)
  - `personalized_content_completed_at` (timestamp)

### Content Storage (Multiple Overlapping Tables)

#### Personalized Content Tables
- `hr_personalized_course_content` - Main intended table for personalized content
  - `id` (uuid, PK)
  - `course_id` (uuid, FK)
  - `employee_id` (uuid, FK)
  - `content` (jsonb)
  - `title` (text)
  - `description` (text)
  - Various metadata fields

#### Legacy Content Tables
- `ai_generated_course_content` - Older content storage
- `ai_course_content` - Another content storage with sections
  - `id` (uuid, PK)
  - `course_id` (uuid, FK)
  - `created_for_user_id` (uuid, FK)
  - `title` (text)
  - `is_active` (boolean)
  - Various metadata fields

#### Content Sections
- `ai_course_content_sections` - Sections for AI-generated content
  - `content_id` (uuid, FK)
  - `module_id` (uuid)
  - `title` (text)
  - Content fields
- `course_content_sections` - Another table for content sections

#### Other Content Related Tables
- `content_modifications`
- `ai_generated_content`
- `content_metadata`
- `content_variants`
- `ai_content_templates`
- `dynamic_course_content`
- `content_versions`
- `content_performance`
- `content_update_decisions`

## Issues with Current Schema

1. **Fragmented Content Storage**:
   - Multiple tables storing similar content without clear separation of concerns
   - No single source of truth for personalized content

2. **Missing Links**:
   - Enrollments don't reference personalized content (NULL `personalized_content_id`)
   - Some content tables link to user_id while others link to employee_id

3. **Inconsistent References**:
   - Some tables reference user_id directly, others use employee_id
   - Lack of standardized foreign key constraints

4. **Over-complex Structure**:
   - Too many content-related tables with overlapping purposes
   - No clear data lifecycle or versioning strategy

## Proposed Schema (Simplified)

### Core Entities (Same as Current)

- `hr_employees` - No changes
- `employee_user_mapping` - No changes
- `hr_courses` - No changes

### Simplified Content Schema

#### 1. Course Enrollments
```sql
CREATE TABLE hr_course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES hr_employees(id),
    course_id UUID NOT NULL REFERENCES hr_courses(id),
    status VARCHAR NOT NULL DEFAULT 'assigned',
    progress INTEGER DEFAULT 0,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    completion_date TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ,
    
    -- Content generation tracking
    personalized_content_id UUID REFERENCES personalized_course_content(id),
    generation_status VARCHAR DEFAULT 'pending',
    generation_started_at TIMESTAMPTZ,
    generation_completed_at TIMESTAMPTZ,
    generation_attempts INTEGER DEFAULT 0,
    
    UNIQUE(employee_id, course_id)
);
```

#### 2. Unified Personalized Content
```sql
CREATE TABLE personalized_course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES hr_courses(id),
    employee_id UUID NOT NULL REFERENCES hr_employees(id),
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Content metadata
    title TEXT NOT NULL,
    description TEXT,
    language VARCHAR DEFAULT 'en',
    difficulty_level VARCHAR,
    estimated_duration INTEGER,
    
    -- Personalization data
    personalization_params JSONB,
    cv_data_snapshot JSONB,
    learning_objectives JSONB,
    
    -- Content
    modules JSONB NOT NULL,
    
    -- Status information
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for versioning
    UNIQUE(course_id, employee_id, version)
);
```

#### 3. Content Sections (Optional for detailed analytics)
```sql
CREATE TABLE content_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES personalized_course_content(id),
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    content_type VARCHAR DEFAULT 'text',
    content TEXT,
    
    -- Analytics
    views INTEGER DEFAULT 0,
    average_time_spent INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_id, module_id, order_index)
);
```

#### 4. User Progress Tracking
```sql
CREATE TABLE user_section_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content_id UUID NOT NULL REFERENCES personalized_course_content(id),
    section_id UUID NOT NULL REFERENCES content_sections(id),
    status VARCHAR DEFAULT 'not_started',
    progress_percent INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    
    UNIQUE(user_id, section_id)
);
```

## Migration Strategy

1. **Data Consolidation**:
   - Move content from `ai_course_content` and `ai_generated_course_content` to `personalized_course_content`
   - Extract sections from `ai_course_content_sections` into the JSONB modules field
   
2. **Update References**:
   - Link course enrollments to personalized content using `personalized_content_id`
   
3. **Deprecate Old Tables**:
   - Keep old tables temporarily with triggers to sync data
   - Eventually remove old tables after successful migration

## Benefits of New Schema

1. **Simplified Content Storage**:
   - Single source of truth for personalized content
   - Flexible JSONB structure for modules and sections
   
2. **Clear Relationships**:
   - Direct links between courses, enrollments, and content
   - Consistent use of employee_id vs user_id
   
3. **Improved Performance**:
   - Fewer joins required for common operations
   - Better query optimization with streamlined schema
   
4. **Maintainability**:
   - Clear versioning strategy
   - Simplified data flow and lifecycle management 