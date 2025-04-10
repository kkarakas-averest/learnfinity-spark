# Course Personalization System

This document provides a comprehensive overview of how the course personalization system works in Learnfinity.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Personalization Parameters](#personalization-parameters)
4. [Content Generation Process](#content-generation-process)
5. [Personalized Insights](#personalized-insights)
6. [Technical Implementation](#technical-implementation)

## Overview

The course personalization system adapts educational content to individual learners based on their:

- Learning style preferences
- Role and department context
- Career goals and interests
- Prior knowledge and experience
- Learning progress and engagement patterns

This personalization happens through an AI-powered educator agent that creates and modifies course content, as well as generates real-time personalized insights.

## Key Components

### CourseContentService

The central service responsible for:
- Fetching and generating course content
- Managing personalization parameters
- Creating personalized content records in the database
- Tracking completion status and progress

### EducatorAgent

An AI agent that:
- Generates module and section content
- Creates personalized learning paths
- Adapts content based on learner profiles
- Provides learning insights and recommendations

### PersonalizedCourseView

UI component that:
- Displays personalized course content
- Shows AI-generated insights
- Tracks user progress
- Provides adaptive learning experience

## Personalization Parameters

### LearnerProfile

```typescript
export interface LearnerProfile {
  id: string;
  name: string;
  role?: string;
  department?: string;
  skillLevel?: DifficultyLevel;
  learningPreferences?: {
    contentTypes?: ContentType[];
    pace?: 'slow' | 'medium' | 'fast';
    visualLearner?: boolean;
    preferredTime?: string;
  };
  completedCourses?: string[];
  inProgressCourses?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  careerGoals?: string[];
}
```

### PersonalizationParams

```typescript
export interface PersonalizationParams {
  learnerId: string;
  learnerProfile: LearnerProfile;
  contentId?: string;
  courseId?: string;
  moduleId?: string;
  difficultyLevel?: DifficultyLevel;
  topics?: string[];
  keywords?: string[];
  contentTypes?: ContentType[];
  length?: 'short' | 'medium' | 'long';
}
```

### PersonalizationContext

```typescript
export interface PersonalizationContext {
  userProfile: {
    role: string;
    department?: string;
    preferences: any;
  };
  courseContext: {
    title: string;
    level: string;
    learningObjectives: string[];
  };
  employeeContext?: {
    hire_date?: string;
    department?: string;
    position?: string;
  } | null;
}
```

## Content Generation Process

1. **Initialization**:
   - User requests course content
   - System retrieves or creates learner profile
   - CourseContentService fetches course information

2. **Agent Creation**:
   - System initializes the Agent Factory
   - Creates an Educator Agent instance

3. **Content Request Formation**:
   - Creates content outline based on course type
   - Forms personalized content request with:
     - User role and department
     - Course level and objectives
     - Learning preferences

4. **Database Record Creation**:
   - Creates an AI course content record
   - Stores personalization context

5. **Module Generation**:
   - For each module in the content outline:
     - Creates module-specific content request
     - Educator agent generates content
     - Saves sections and quiz questions
     - Records module structure and resources

6. **Adaptation Process**:
   The EducatorAgent's `personalizeContent` method:
   - Takes original content and personalization parameters
   - Uses LLM to adapt content based on learner profile
   - Applies one of four adaptation types:
     - `simplify`: Reduces complexity for beginners
     - `elaborate`: Adds details for advanced learners
     - `restyle`: Adapts to learning style (visual, auditory, etc.)
     - `supplement`: Adds content related to interests and goals

## Personalized Insights

The system provides real-time personalized insights through:

1. **Types of Insights**:
   - **Tips**: Learning strategies based on the user's style
   - **Connections**: Links to previous knowledge or experience
   - **Challenges**: Additional activities to deepen understanding
   - **Notes**: Important points to remember

2. **Insight Generation Process**:
   - User completes sections or views content
   - System triggers insight generation via Educator Agent
   - Agent analyzes user's profile and progress
   - Generates contextually relevant insights

3. **Presentation**:
   - Insights are displayed in the "AI Insights" tab
   - Styled differently based on type
   - Updated when user completes sections

## Technical Implementation

### Database Structure

The system uses several tables:
- `ai_course_content`: Stores main content records with personalization context
- `ai_course_content_sections`: Contains section content
- `ai_course_quiz_questions`: Stores personalized quiz questions
- `content_completions`: Tracks user progress

### LLM Integration

The EducatorAgent integrates with an LLM service:
- Checks if an LLM is configured and available
- Falls back to rule-based approaches if unavailable
- Constructs detailed prompts that include learner profiles
- Handles context formatting and response parsing

### Adaptation Types Logic

```typescript
private determineAdaptationType(
  profile: LearnerProfile, 
  contentId: string
): 'simplify' | 'elaborate' | 'restyle' | 'supplement' {
  if (profile.experienceLevel === 'beginner') {
    return 'simplify';
  } else if (profile.experienceLevel === 'expert') {
    return 'elaborate';
  } else if (profile.learningStyle === 'visual' || profile.learningStyle === 'auditory') {
    return 'restyle';
  } else {
    return 'supplement';
  }
}
```

## Usage Example

```typescript
// Creating personalized content for a user
const personalizationContext = {
  userProfile: {
    role: learnerProfile.role,
    department: learnerProfile.department,
    preferences: learnerProfile.preferences
  },
  courseContext: {
    title,
    level,
    learningObjectives: contentOutline.learningObjectives
  },
  employeeContext: employeeData ? {
    hire_date: employeeData.hire_date,
    department: employeeData.department,
    position: employeeData.position
  } : null
};

// Generating insights for a user
const insightTask = {
  type: 'adapt_content',
  data: {
    employeeId: user.id,
    contentId: courseId,
    learnerData: {
      courseProgress: progress
    }
  }
};
const result = await educatorAgent.processTask(insightTask);
``` 