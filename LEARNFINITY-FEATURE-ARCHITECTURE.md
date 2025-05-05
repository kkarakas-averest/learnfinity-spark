# LearnFinity Feature Architecture

This document outlines the architecture, data flow and integrations for key features of the LearnFinity LMS platform.

## 1. HR Employee Management

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Employee Profile   │────►│  Department/Position│────►│  User Account       │
│  Management         │     │  Management         │     │  Integration        │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Course Assignment  │────►│  Reporting &        │────►│  Employee Activity  │
│  Module             │     │  Analytics          │     │  Tracking           │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Employee Creation Flow**:
   - HR creates employee profile with basic information
   - System assigns to department/position
   - Auto-generates user account or links to existing user
   - Triggers welcome email via Resend

2. **Department Management Flow**:
   - HR creates/updates departments and positions
   - System updates hierarchical relationship
   - Updates reporting structure for analytics

3. **Employee Status Updates**:
   - HR updates employee status (active, on leave, terminated)
   - System adjusts access permissions
   - Updates metrics and reporting

### Integration Points 🔌

- **Authentication System**: Bidirectional sync with Supabase Auth
- **Notification System**: Triggers for onboarding, status changes, assignments
- **Analytics Engine**: Provides data for organizational metrics and reporting
- **Course Management**: Enables bulk and individual course assignments

### Component Structure 📦

- **EmployeeForm**: Core component for creating/editing employee profiles
- **DepartmentManager**: Interface for managing organizational structure
- **EmployeeTable**: Filterable, sortable employee listing with bulk actions
- **EmployeeDetail**: Comprehensive view of employee information and progress
- **CourseAssignmentPanel**: Interface for assigning courses to employees

## 2. HR CV Summarization

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Document Upload    │────►│  CV Processing      │────►│  Skill Extraction   │
│  Interface          │     │  Pipeline           │     │  Engine             │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Profile            │◄────│  Extracted Data     │◄────│  Information        │
│  Enhancement        │     │  Storage            │     │  Verification       │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Document Upload Flow**:
   - HR uploads PDF/DOCX resume for employee
   - System validates document type and size
   - Stores raw document in Supabase Storage
   - Triggers processing pipeline

2. **Processing Pipeline Flow**:
   - Document converted to text using appropriate parser
   - Text sent to Groq LLM for structure extraction
   - Structured data validated and formatted
   - Results stored in employee record

3. **Information Verification Flow**:
   - HR reviews extracted information
   - Approves/modifies extracted data points
   - Confirms skill tagging and categorization
   - System finalizes skill profile

### Integration Points 🔌

- **Storage System**: Uses Supabase Storage for document management
- **LLM Service**: Leverages Groq API for intelligent extraction
- **Skills Database**: Maps extracted skills to standardized taxonomy
- **Employee Profile**: Updates profile with verified extracted data

### Component Structure 📦

- **CVUploader**: File upload interface with progress indicator
- **ExtractedDataReview**: Interactive interface for reviewing extracted data
- **SkillTagEditor**: Component for managing extracted skills
- **DocumentViewer**: Preview of the uploaded document with highlighting
- **ExtractionLogViewer**: Shows the processing status and history

## 3. HR Skills GAP Analysis

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Skills Inventory   │────►│  Role Requirement   │────►│  Gap Analysis       │
│  Database           │     │  Profiles           │     │  Engine             │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Learning Path      │◄────│  Individual         │◄────│  Department         │
│  Recommendation     │     │  Development Plans  │     │  Skill Matrix       │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Skills Inventory Flow**:
   - System compiles skills from CV extraction, course completions, and HR input
   - Skills categorized by domain, proficiency level, and relevance
   - Regular updates based on learning activities
   - Validation checks for consistency

2. **Gap Analysis Flow**:
   - System compares employee skills against role requirements
   - Calculates gap scores by category and overall
   - Generates prioritized list of skill needs
   - Updates RAG status indicators

3. **Recommendation Flow**:
   - Gap analysis triggers course recommendations
   - AI generates personalized learning paths
   - Learning paths presented to HR for approval
   - Approved paths assigned to employees

### Integration Points 🔌

- **Course Catalog**: Maps available courses to required skills
- **Personalization Engine**: Uses gap analysis for content customization
- **Analytics System**: Provides organizational skill health metrics
- **Notification System**: Alerts HR and employees about critical gaps

### Component Structure 📦

- **SkillMatrixDashboard**: Visual representation of skills across teams
- **GapAnalysisReport**: Detailed breakdown of individual and team gaps
- **SkillHeatmap**: Visual representation of organizational skill distribution
- **LearningPathDesigner**: Interface for creating skill-based learning paths
- **SkillTrendAnalyzer**: Tracks skill acquisition over time

## 4. Groq LLM System Integration

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Prompt Management  │────►│  LLM Gateway        │────►│  Response           │
│  System             │     │  Service            │     │  Processor          │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Agent Role         │────►│  Contextual Memory  │────►│  Content            │
│  Manager            │     │  System             │     │  Assembly Engine    │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Prompt Preparation Flow**:
   - System selects appropriate prompt template based on context
   - Merges template with dynamic data (user profile, course info)
   - Applies jailbreak prevention and safety measures
   - Prepares context window with relevant information

2. **LLM Interaction Flow**:
   - Gateway service sends prepared prompt to Groq API
   - Manages API connection, retries, and failovers
   - Handles streaming responses for real-time UI updates
   - Logs interactions for quality improvement

3. **Response Processing Flow**:
   - System validates and sanitizes LLM response
   - Structures response according to expected format
   - Extracts actionable items and metadata
   - Delivers processed content to appropriate interface

### Agent Roles & Specialized Engines 🤖

1. **Content Creation Agent**
   - Purpose: Generate personalized course materials
   - Models: Primarily llama3-70b-8192 for high-quality content
   - Context: Employee profile, learning objectives, previous content
   - Output: Structured course modules with assessments

2. **CV Analysis Agent**
   - Purpose: Extract structured information from resumes
   - Models: llama3-8b-8192 for efficient processing
   - Context: Document text, skill taxonomy
   - Output: Structured profile data with confidence scores

3. **Learning Path Agent**
   - Purpose: Design personalized learning journeys
   - Models: llama3-70b-8192 for sophisticated planning
   - Context: Skill gaps, course catalog, career objectives
   - Output: Sequenced learning paths with rationale

4. **RAG Status Agent**
   - Purpose: Assess progress and identify knowledge gaps
   - Models: gemma-7b-it for specific analytical tasks
   - Context: Course completions, assessment results, activity logs
   - Output: Status reports with actionable recommendations

### Integration Points 🔌

- **User Interface**: Provides real-time interaction via chat components
- **Content Database**: Stores generated content for reuse and refinement
- **Monitoring System**: Tracks LLM performance and response quality
- **Feedback Loop**: Incorporates user feedback for model improvement

## 5. Learner Dashboard

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Course Enrollment  │────►│  Progress Tracking  │────►│  Recommendation     │
│  Display            │     │  Module             │     │  Engine             │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Activity Feed      │────►│  Learning Path      │────►│  AI Learning        │
│  & Notifications    │     │  Visualizer         │     │  Assistant          │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Dashboard Initialization Flow**:
   - System fetches user's enrolled courses and learning paths
   - Calculates progress metrics and completion statistics
   - Generates personalized recommendations based on profile
   - Prepares notification digest and activity feed

2. **Progress Tracking Flow**:
   - Real-time updates from course interaction events
   - Calculation of progress percentages and time estimates
   - Generation of milestone achievements and badges
   - Synchronization with analytics for reporting

3. **Recommendation Flow**:
   - Analysis of current progress and remaining content
   - Identification of learning patterns and preferences
   - Generation of next-best-action recommendations
   - Personalized content suggestions based on interests

### Integration Points 🔌

- **Course System**: Displays enrolled and available courses
- **Notification Center**: Shows alerts, reminders, and updates
- **Progress API**: Tracks completion across learning activities
- **AI Assistant**: Provides contextual help and recommendations

### Component Structure 📦

- **EnrollmentCards**: Visual cards showing course enrollments
- **ProgressTracker**: Visual indicators of completion status
- **LearningPathViewer**: Visual journey map of learning progression
- **ActivityFeed**: Timeline of recent learning activities
- **RecommendationPanel**: Personalized content suggestions
- **AIAssistantChat**: Contextual help and guidance interface

## 6. Individual Course View

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Course Content     │────►│  Progress Tracking  │────►│  Interactive        │
│  Renderer           │     │  Engine             │     │  Components         │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Content            │◄────│  Assessment         │◄────│  Personalization    │
│  Navigation         │     │  Engine             │     │  Layer              │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Course Loading Flow**:
   - System fetches personalized course structure
   - Prepares content modules and sections for rendering
   - Retrieves progress data and last position
   - Initializes interactive components and assessments

2. **Content Navigation Flow**:
   - User navigates between modules and sections
   - System tracks completion and time spent
   - Automatically saves progress after section completion
   - Updates navigation state based on prerequisites

3. **Assessment Flow**:
   - User completes interactive assessments
   - System grades responses in real-time
   - Stores results and provides immediate feedback
   - Updates course completion status based on results

### Integration Points 🔌

- **Content Database**: Sources course materials and structures
- **Progress API**: Records completion and assessment results
- **Personalization Engine**: Customizes content presentation
- **Media Services**: Handles embedded videos and interactive media

### Component Structure 📦

- **CourseHeader**: Title, progress bar, and key information
- **ModuleNavigator**: Sidebar for navigating course structure
- **ContentRenderer**: Primary content display with markdown support
- **QuizComponent**: Interactive assessment with various question types
- **FeedbackWidget**: Mechanism for rating and commenting on content
- **ProgressIndicator**: Visual representation of course progress
- **ContentRegenerationButton**: Interface for refreshing AI-generated content

## 7. Regenerate Content Button Integration

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  UI Trigger         │────►│  Regeneration       │────►│  Content            │
│  Component          │     │  Request Handler    │     │  Processing Queue   │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Progress           │◄────│  LLM Integration    │◄────│  Content Versioning │
│  Indicator          │     │  Service            │     │  System             │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Regeneration Trigger Flow**:
   - User requests content regeneration via UI button
   - System validates eligibility (rate limits, permissions)
   - Creates regeneration job with context parameters
   - Updates UI to show processing status

2. **Content Processing Flow**:
   - Regeneration job added to priority queue
   - System gathers context (previous content, feedback, preferences)
   - LLM service generates new content variation
   - Content validation ensures quality standards

3. **Delivery Flow**:
   - System saves new content version with metadata
   - Updates content display with new material
   - Records regeneration event for analytics
   - Notifies user of completion

### Integration Points 🔌

- **LLM Service**: Processes regeneration requests
- **Content Database**: Handles versioning and storage
- **User Preferences**: Incorporates personalization parameters
- **Analytics**: Tracks regeneration patterns and effectiveness

### Component Structure 📦

- **RegenerateButton**: Primary UI trigger with status indicator
- **FeedbackForm**: Optional reason collection for regeneration
- **VersionHistory**: Interface for viewing previous content versions
- **LoadingIndicator**: Visual feedback during regeneration
- **ContentDiffViewer**: Optional comparison between versions

## 8. HR Dashboard CourseAI Builder Interface

### Architecture Overview 🏗️

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Course Template    │────►│  Chat Interface     │────►│  AI Content         │
│  Manager            │     │  Component          │     │  Generator          │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                           │                           │
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Content Structure  │◄────│  Content Preview    │◄────│  Media              │
│  Editor             │     │  & Testing          │     │  Integration        │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Data Flow 🔄

1. **Course Creation Flow**:
   - HR initiates new course with basic parameters
   - System presents template options and structure
   - HR interacts with AI via chat to refine concept
   - AI generates course outline and objectives

2. **Content Development Flow**:
   - AI suggests module structure based on objectives
   - HR refines through conversational interface
   - System generates detailed content for each module
   - HR reviews, edits, and approves sections

3. **Publication Flow**:
   - HR reviews complete course in preview mode
   - System runs validation checks on content
   - HR assigns course to departments/roles
   - System publishes and notifies relevant employees

### Integration Points 🔌

- **Template Library**: Provides starting points for courses
- **LLM Service**: Powers conversational course creation
- **Media Library**: Manages images and videos for courses
- **Course Catalog**: Publishes completed courses

### Component Structure 📦

- **CourseBuilderChat**: Primary conversational interface
- **CourseStructureTree**: Visual hierarchy editor for course
- **ContentEditor**: Rich text editor for manual refinements
- **MediaSelector**: Component for adding visual elements
- **PreviewPanel**: Real-time view of course as learner would see it
- **PublishWorkflow**: Steps for finalizing and publishing course

## Data Models and Relationships

### HR Employee Management

**Key Entities:**
- `Employee`: Core profile information
- `Department`: Organizational units
- `Position`: Job roles within departments
- `UserAccount`: Authentication system mapping
- `EmployeeSkill`: Many-to-many skill relationships
- `CourseAssignment`: Courses assigned to employee

**Relationships:**
- Employee belongs to Department
- Employee has Position
- Employee linked to UserAccount
- Employee has many EmployeeSkills
- Employee has many CourseAssignments

### CV Summarization

**Key Entities:**
- `Resume`: Document metadata and storage info
- `ExtractedProfile`: Structured CV data
- `SkillExtraction`: Skills identified from CV
- `ExtractionProcess`: Processing record and status
- `VerificationHistory`: HR review and adjustments

**Relationships:**
- Resume belongs to Employee
- Resume has one ExtractedProfile
- ExtractedProfile has many SkillExtractions
- ExtractionProcess tracks Resume processing
- VerificationHistory documents HR reviews

### Skills GAP Analysis

**Key Entities:**
- `SkillInventory`: Master list of skills
- `SkillCategory`: Skill groupings and taxonomy
- `RoleRequirement`: Skills needed for positions
- `SkillGapAssessment`: Individual gap analysis
- `DevelopmentPlan`: Personalized improvement plan

**Relationships:**
- SkillInventory organized by SkillCategory
- RoleRequirement references Position and SkillInventory
- SkillGapAssessment compares Employee to RoleRequirement
- DevelopmentPlan created for Employee based on SkillGapAssessment

### Groq LLM Integration

**Key Entities:**
- `PromptTemplate`: Reusable system prompts
- `AgentConfiguration`: Settings for different agent roles
- `LLMInteraction`: Record of API calls and responses
- `ContentGeneration`: Output creation tracking
- `FeedbackRecord`: User feedback on LLM outputs

**Relationships:**
- AgentConfiguration uses PromptTemplate
- LLMInteraction references AgentConfiguration
- ContentGeneration results from LLMInteraction
- FeedbackRecord linked to ContentGeneration

### Learner Dashboard

**Key Entities:**
- `UserEnrollment`: User's course registrations
- `CourseProgress`: Completion status by course
- `ActivityLog`: User learning activities
- `Recommendation`: Suggested courses/content
- `Notification`: System alerts and messages

**Relationships:**
- UserEnrollment belongs to User and Course
- CourseProgress tracks UserEnrollment
- ActivityLog records User actions
- Recommendation generated for User
- Notification delivered to User

### Course View

**Key Entities:**
- `Course`: Core course information
- `Module`: Sections within course
- `ContentSection`: Individual content pieces
- `Assessment`: Quizzes and tests
- `UserResponse`: Answers to assessments
- `ContentVersion`: Different iterations of content

**Relationships:**
- Course contains multiple Modules
- Module contains multiple ContentSections
- Module may have Assessment
- UserResponse linked to Assessment and User
- ContentSection may have multiple ContentVersions

### Content Regeneration

**Key Entities:**
- `RegenerationRequest`: Request for new content
- `RegenerationJob`: Background processing task
- `ContentVersion`: Versioned content storage
- `RegenerationMetrics`: Analytics on regeneration
- `UserPreference`: Personalization settings

**Relationships:**
- RegenerationRequest creates RegenerationJob
- RegenerationJob produces new ContentVersion
- RegenerationMetrics track request patterns
- UserPreference influences regeneration parameters

### CourseAI Builder

**Key Entities:**
- `CourseTemplate`: Starting structure patterns
- `CourseDesignSession`: HR-AI collaboration record
- `ChatInteraction`: Conversation history
- `GeneratedOutline`: AI-produced course structure
- `ContentDraft`: Unfinished course materials

**Relationships:**
- CourseDesignSession may use CourseTemplate
- CourseDesignSession has many ChatInteractions
- CourseDesignSession produces GeneratedOutline
- GeneratedOutline leads to ContentDrafts
- ContentDrafts evolve into Course and Modules 