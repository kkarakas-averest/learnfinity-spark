/**
 * RAG System Agent Implementation
 * 
 * This agent is responsible for determining the RAG (Red/Amber/Green) status
 * of employees based on their progress and engagement data.
 */

import { AgentConfig, RAGSystemAgent } from "./types";
import { RAGStatus, RAGStatusDetails } from "@/types/hr.types";

export class RAGSystemAgentImpl implements RAGSystemAgent {
  config: AgentConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      name: "RAG System Agent",
      role: "Progress Tracking Specialist",
      goal: "Monitor learner progress and assign appropriate RAG status",
      backstory: "You analyze learning patterns and engagement metrics to determine when learners need intervention.",
      ...config
    };
  }

  async initialize(): Promise<{ success: boolean; message?: string }> {
    console.log(`Initializing ${this.config.name}...`);
    
    // In a real implementation, we would:
    // 1. Load any ML models or rule sets
    // 2. Connect to necessary data sources
    // 3. Perform validation checks
    
    this.initialized = true;
    return {
      success: true,
      message: `${this.config.name} initialized successfully`
    };
  }

  async determineRAGStatus(employeeData: any): Promise<RAGStatusDetails> {
    this.ensureInitialized();
    
    // For MVP, we'll use a simple rule-based approach
    // In a real implementation, this could use an ML model or more sophisticated rules
    
    const progress = employeeData?.progress || 0;
    const coursesCompleted = employeeData?.coursesCompleted || 0;
    const totalCourses = employeeData?.courses || 1;
    const daysSinceLastActivity = this.daysSince(employeeData?.lastActivity);
    
    // Determine base status from progress percentage
    let status: RAGStatus = 'green';
    let justification = 'On track with expected progress.';
    let recommendedActions: string[] = [];
    
    // Check for inactivity
    if (daysSinceLastActivity > 14) {
      status = 'red';
      justification = `No activity for ${daysSinceLastActivity} days. Requires immediate attention.`;
      recommendedActions = [
        'Reach out directly to check on well-being',
        'Schedule a 1:1 check-in meeting',
        'Review course difficulty and relevance'
      ];
    }
    // Check progress percentage
    else if (progress < 30) {
      status = 'red';
      justification = 'Significantly behind expected progress. Needs immediate intervention.';
      recommendedActions = [
        'Assign simpler introductory content',
        'Schedule a coaching session',
        'Review for potential barriers to learning'
      ];
    } 
    else if (progress < 70) {
      status = 'amber';
      justification = 'Slightly behind expected progress. Requires attention.';
      recommendedActions = [
        'Review recent module completion',
        'Check engagement metrics',
        'Send encouraging message'
      ];
    }
    
    // Check completion rate against expected timeline
    // This would be more sophisticated in a real implementation
    const completionRate = totalCourses > 0 ? (coursesCompleted / totalCourses) : 0;
    if (completionRate < 0.25 && status === 'green') {
      status = 'amber';
      justification = 'Completion rate below expectations. May need support.';
      recommendedActions = [
        'Check if course material is appropriate for skill level',
        'Send a check-in message',
        'Consider extending deadlines if appropriate'
      ];
    }
    
    return {
      status,
      justification,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'rag-agent',
      recommendedActions
    };
  }

  async determineRAGStatusBatch(employeesData: any[]): Promise<Map<string, RAGStatusDetails>> {
    this.ensureInitialized();
    
    const results = new Map<string, RAGStatusDetails>();
    
    // Process each employee
    for (const employee of employeesData) {
      if (employee && employee.id) {
        const status = await this.determineRAGStatus(employee);
        results.set(employee.id, status);
      }
    }
    
    return results;
  }

  async explainStatus(employeeId: string, status: RAGStatus): Promise<string> {
    this.ensureInitialized();
    
    // In a real implementation, this would provide a more detailed explanation
    // based on the specific factors that led to the status determination
    
    switch (status) {
      case 'red':
        return "This employee has been flagged as requiring immediate intervention. This could be due to prolonged inactivity, very low progress percentage, or consistently poor performance on assessments. We recommend scheduling a direct conversation to understand any barriers they might be facing.";
        
      case 'amber':
        return "This employee requires attention. While not critical, their progress has fallen below expectations. This might be due to slower than expected module completion, infrequent logins, or declining assessment scores. Consider sending a check-in message or assigning more appropriate content.";
        
      case 'green':
        return "This employee is progressing as expected. They are keeping up with their learning modules, showing good engagement, and performing adequately on assessments. No intervention is required at this time.";
        
      default:
        return "Status information is not available. Please refresh employee data.";
    }
  }

  // Helper methods
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.config.name} has not been initialized. Call initialize() first.`);
    }
  }

  private daysSince(dateString?: string): number {
    if (!dateString) return 999; // If no date provided, assume very old
    
    const activityDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - activityDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
} 