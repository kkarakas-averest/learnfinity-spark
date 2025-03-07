# Learnfinity Technical Implementation Plan

## 1. Current Technical Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library (likely shadcn/ui)
- **Routing**: React Router
- **State Management**: 
  - Transitioning from context-based to custom hook-based pattern
  - Migration in progress (evident from *Migrated.tsx files)

### Backend/Services
- **Database**: Supabase 
- **Authentication**: Supabase Auth
- **API Layer**: Custom service modules interacting with Supabase

### AI Infrastructure (To Be Implemented)
- **Agent Framework**: CrewAI for multi-agent orchestration
- **LLM Provider**: Groq for fast inference speeds
- **Models**: 
  - Mixtral-8x7b-32768 for complex reasoning tasks
  - Llama3-8b-8192 for simpler operations
- **Integration**: Custom API wrappers for Groq integration with CrewAI

## 2. Implementation Plan for PRD Alignment

### Phase 1: Agent System Foundation (2-3 weeks)

#### 1.1 Multi-Agent System Core Architecture
- Implement the base agent structure using CrewAI
- Set up Groq API integration for LLM capabilities
- Create the six core agents from the MAS PRD:
  - Manager Agent
  - Personalization Agent
  - Content Creator Agent
  - Feedback & Adaptation Agent
  - RAG System Agent
  - Reporting Agent
- Implement agent coordination and communication patterns
- Create task definitions for all agent operations

#### 1.2 Data Flow Infrastructure
- Design database schema extensions for agent operation
- Implement state management for agent interactions
- Create API endpoints for dashboard-to-agent communication
- Set up real-time data synchronization mechanisms

### Phase 2: HR Dashboard Enhancement (3-4 weeks)

#### 2.1 Employee Tracking with RAG System
- Extend employee data models to include RAG status properties
- Implement RAG status visualization components
- Create real-time progress tracking with visual timelines
- Integrate with RAG System Agent for automated status determination

#### 2.2 Intervention Tools
- Implement content modification interface for HR users
- Create assignable remedial material components
- Build notification management system for HR interventions
- Integrate with Content Creator Agent for dynamic content adjustments

#### 2.3 Feedback Reports
- Create detailed feedback collection and display components
- Implement aggregated report views for organization-wide trends
- Integrate with Feedback & Adaptation Agent for analysis
- Build reporting tools for HR decision-making

### Phase 3: Learner Dashboard Implementation (3-4 weeks)

#### 3.1 Personalized Learning Path
- Create learning path visualization components
- Implement module status tracking (Not Started, In Progress, Completed)
- Integrate with Personalization Agent for dynamic path generation
- Build UI for displaying recommended next steps

#### 3.2 Progress Tracking with RAG Indicators
- Implement learner-facing RAG status visualization
- Create progress tracking components with clear metrics
- Build notification system for status changes
- Integrate with RAG System Agent for status updates

#### 3.3 Calendar and Notifications
- Implement learning calendar with deadlines and schedules
- Create notification center for learner alerts
- Build integration with external calendar systems
- Link with Manager Agent for scheduling optimization

### Phase 4: System Integration and Optimization (2-3 weeks)

#### 4.1 End-to-End Testing
- Create test scenarios for all agent interactions
- Implement automated testing for data flows
- Perform load testing on agent system
- Optimize performance bottlenecks

#### 4.2 Real-Time Updates
- Implement WebSocket connections for live dashboard updates
- Create background processing for agent tasks
- Optimize database queries for real-time operations
- Set up monitoring and logging for agent activities

## 3. Technical Implementation Details

### 3.1 CrewAI + Groq Integration

```typescript
// Base agent structure
export class BaseAgent extends Agent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      llm: new GroqAPI({
        model: 'mixtral-8x7b-32768',
        temperature: 0.4,
      }),
    });
  }
}

// Agent crew orchestration
export class LearningCrew {
  private crew: Crew;
  
  constructor() {
    const managerAgent = new ManagerAgent();
    const personalizationAgent = new PersonalizationAgent();
    const contentCreatorAgent = new ContentCreatorAgent();
    const feedbackAgent = new FeedbackAdaptationAgent();
    const ragAgent = new RAGSystemAgent();
    const reportingAgent = new ReportingAgent();
    
    this.crew = new Crew({
      agents: [
        managerAgent,
        personalizationAgent,
        contentCreatorAgent,
        feedbackAgent,
        ragAgent,
        reportingAgent
      ],
      tasks: learningTasks,
      verbose: process.env.NODE_ENV === 'development',
    });
  }
  
  async run(employeeData, courseData) {
    return await this.crew.run({ employeeData, courseData });
  }
}
```

### 3.2 Agent-Specific Implementations

#### RAG System Agent (Core to Both Dashboards)
```typescript
export class RAGSystemAgent extends BaseAgent {
  constructor() {
    super({
      name: 'RAG System Agent',
      role: 'Progress Tracking Specialist',
      goal: 'Monitor learner progress and assign appropriate RAG status',
      backstory: 'You analyze learning patterns and engagement metrics to determine when learners need intervention.',
    });
  }
  
  async determineRAGStatus(learnerData) {
    // Agent logic to analyze progress and assign status
    // Returns: { status: 'green'|'amber'|'red', justification: string, recommendedActions: string[] }
  }
}
```

#### Personalization Agent (Learner Dashboard)
```typescript
export class PersonalizationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Personalization Agent',
      role: 'Learning Path Designer',
      goal: 'Create optimal personalized learning experiences',
      backstory: 'You craft custom learning journeys based on individual needs, preferences, and progress.',
    });
  }
  
  async generateLearningPath(employeeProfile, courseLibrary) {
    // Agent logic to create personalized learning paths
    // Returns structured learning plan with modules, timelines, and alternative paths
  }
}
```

#### Content Creator Agent (HR Intervention)
```typescript
export class ContentCreatorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Content Creator Agent',
      role: 'Adaptive Content Specialist',
      goal: 'Generate and modify learning content based on needs',
      backstory: 'You create targeted learning materials to address specific gaps and learning styles.',
    });
  }
  
  async generateRemediationContent(learningGap, learnerPreferences) {
    // Agent logic to create customized learning content
    // Returns content modules, quizzes, and interactive elements
  }
}
```

### 3.3 Database Schema Extensions

```sql
-- RAG Status Tracking
CREATE TABLE IF NOT EXISTS learner_rag_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  status VARCHAR(10) NOT NULL CHECK (status IN ('green', 'amber', 'red')),
  justification TEXT,
  recommended_actions JSONB,
  agent_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Personalized Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  current_module_id UUID REFERENCES learning_modules(id),
  path_structure JSONB,
  agent_generated BOOLEAN DEFAULT TRUE,
  hr_modified BOOLEAN DEFAULT FALSE,
  last_updated_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification System
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES employees(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_link VARCHAR(200),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 Frontend Integration

#### HR Dashboard Integration
```typescript
// src/hooks/useAgentSystem.ts
export function useAgentSystem() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  
  const determineEmployeeRAGStatus = async (employeeId) => {
    setIsProcessing(true);
    
    try {
      const crew = new LearningCrew();
      const ragResults = await crew.run({ 
        task: 'determineRAGStatus',
        employeeId,
        includeJustification: true
      });
      
      // Update database with results
      await hrServices.updateEmployeeRAGStatus(employeeId, ragResults);
      
      setResults(ragResults);
      return ragResults;
    } catch (err) {
      console.error('RAG status determination error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Other agent interactions...
  
  return {
    isProcessing,
    results,
    determineEmployeeRAGStatus,
    generateRemediationContent,
    // Other methods...
  };
}
```

#### Learner Dashboard Integration
```typescript
// src/hooks/useLearnerPath.ts
export function useLearnerPath(employeeId) {
  const [path, setPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { processWithAgents } = useAgentSystem();
  
  useEffect(() => {
    const fetchLearningPath = async () => {
      setIsLoading(true);
      
      // First try to get cached path
      const cachedPath = await learnerServices.getLearningPath(employeeId);
      
      if (cachedPath) {
        setPath(cachedPath);
        setIsLoading(false);
        
        // Refresh in background if older than 24 hours
        if (isPathStale(cachedPath)) {
          refreshPathInBackground();
        }
      } else {
        // Generate new path
        await refreshPath();
      }
    };
    
    fetchLearningPath();
  }, [employeeId]);
  
  const refreshPath = async () => {
    setIsLoading(true);
    
    const employeeData = await employeeServices.getEmployeeDetails(employeeId);
    const courseData = await courseServices.getAvailableCourses();
    
    const newPath = await processWithAgents('generateLearningPath', {
      employeeData,
      courseData
    });
    
    await learnerServices.saveLearningPath(employeeId, newPath);
    setPath(newPath);
    setIsLoading(false);
  };
  
  // Helper methods...
  
  return {
    path,
    isLoading,
    refreshPath
  };
}
```

## 4. Implementation Schedule & Dependencies

### Month 1: Foundation
- Week 1-2: Set up CrewAI + Groq integration
- Week 3-4: Implement core agent structure and test basic functionality

### Month 2: HR Dashboard
- Week 1-2: Implement RAG system and employee tracking
- Week 3-4: Build intervention tools and feedback reports

### Month 3: Learner Dashboard
- Week 1-2: Create personalized learning path components
- Week 3-4: Implement progress tracking and calendar features

### Month 4: Integration & Polish
- Week 1-2: Connect all components and test end-to-end flows
- Week 3-4: Optimize performance and deploy to production

## 5. Technical Considerations

### 5.1 State Management
- Extend the state migration architecture to accommodate agent-based operations
- Create agent-specific hooks for component integration
- Implement caching and optimistic UI updates for agent operations

### 5.2 Real-Time Updates
- Use WebSockets or long-polling for dashboard updates
- Implement background processing for time-intensive agent tasks
- Consider serverless functions for handling agent operations

### 5.3 Performance Optimization
- Implement request batching for multiple agent queries
- Cache frequently used agent responses
- Use streaming responses for long-running agent tasks

### 5.4 Security & Privacy
- Implement role-based access control for agent operations
- Ensure PII is properly handled in agent contexts
- Audit all agent-initiated actions for compliance

## 6. Conclusion

This implementation plan provides a comprehensive approach to building the complete system described in the PRDs using CrewAI and Groq. The integration of these technologies will enable:

1. A fully-featured HR Dashboard with real-time RAG tracking and intervention tools
2. A personalized Learner Dashboard with adaptive learning paths
3. A sophisticated Multi-Agent System powering both dashboards from behind the scenes

The implementation prioritizes critical features first while establishing the foundation for the complete system, ensuring that all PRD requirements are met through the CrewAI + Groq agent architecture. 