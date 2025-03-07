/**
 * RAG System Agent Implementation
 * 
 * This agent is responsible for determining the RAG (Red/Amber/Green) status
 * of employees based on their progress and engagement data.
 */

import { AgentConfig, RAGSystemAgent } from "./types";
import { RAGStatus, RAGStatusDetails } from "@/types/hr.types";
import { AgentMessage } from "./types";
import { v4 as uuidv4 } from 'uuid';

export class RAGSystemAgentImpl implements RAGSystemAgent {
  id: string;
  config: AgentConfig;
  private initialized: boolean = false;
  private debug: boolean = false;

  constructor(config?: Partial<AgentConfig>) {
    this.id = uuidv4();
    this.config = {
      name: "RAG System Agent",
      role: "Progress Evaluator",
      goal: "Determine appropriate RAG status for employee progress",
      backstory: "You analyze learning patterns to identify when intervention is needed.",
      ...(config || {})
    };
  }

  /**
   * Process incoming messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    // Simple message processing for now
    if (message.content.includes('determine_status')) {
      return {
        id: `response_${message.id}`,
        from: this.id,
        to: message.from,
        content: `I'm analyzing the employee data and will determine an appropriate RAG status.`,
        timestamp: new Date()
      };
    }
    
    return {
      id: `response_${message.id}`,
      from: this.id,
      to: message.from,
      content: `Received your message: "${message.content.substring(0, 50)}...". How can I help with RAG status determination?`,
      timestamp: new Date()
    };
  }
  
  /**
   * Process tasks related to RAG status determination
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'determine_rag_status':
        return this.determineRAGStatus(task.data?.employeeData);
        
      case 'determine_rag_status_batch':
        return this.determineRAGStatusBatch(task.data?.employeesData || []);
        
      case 'explain_status':
        return this.explainStatus(
          task.data?.employeeId, 
          task.data?.status
        );
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  async initialize(): Promise<{ success: boolean; message?: string }> {
    console.log(`Initializing ${this.config.name}...`);
    
    try {
      // Simulate initialization process
      // In a real implementation, this could load models, connect to services, etc.
      
      // Set initialized to true
      this.initialized = true;
      
      return {
        success: true,
        message: `${this.config.name} initialized successfully`
      };
    } catch (error) {
      console.error(`Error initializing ${this.config.name}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : `Unknown error initializing ${this.config.name}`
      };
    }
  }

  async determineRAGStatus(employeeData: any): Promise<RAGStatusDetails> {
    this.ensureInitialized();
    
    if (!employeeData) {
      throw new Error('Employee data is required for RAG status determination');
    }
    
    // Extract relevant metrics for RAG determination
    const progress = employeeData.progress || 0;
    const coursesCompleted = employeeData.coursesCompleted || 0;
    const totalCourses = employeeData.courses || 1;
    
    // Check if the employee has a lastActivity date
    let inactivityFlag = false;
    if (employeeData.lastActivity) {
      const daysSinceActivity = this.daysSince(employeeData.lastActivity);
      inactivityFlag = daysSinceActivity > 14; // Flag if inactive for more than 2 weeks
    }
    
    // Calculate completion percentage
    const completionPercentage = (coursesCompleted / totalCourses) * 100;
    
    // Determine RAG status
    let status: RAGStatus;
    let justification: string;
    let recommendedActions: string[] = [];
    
    if (progress < 25 || completionPercentage < 25 || inactivityFlag) {
      status = 'red';
      justification = 'Low progress and/or extended inactivity detected.';
      recommendedActions = [
        'Schedule a one-on-one meeting to discuss blockers',
        'Review and potentially simplify assigned course material',
        'Consider extending deadlines for current assignments',
        'Provide additional support resources'
      ];
    } else if (progress < 60 || completionPercentage < 60) {
      status = 'amber';
      justification = 'Moderate progress but potential risk of falling behind.';
      recommendedActions = [
        'Send a check-in message to offer assistance',
        'Highlight upcoming deadlines and important modules',
        'Suggest supplementary resources for difficult topics'
      ];
    } else {
      status = 'green';
      justification = 'Good progress and active engagement with course material.';
      recommendedActions = [
        'Provide positive reinforcement',
        'Suggest advanced or bonus material if interested',
        'Consider for peer mentoring opportunities'
      ];
    }
    
    return {
      status,
      justification,
      updatedBy: this.config.name,
      lastUpdated: new Date().toISOString(),
      recommendedActions
    };
  }

  async determineRAGStatusBatch(employeesData: any[]): Promise<Map<string, RAGStatusDetails>> {
    this.ensureInitialized();
    
    if (!employeesData || !Array.isArray(employeesData) || employeesData.length === 0) {
      throw new Error('Valid employee data array is required for batch RAG status determination');
    }
    
    const results = new Map<string, RAGStatusDetails>();
    
    // Process each employee
    for (const employee of employeesData) {
      try {
        const status = await this.determineRAGStatus(employee);
        if (employee.id) {
          results.set(employee.id, status);
        }
      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        // Continue with the next employee despite errors
      }
    }
    
    return results;
  }

  async explainStatus(employeeId: string, status: RAGStatus): Promise<string> {
    this.ensureInitialized();
    
    // For now, provide a generic explanation
    // In a real implementation, this could be more personalized based on employee data
    switch (status) {
      case 'green':
        return `Employee ${employeeId} is making good progress and actively engaging with the learning material. Their completion rate and performance metrics indicate they are on track with their learning goals. No intervention is required at this time, but continued monitoring and positive reinforcement will help maintain this status.`;
        
      case 'amber':
        return `Employee ${employeeId} has shown moderate progress but there are signs they could potentially fall behind. Their engagement metrics and completion rate are below optimal thresholds. Consider a casual check-in to identify any challenges they're facing and offer additional support to prevent further decline.`;
        
      case 'red':
        return `Employee ${employeeId} requires immediate attention. Their progress indicators show significant challenges with course completion and/or extended periods of inactivity. A direct intervention is recommended to understand the underlying issues and develop a plan to get back on track. Consider reviewing and potentially adjusting their assigned materials or deadlines.`;
        
      default:
        return `Status information for employee ${employeeId} is unavailable or undefined.`;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.config.name} must be initialized before use. Call initialize() first.`);
    }
  }

  private daysSince(dateString?: string): number {
    if (!dateString) return Number.MAX_SAFE_INTEGER; // If no date, treat as maximum time
    
    const targetDate = new Date(dateString);
    const currentDate = new Date();
    
    // Calculate difference in milliseconds
    const differenceMs = currentDate.getTime() - targetDate.getTime();
    
    // Convert to days
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
  }
} 