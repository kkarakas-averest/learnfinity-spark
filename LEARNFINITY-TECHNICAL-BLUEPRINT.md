# LearnFinity LMS Platform - Technical Blueprint

## 1. Product Design Requirements (PDR)

### Overall Project Vision ✨
LearnFinity is a comprehensive AI-powered Learning Management System designed for enterprise environments. It provides personalized learning experiences by leveraging AI to match employee skills, career paths, and learning objectives with tailored course content.

### Target Users 👥
- **HR Professionals**: For managing employee training, onboarding, and development
- **Learners**: Employees who consume training content and track their progress
- **Mentors**: Facilitate learning and provide guidance to learners
- **Administrators**: Manage the platform, users, and content

### Core Features ✅
- **AI-Powered Personalization**: Customizes learning content based on employee profiles and CVs
- **HR Management Dashboard**: Complete employee lifecycle management and training assignment
- **Course Builder**: Tools for creating and managing structured learning content
- **Learning Paths**: Pre-defined learning journeys combining multiple courses
- **Progress Tracking**: Comprehensive monitoring of learner advancement with RAG status indicators
- **Resume/CV Analysis**: AI extraction of skills and experience from uploaded documents
- **Multi-Role Access Control**: Role-based permissions for different user types

### Functional Requirements 📋
1. **User Authentication & Authorization**
   - Secure login/registration system with role-based access
   - Integration with Supabase Auth

2. **HR Management**
   - Employee record management
   - Department and position management
   - CV/resume upload and processing
   - Course assignment capabilities

3. **Course Management**
   - Course creation and editing
   - Module and section management
   - Content delivery in multiple formats
   - Assessment creation and tracking

4. **Personalization Engine**
   - AI analysis of user profiles and CVs
   - Custom content generation based on user needs
   - Adaptive learning paths
   - Learning gap identification

5. **Analytics & Reporting**
   - Progress dashboards
   - Completion rates and metrics
   - Department-level reporting
   - Skills gap analysis

### Non-Functional Requirements ⚙️
1. **Performance**: Fast page loads (<2s) and responsive UI
2. **Scalability**: Support for large organizations with thousands of users
3. **Security**: Data encryption, secure API access, and role-based permissions
4. **Availability**: 99.9% uptime target with fault tolerance
5. **Compliance**: Support for learning/training compliance requirements
6. **Accessibility**: WCAG 2.1 AA compliance

### Problem Solution Fit 🎯
LearnFinity solves several critical problems in enterprise learning:

1. **Generic Training Content**: Traditional LMS platforms offer one-size-fits-all content. LearnFinity provides AI-customized content tailored to each employee's background, skills, and career path.

2. **Manual Course Assignment**: HR teams typically manually match courses to employees. LearnFinity automates this with AI-powered recommendations based on CV analysis and skill gaps.

3. **Limited Engagement**: Standard LMS platforms struggle with learner engagement. LearnFinity's personalized approach increases relevance and completion rates.

4. **Training Efficiency Gaps**: Organizations waste resources on irrelevant training. LearnFinity optimizes training investment by focusing on actual skill gaps and development needs.

## 2. Tech Stack

### Frontend 🖥️
- **Core Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Routing**: React Router 6
- **UI Components**: Shadcn/UI (built on Radix UI primitives)
- **Styling**: Tailwind CSS with tailwind-merge for conditional styling
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Context API with custom hooks
- **Data Fetching**: Tanstack React Query
- **Charts & Visualization**: Recharts
- **Toast Notifications**: Sonner
- **Markdown Rendering**: React Markdown with remark-gfm

### Backend 🔧
- **API Framework**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI Models**: Groq API for LLM features
- **Email Delivery**: Resend with React Email templates
- **Analytics**: PostHog for user behavior tracking
- **Error Monitoring**: Sentry

### Development Tools ⚒️
- **Package Manager**: pnpm
- **Monorepo**: Turborepo
- **TypeScript**: For type safety across the codebase
- **ESLint & Prettier**: Code quality and formatting
- **Testing**: Vitest for unit/integration tests
- **CI/CD**: Vercel deployment pipeline
- **Version Control**: Git

### Rationale for Technology Choices

1. **React & TypeScript**: Provides robust type safety and component-based architecture ideal for complex UIs.

2. **Vite**: Offers extremely fast development server and optimized production builds compared to alternatives.

3. **Supabase**: Provides a unified platform for authentication, database, and storage with PostgreSQL reliability and scalability.

4. **Shadcn/UI & Tailwind**: Enables rapid UI development with accessible components and utility-first styling for consistency.

5. **Vercel Serverless**: Eliminates the need for dedicated backend servers while providing global deployment and scaling.

6. **Groq API**: Delivers high-performance LLM capabilities with lower latency compared to alternatives, essential for real-time content generation.

7. **React Query**: Simplifies data fetching, caching, and state synchronization with the server.

8. **Sentry & PostHog**: Provides comprehensive error tracking and analytics without significant performance impact.

## 3. Application Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                              │
│                                                                         │
│   ┌─────────────┐     ┌──────────────┐      ┌─────────────────────┐    │
│   │  React UI   │     │ State Mgmt   │      │  API Clients        │    │
│   │ Components  │◄───►│ Context/Hooks│◄────►│ (React Query)       │    │
│   └─────────────┘     └──────────────┘      └─────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EDGE/SERVERLESS FUNCTIONS                         │
│                                                                         │
│   ┌─────────────┐     ┌──────────────┐      ┌─────────────────────┐    │
│   │  API Routes │     │ Auth Middleware│     │  Service Layer      │    │
│   │             │◄───►│  & Validation │◄────►│                     │    │
│   └─────────────┘     └──────────────┘      └─────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES & STORAGE                        │
│                                                                         │
│   ┌─────────────┐     ┌──────────────┐      ┌─────────────────────┐    │
│   │  Supabase   │     │ Groq LLM API │      │  Storage            │    │
│   │  PostgreSQL │◄───►│ Agents System│◄────►│  (Documents, Media) │    │
│   └─────────────┘     └──────────────┘      └─────────────────────┘    │
│                                                                         │
│   ┌─────────────┐     ┌──────────────┐      ┌─────────────────────┐    │
│   │  Supabase   │     │ Resend Email │      │  Monitoring         │    │
│   │     Auth    │     │    Service   │      │  (Sentry, PostHog)  │    │
│   └─────────────┘     └──────────────┘      └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   User UI     │────►│  API Layer    │────►│  Database     │
│  Interactions │     │  Endpoints    │     │  Operations   │
│               │◄────│               │◄────│               │
└───────────────┘     └───────┬───────┘     └───────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │               │
                      │  AI Agents    │
                      │  System       │
                      │               │
                      └───────┬───────┘
                              │
                              ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  Content      │◄────│  Groq LLM     │────►│ Personalization│
│  Generation   │     │  API          │     │ Engine        │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Database Architecture

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  User & Auth      │────►│  HR & Employee    │────►│ Personalized      │
│  Tables           │     │  Tables           │     │ Content Tables    │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Course & Module  │────►│  Learning Path    │────►│  Progress         │
│  Tables           │     │  Tables           │     │  Tracking Tables  │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

### AI Integration Architecture

```
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│  User Profile     │────►│  CV Analysis      │
│  Data             │     │  Agent            │
│                   │     │                   │
└───────────────────┘     └─────────┬─────────┘
                                    │
                                    ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Learning Path    │◄────│  Personalization  │────►│  Content Creation │
│  Generation       │     │  Manager Agent    │     │  Agent            │
│                   │     │                   │     │                   │
└───────────────────┘     └─────────┬─────────┘     └───────────────────┘
                                    │
                                    ▼
                          ┌───────────────────┐
                          │                   │
                          │  RAG System       │
                          │  Agent            │
                          │                   │
                          └───────────────────┘
```

## 4. Key Features & Implementation Details

### Authentication & Authorization System

- Multi-tenant authentication via Supabase Auth
- Role-based access control with defined roles: learner, mentor, hr, superadmin
- Protected routes with role-based middleware
- JWT-based authentication with refresh token rotation

### HR Management Module

- Complete employee lifecycle management
- Department and position hierarchy
- CV/Resume upload with AI-powered extraction
- Bulk import capabilities with validation
- Employee-to-user account mapping
- Reporting and analytics dashboard

### Course Management System

- Course creation and organization
- Module and section structured content
- Rich content editor with markdown support
- Media embedding and interactive elements
- Assessment creation and grading
- Course visibility and access controls

### AI Personalization Engine

- Multi-agent system architecture:
  - Personalization Agent: Analyzes user profiles and recommends content
  - Content Creation Agent: Generates customized learning materials
  - RAG System Agent: Tracks progress and identifies knowledge gaps
- Integration with Groq LLM API for natural language processing
- Fallback mechanisms for API unavailability
- Background processing queue for content generation

### Learning Experience

- Personalized dashboard for learners
- Progress tracking with visual indicators
- Interactive course content
- Assessment and quiz functionality
- Learning path visualization and progression
- AI-powered learning assistant

### Notification System

- Real-time in-app notifications
- Email notifications via Resend
- Notification preferences and controls
- Priority-based notification display
- Notification grouping and management

### Analytics & Reporting

- HR-level organizational analytics
- Learner progress metrics
- Course completion and engagement stats
- Department and team performance
- Skills gap analysis and recommendations
- Exportable reports in multiple formats

## 5. Database Schema

The database is built on PostgreSQL via Supabase with the following key table groups:

### User & Authentication Tables
- `auth.users`: Managed by Supabase Auth
- `user_profiles`: Extended user information
- `user_preferences`: User configuration settings
- `user_roles`: Role-based access control

### HR & Employee Management Tables
- `hr_employees`: Core employee records
- `hr_departments`: Organizational structure
- `hr_positions`: Job positions
- `employee_user_mapping`: Links employees to users

### Course Management Tables
- `hr_courses`: Course catalog
- `course_modules`: Modules within courses
- `module_sections`: Content sections
- `hr_learning_paths`: Defined learning journeys
- `hr_learning_path_courses`: Maps courses to paths

### Content & Personalization Tables
- `personalized_course_content`: AI-generated content
- `content_sections`: Detailed content structure
- `user_section_progress`: Granular progress tracking

### Enrollment & Progress Tables
- `hr_course_enrollments`: Course assignments and progress
- `hr_learning_path_enrollments`: Path enrollments
- `hr_employee_activities`: Learning activity logs

## 6. Deployment Architecture

LearnFinity is deployed on Vercel with the following components:

- Frontend: Vite-built static assets served via Vercel CDN
- API: Serverless functions for dynamic operations
- Database: Supabase PostgreSQL instance
- Storage: Supabase Storage for documents and media
- Monitoring: Sentry for error tracking and PostHog for analytics
- Email: Resend for transactional emails

### Deployment Workflow
1. Code is pushed to the repository
2. Vercel CI/CD pipeline runs tests and builds the application
3. Preview deployments are created for PR reviews
4. Production deployment occurs after PR approval and merge
5. Environment variables are managed via Vercel project settings

## 7. Future Roadmap

1. **Enhanced AI Integration** 🧠
   - Advanced recommendation algorithms
   - Automated content quality assessment
   - Personalized assessment generation

2. **Mobile Applications** 📱
   - Native mobile apps for iOS and Android
   - Offline content access
   - Push notifications

3. **Extended Analytics** 📊
   - Predictive analytics for learning outcomes
   - Machine learning for engagement optimization
   - ROI calculation for training initiatives

4. **Integration Capabilities** 🔄
   - HRIS system integration
   - SSO with enterprise identity providers
   - LTI compliance for external content

5. **Collaborative Learning** 👥
   - Peer-to-peer learning features
   - Group assignments and projects
   - Social learning elements 