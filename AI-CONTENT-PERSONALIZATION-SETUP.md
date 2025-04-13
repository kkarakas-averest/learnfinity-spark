# AI Content Personalization Setup

This document outlines the workflow for AI-powered content personalization based on employee CV data and course enrollment.

## Overview

The content personalization workflow consists of the following steps:

1. Employee CV upload and profile generation
2. Course enrollment
3. Automatic personalized content generation
4. Content display in the learner dashboard

## Setup Instructions

### 1. Database Setup

Run the setup script to create the necessary database triggers and columns:

```bash
chmod +x setup-personalization-triggers.sh
./setup-personalization-triggers.sh
```

This script:
- Creates a trigger to mark enrollments for personalization
- Adds necessary columns to track personalization status
- Creates indexes for efficient querying

### 2. Processing Personalization Queue

The system uses a queue-based approach to process personalization requests:

- When an employee is enrolled in a course, the enrollment is automatically marked with `personalized_content_generation_status = 'pending'`
- The personalization queue processor API endpoint can be called to process pending requests
- You can manually trigger personalization for specific enrollments using the trigger API

### 3. Setting Up Regular Processing

To ensure personalization requests are processed regularly, set up a cron job or scheduled task to call the queue processor API endpoint:

```bash
# Example cron job (every 15 minutes)
*/15 * * * * curl -X POST https://your-domain.com/api/hr/courses/process-personalization-queue
```

Or use a service like Vercel Cron to schedule the endpoint:

```json
{
  "crons": [
    {
      "path": "/api/hr/courses/process-personalization-queue",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## How It Works

### CV Upload and Processing

1. When a CV is uploaded, it's stored in Supabase storage
2. The `/api/hr/resume-upload` endpoint updates the employee record with the CV URL
3. The `/api/hr/employees/process-cv` endpoint extracts profile information using Groq LLM API
4. The extracted profile data is stored in the `hr_employees` table

### Course Enrollment and Personalization

1. When an employee is enrolled in a course, the database trigger sets `personalized_content_generation_status = 'pending'`
2. The personalization queue processor:
   - Finds pending personalization requests
   - Retrieves employee profile data
   - Generates personalized content using Groq LLM API
   - Stores the generated content in the database
   - Updates the enrollment with a link to the personalized content

### Content Display

The `PersonalizedContentView` component displays the personalized content to the learner, showing:
- Personalization context (based on their profile)
- Personalized content sections
- Loading/generation status indicators

## API Endpoints

### Process Personalization Queue

```
POST /api/hr/courses/process-personalization-queue
```

Process a batch of pending personalization requests. Accepts an optional `limit` parameter.

### Trigger Personalization

```
POST /api/hr/courses/trigger-personalization
```

Manually trigger personalization for a specific enrollment. Requires an `enrollmentId` parameter.

### Check Queue Status

```
GET /api/hr/courses/process-personalization-queue
```

Check the current status of the personalization queue, showing pending and in-progress counts.

## Troubleshooting

### Content Not Being Generated

1. Check if the enrollment has `personalized_content_generation_status` set to 'pending'
2. Ensure the CV processing has completed successfully
3. Call the trigger personalization endpoint for the specific enrollment
4. Check the API logs for errors

### Queue Processing Issues

1. Make sure the LLM service (Groq API) is properly configured
2. Check database connection and permissions
3. Verify that the necessary columns exist in the `hr_course_enrollments` table
4. Manually run the queue processing API to check for errors 