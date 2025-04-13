
# AI Content Personalization System

## Overview

This document describes the AI-powered content personalization system that automatically generates customized course content for employees based on their CV data and course enrollments. The system analyzes employee profiles and creates tailored learning experiences to maximize relevance and effectiveness.

## Current Implementation Status

The system has several components partially implemented but lacks complete integration. This document identifies the current state, existing gaps, and provides a roadmap for completing the implementation.

## Tech Stack

- **Frontend**: React with TypeScript, Vite bundler, TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, authentication, storage)
- **LLM Integration**: Groq API via Supabase Edge Functions
- **Data Storage**: PostgreSQL tables via Supabase

## Database Structure

### Core Tables
- `hr_employees`: Stores employee information and CV data
  - Contains `cv_extracted_data` JSON field for storing parsed CV information
  - Contains `cv_file_url` field pointing to uploaded resume file
- `hr_courses`: Stores course information
- `hr_course_enrollments`: Links employees to courses
  - Contains `personalized_content_id` to link to generated content
  - Contains `personalized_content_generation_status` to track generation process
- `ai_course_content`: Stores AI-generated course content metadata
  - Contains `personalization_context` JSON field with personalization parameters
- `ai_course_content_sections`: Stores actual content sections
  - Linked to `ai_course_content` via `content_id`
- `hr_personalized_course_content`: Alternative content storage
  - Contains similar structure to `ai_course_content`

## Component Structure

### CV Processing Flow
1. **Upload Component**:
   - `resume-upload/route.ts`: Handles CV file uploads to Supabase storage

2. **CV Data Extraction**:
   - `process-cv/route.ts`: Extracts text and processes CV using Groq API
   - Stores structured data in `cv_extracted_data` field

3. **Course Assignment**:
   - HR dashboard functionality for assigning courses to employees
   - Creates records in `hr_course_enrollments`

4. **Content Generation**:
   - `universal-enhance/route.ts`: Handles generating personalized content
   - `AIAgentService` and `EmployeeContentGeneratorService`: Service layer for AI interactions
   - Uses Groq API via `LLMService`

5. **Content Display**:
   - `PersonalizedContentView.tsx`: Component for displaying personalized content
   - `PersonalizedContentService.ts`: Service for retrieving content data

## Current Workflow

1. ✅ Employee CV upload through API endpoint
2. ✅ CV data extraction using Groq API
3. ✅ Extracted data storage in employee record
4. ✅ Course assignment to employee
5. ⚠️ Personalized content generation trigger (partially implemented)
6. ⚠️ Content creation based on employee profile (partially implemented)
7. ✅ Content storage in database
8. ⚠️ Content display on learner dashboard (partially implemented)

## Identified Gaps

1. **Inconsistent Content Generation Triggers**:
   - Missing automatic trigger when an employee is enrolled in a course
   - Manual API call required to generate content
   - No retry mechanism for failed generation attempts

2. **Content Generation Feedback Loop**:
   - Limited status tracking during generation process
   - No notifications when content generation completes

3. **Service Connection Issues**:
   - Multiple service implementations causing confusion (`AIAgentService`, `EmployeeContentGeneratorService`, etc.)
   - Inconsistent API access patterns between services

4. **Content Storage Confusion**:
   - Two parallel tables (`ai_course_content` and `hr_personalized_course_content`)
   - Unclear which should be used in different circumstances

5. **Display Integration**:
   - `PersonalizedContentView` component needs better integration with existing course view
   - Error states and loading indicators are incomplete

6. **Data Schema Inconsistencies**:
   - Different expected formats between CV extraction and content generation
   - Inconsistent field names and structures

## Roadmap for Implementation

### Phase 1: Standardize Data Schema (1 day)

1. **Standardize Employee Profile Schema**:
   - Ensure `cv_extracted_data` follows a consistent schema
   - Add validation for required fields

2. **Normalize Content Storage**:
   - Decide between `ai_course_content` and `hr_personalized_course_content` (prefer the first)
   - Create migration script if needed

### Phase 2: Complete Content Generation Pipeline (2 days)

1. **Enhance Content Generation Trigger**:
   - Add trigger on course enrollment creation/update
   - Implement in `hr_course_enrollments` table via database trigger or API logic

2. **Improve Status Tracking**:
   - Expand status fields beyond "generating" to include "pending", "failed", etc.
   - Add timestamps for each status change

3. **Consolidate Service Layer**:
   - Unify `AIAgentService` and `EmployeeContentGeneratorService` functionality
   - Create clear service boundaries

### Phase 3: Enhance User Experience (2 days)

1. **Complete Learner Dashboard Integration**:
   - Enhance `CourseView` component to properly display personalized content
   - Add loading states and error handling
   - Improve navigation between standard and personalized content

2. **Add Feedback Mechanisms**:
   - Create notification when personalized content is ready
   - Add option to regenerate content if needed

3. **Add HR Dashboard Visibility**:
   - Show personalization status in HR employee view
   - Allow manual triggering of content generation

## Required API Endpoints

1. `/api/hr/employees/process-cv` (existing)
   - Processes uploaded CV and extracts data

2. `/api/hr/courses/universal-enhance` (existing)
   - Generates personalized content based on employee profile

3. `/api/course/personalization/status` (needed)
   - Returns current status of personalization process
   - Includes completion percentage and estimated time remaining

4. `/api/course/personalization/regenerate` (needed)
   - Triggers regeneration of content when needed

## Simplified Integration Approach

1. **Database Trigger**:
   - Add PostgreSQL trigger on `hr_course_enrollments` INSERT or UPDATE
   - Automatically sets personalization status to "pending" on new enrollments
   - This creates a queue of pending personalizations

2. **Background Process**:
   - Create a simple background job that checks for pending personalizations
   - Process each pending item using existing `universal-enhance` endpoint
   - Update status fields throughout the process

3. **Frontend Enhancements**:
   - Modify `CourseView` component to check for personalized content
   - Display appropriate UI based on content availability and status
   - Show generation progress when applicable

## Testing Plan

1. **Unit Tests**:
   - Test CV data extraction logic
   - Test personalization context building
   - Test content generation with mock data

2. **Integration Tests**:
   - Test end-to-end flow from CV upload to content display
   - Test error handling and recovery

3. **Manual Testing Scenarios**:
   - New employee onboarding with CV upload and course assignment
   - Existing employee assigned to new course
   - Content regeneration after profile update

## Implementation Notes

1. **Leverage Existing Code**:
   - The core components already exist but need better integration
   - Focus on connecting the dots rather than building new features

2. **Minimize New Tables**:
   - Use existing database structure where possible
   - Consider adding status tracking fields to existing tables

3. **Keep Services Simple**:
   - Avoid complex multi-agent system for initial implementation
   - Focus on reliable, direct Groq API integration

## Conclusion

The AI Content Personalization system has a strong foundation with most critical components already implemented. By focusing on integration improvements and filling specific gaps, we can complete the implementation with minimal new code. The key is standardizing data flow between existing components and ensuring reliable triggers for content generation.
