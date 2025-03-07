# Learnfinity Implementation Roadmap

This document outlines the practical implementation plan for enhancing the Learnfinity platform with the RAG system, HR interventions, and learner dashboard functionalities based on our existing codebase.

## Overview

We're taking a targeted approach to implement the MVP version of our three PRDs (HR Dashboard, Learner Dashboard, and Multi-Agent System) by extending the existing codebase rather than rebuilding from scratch. This ensures faster delivery while laying the foundation for future enhancements.

## Phase 1: Extend Existing HR Dashboard (3 weeks)

### Week 1: RAG System Integration

| Task | Files to Modify | Description |
|------|----------------|-------------|
| Update Data Types | `src/types/hr.types.ts` | Add RAG status fields to Employee interface |
| Enhance Employee UI | `src/components/hr/EmployeeManagement.tsx` | Add color-coded status indicators |
| Update Services | `src/lib/services/hrServices.js` | Add RAG status management methods |

**Key Deliverable:** HR dashboard with visible RAG status indicators for each employee.

### Week 2: Basic Intervention Tools

| Task | Files to Create/Modify | Description |
|------|----------------------|-------------|
| Create Intervention UI | `src/components/hr/EmployeeIntervention.tsx` (new) | Form for assigning remedial content |
| Update Dashboard Overview | `src/components/hr/DashboardOverview.tsx` | Add RAG summary metrics and alerts |
| Integrate with Dashboard | `src/pages/HRDashboard.tsx` | Add intervention component to tabs |

**Key Deliverable:** Ability for HR to take action on employees with Amber/Red status.

### Week 3: Simple Notification System

| Task | Files to Create/Modify | Description |
|------|----------------------|-------------|
| Create Notification Components | `src/components/ui/notification.tsx` (new) | Reusable notification UI elements |
| Add Notification Service | `src/lib/services/notificationService.js` (new) | Backend methods for notification management |
| Integrate with HR Dashboard | `src/pages/HRDashboard.tsx` | Add notification panel to header |

**Key Deliverable:** Basic notification system for HR interventions and alerts.

## Phase 2: Initial Agent System Implementation (4 weeks)

### Week 4-5: Basic Agent Infrastructure

| Task | Files to Create | Description |
|------|---------------|-------------|
| Create Agent Types | `src/agents/types.ts` (new) | Define interfaces for agent operations |
| Implement Base Agent | `src/agents/base-agent.ts` (new) | Create foundation for all agents |
| Create RAG Agent | `src/agents/rag-agent.ts` (new) | Implement status determination logic |
| Setup Groq Integration | `src/lib/llm/groq-api.ts` (new) | Create API wrapper for Groq |

**Key Deliverable:** Functional agent system with Groq integration.

### Week 6-7: RAG System Agent Integration

| Task | Files to Create/Modify | Description |
|------|----------------------|-------------|
| Create Agent Hook | `src/hooks/useAgentSystem.ts` (new) | React hook for agent operations |
| Integrate with UI | `src/components/hr/EmployeeManagement.tsx` | Add agent analysis capabilities |
| Add Batch Processing | `src/components/hr/BatchStatusUpdate.tsx` (new) | Interface for bulk status updates |

**Key Deliverable:** AI-powered RAG status determination for employees.

## Phase 3: Basic Learner Dashboard (3 weeks)

### Week 8-9: Core Learner UI

| Task | Files to Create/Modify | Description |
|------|----------------------|-------------|
| Create Learner Dashboard | `src/pages/LearnerDashboard.tsx` | Main learner interface |
| Add Learning Path | `src/components/learner/LearningPath.tsx` (new) | Display assigned modules and progress |
| Create Notification List | `src/components/learner/NotificationList.tsx` (new) | Show notifications to learner |

**Key Deliverable:** Basic learner dashboard with progress tracking.

### Week 10: Learner Feedback System

| Task | Files to Create | Description |
|------|---------------|-------------|
| Create Feedback UI | `src/components/learner/ModuleFeedback.tsx` (new) | Form for submitting module feedback |
| Add Feedback Service | `src/lib/services/feedbackService.js` (new) | Methods for feedback submission and retrieval |
| Integrate with Modules | `src/components/learner/ModuleView.tsx` (new) | Trigger feedback on module completion |

**Key Deliverable:** Simple feedback collection system for learners.

## Phase 4: Integration & Testing (2 weeks)

### Week 11: Connect HR and Learner Dashboards

| Task | Files to Create/Modify | Description |
|------|----------------------|-------------|
| Update Notification Flow | `src/lib/services/notificationService.js` | Enable cross-dashboard notifications |
| Create Shared Components | `src/components/ui/rag-status.tsx` (new) | Consistent status indicators |
| Implement Data Sync | `src/lib/services/dashboardSync.js` (new) | Ensure data consistency across dashboards |

**Key Deliverable:** Connected HR and Learner dashboards with data flow.

### Week 12: Testing & Refinement

| Task | Description |
|------|-------------|
| Test Core User Flows | Verify end-to-end functionality |
| Performance Testing | Ensure acceptable response times |
| Bug Fixes | Address identified issues |

**Key Deliverable:** Stable, tested MVP ready for deployment.

## Phase 5: Deployment (1 week)

### Week 13: MVP Launch

| Task | Description |
|------|-------------|
| Documentation | Create user guides and technical docs |
| Final Testing | Complete pre-launch verification |
| Deployment | Configure and deploy to production |

**Key Deliverable:** Live MVP with core functionality.

## Database Schema Updates

```sql
-- Add RAG status to employees
ALTER TABLE employees 
ADD COLUMN rag_status VARCHAR(10) DEFAULT 'green' CHECK (rag_status IN ('green', 'amber', 'red')),
ADD COLUMN status_justification TEXT,
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create simple notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES auth.users(id),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create basic interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  created_by UUID REFERENCES auth.users(id),
  intervention_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Required Dependencies

```json
{
  "dependencies": {
    "crewai": "^0.1.0",
    "groq-sdk": "^0.3.0",
    "react-calendar": "^4.0.0",
    "react-markdown": "^8.0.7"
  }
}
```

## MVP Scope Summary

### HR Dashboard MVP
- Employee list with RAG status indicators
- Basic intervention tools for content assignment
- Simple notification system
- RAG summary metrics

### Learner Dashboard MVP
- Module list with completion status
- Personal RAG indicator
- Basic notification center
- Simple feedback collection

### Agent System MVP
- RAG status determination
- Basic learning path recommendations
- Simple agent orchestration

This roadmap provides a focused, practical approach to implementing the core features requested in the PRDs while working within the constraints of our existing codebase. The implementation prioritizes delivering immediate value through targeted enhancements rather than wholesale rebuilding. 