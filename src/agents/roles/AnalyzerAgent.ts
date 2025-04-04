/**
 * Analyzer Agent
 * 
 * Responsible for analyzing employee data, determining RAG status,
 * and providing insights on learning patterns and performance metrics.
 */

import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig } from '../types';
import { RAGStatus, RAGStatusDetails } from '@/types/hr.types';
import { LLMService } from '@/lib/llm/llm-service';

export class AnalyzerAgent extends BaseAgent {
  private llmService: LLMService;
  private useLLM: boolean;

  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Analyzer Agent",
      role: "Learning Analytics Specialist",
      goal: "Analyze learner data to determine RAG status and provide actionable insights",
      backstory: "You specialize in interpreting learning patterns and identifying when intervention is needed.",
      ...config
    });

    // Initialize LLM service
    this.llmService = LLMService.getInstance({
      debugMode: process.env.NODE_ENV === 'development'
    });

    // Check if we have a configured LLM
    this.useLLM = this.llmService.isConfigured();
    if (!this.useLLM && process.env.NODE_ENV === 'development') {
      console.warn('AnalyzerAgent: LLM not configured, using rule-based approach');
    }
  }
  
  /**
   * Process incoming messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    // TODO: Implement more sophisticated message processing
    // For now, we'll just acknowledge receipt
    
    const responseContent = `I've analyzed the information regarding: "${message.content.substring(0, 50)}..."`;
    
    return {
      id: message.id + "_response",
      from: this.id,
      to: message.from,
      content: responseContent,
      timestamp: new Date()
    };
  }
  
  /**
   * Process tasks related to data analysis
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'determine_rag_status':
        return this.determineRAGStatus(task.data);
      case 'batch_rag_status':
        return this.determineRAGStatusBatch(task.data);
      case 'explain_status':
        return this.explainStatus(task.data.employeeId, task.data.status);
      case 'identify_patterns':
        return this.identifyPatterns(task.data);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Determine RAG status for a single employee
   */
  async determineRAGStatus(employeeData: any): Promise<RAGStatusDetails> {
    // If LLM is configured, use it for advanced analysis
    if (this.useLLM) {
      try {
        return await this.determineRAGStatusUsingLLM(employeeData);
      } catch (error) {
        console.error('Error using LLM for RAG status determination:', error);
        // Fall back to rule-based approach
        return this.determineRAGStatusRuleBased(employeeData);
      }
    } 
    
    // Otherwise use rule-based approach
    return this.determineRAGStatusRuleBased(employeeData);
  }

  /**
   * Determine RAG status using LLM
   */
  private async determineRAGStatusUsingLLM(employeeData: any): Promise<RAGStatusDetails> {
    // Get LLM analysis
    const llmResponse = await this.llmService.determineRAGStatus(employeeData);
    
    // Parse the LLM response to extract status
    let status: RAGStatus = 'green';
    let justification = '';
    let recommendedActions: string[] = [];
    
    // Extract the status from the response
    if (llmResponse.includes('Status: RED') || llmResponse.toUpperCase().includes('RED')) {
      status = 'red';
    } else if (llmResponse.includes('Status: AMBER') || llmResponse.toUpperCase().includes('AMBER')) {
      status = 'amber';
    }
    
    // Extract justification - look for lines following the status
    const lines = llmResponse.split('\n');
    const statusLineIndex = lines.findIndex(line => 
      line.includes('Status:') || 
      line.toUpperCase().includes('RED') || 
      line.toUpperCase().includes('AMBER') || 
      line.toUpperCase().includes('GREEN')
    );
    
    if (statusLineIndex >= 0 && statusLineIndex + 1 < lines.length) {
      // Take the next non-empty line as justification
      for (let i = statusLineIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].includes('Recommended actions')) {
          justification = lines[i].trim();
          break;
        }
      }
    }
    
    // Extract recommended actions
    const actionHeaderIndex = lines.findIndex(line => 
      line.includes('Recommended actions') || 
      line.includes('Actions:')
    );
    
    if (actionHeaderIndex >= 0) {
      // Collect all numbered points as actions
      for (let i = actionHeaderIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.match(/^\d+\.\s/) || line.match(/^-\s/)) {
          recommendedActions.push(line.replace(/^\d+\.\s|-\s/, '').trim());
        } else if (recommendedActions.length > 0 && !line.includes(':')) {
          // Stop collecting at section boundary
          break;
        }
      }
    }
    
    // If we couldn't extract a justification, use a default one
    if (!justification) {
      justification = status === 'green' 
        ? 'Employee is maintaining good progress.'
        : status === 'amber'
        ? 'Employee shows some signs of falling behind.'
        : 'Employee requires immediate intervention.';
    }
    
    // If we couldn't extract actions, use defaults
    if (recommendedActions.length === 0) {
      recommendedActions = this.getDefaultActions(status);
    }
    
    return {
      status,
      justification,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'analyzer-agent-llm',
      recommendedActions
    };
  }
  
  /**
   * Rule-based RAG status determination (fallback method)
   */
  private determineRAGStatusRuleBased(employeeData: any): RAGStatusDetails {
    // For MVP, we'll use a simple rule-based approach
    // In a real implementation, this could use an ML model
    
    const progress = employeeData?.progress || 0;
    const coursesCompleted = employeeData?.coursesCompleted || 0;
    const totalCourses = employeeData?.courses || 1;
    const daysSinceLastActivity = this.daysSince(employeeData?.lastActivity);
    
    // Set initial status to green
    let status: RAGStatus = 'green';
    let justification = 'On track with expected progress.';
    
    // Check for amber status conditions
    if (
      (progress < 50 && progress >= 25) ||
      (daysSinceLastActivity > 7 && daysSinceLastActivity <= 14)
    ) {
      status = 'amber';
      justification = 'Falling behind on progress or showing decreased engagement.';
    }
    
    // Check for red status conditions
    if (
      (progress < 25) ||
      (daysSinceLastActivity > 14) ||
      (coursesCompleted === 0 && totalCourses > 0 && daysSinceLastActivity > 7)
    ) {
      status = 'red';
      justification = 'Significantly behind on progress or disengaged from learning.';
    }
    
    return {
      status,
      justification,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'analyzer-agent-rules',
      recommendedActions: this.getDefaultActions(status)
    };
  }
  
  /**
   * Get default actions based on status
   */
  private getDefaultActions(status: RAGStatus): string[] {
    switch (status) {
      case 'green':
        return [
          'Continue with current learning path',
          'Consider additional challenge materials',
          'Provide positive reinforcement'
        ];
      case 'amber':
        return [
          'Send engagement reminder',
          'Schedule check-in conversation',
          'Review upcoming deadlines with employee',
          'Consider simplifying immediate next steps'
        ];
      case 'red':
        return [
          'Schedule immediate intervention meeting',
          'Reassess learning path difficulty',
          'Provide supplementary materials for current module',
          'Consider extending deadlines',
          'Assign mentor for additional support'
        ];
      default:
        return ['Assess current learning status'];
    }
  }
  
  /**
   * Determine RAG status for multiple employees
   */
  async determineRAGStatusBatch(employeesData: any[]): Promise<Map<string, RAGStatusDetails>> {
    const results = new Map<string, RAGStatusDetails>();
    
    // Process in small batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < employeesData.length; i += batchSize) {
      const batch = employeesData.slice(i, i + batchSize);
      
      // Process each employee in the batch concurrently
      const batchPromises = batch.map(employee => 
        this.determineRAGStatus(employee)
          .then(status => ({ employee, status }))
          .catch(error => {
            console.error(`Error processing employee ${employee.id}:`, error);
            return { 
              employee, 
              status: {
                status: 'unknown' as RAGStatus,
                justification: 'Error processing employee data',
                lastUpdated: new Date().toISOString(),
                updatedBy: 'analyzer-agent-error',
                recommendedActions: ['Review employee data for errors']
              }
            };
          })
      );
      
      // Wait for all employees in this batch to be processed
      const batchResults = await Promise.all(batchPromises);
      
      // Add results to the map
      for (const { employee, status } of batchResults) {
        results.set(employee.id, status);
      }
    }
    
    return results;
  }
  
  /**
   * Explain the rationale behind a RAG status
   */
  async explainStatus(employeeId: string, status: RAGStatus): Promise<string> {
    // In a real implementation, this would access specific employee data
    // and provide a detailed explanation based on their particular metrics
    
    switch (status) {
      case 'green':
        return "This employee is making good progress through their assigned courses. They're maintaining regular engagement and completing assignments on schedule.";
      case 'amber':
        return "This employee is showing signs of decreased engagement. They may be falling behind on assignments or haven't logged in recently. Proactive intervention may help them get back on track.";
      case 'red':
        return "This employee requires immediate attention. They are significantly behind on their learning path, have missed multiple deadlines, or have been inactive for an extended period.";
      default:
        return "Status information is unavailable for this employee.";
    }
  }
  
  /**
   * Identify patterns across multiple employees
   */
  private async identifyPatterns(employeesData: any[]): Promise<any> {
    // Simplified implementation for now
    const departmentPerformance = new Map<string, {
      employeeCount: number;
      avgProgress: number;
      redCount: number;
      amberCount: number;
      greenCount: number;
    }>();
    
    // Calculate department stats
    for (const employee of employeesData) {
      const dept = employee.department || 'Unknown';
      const stats = departmentPerformance.get(dept) || {
        employeeCount: 0,
        avgProgress: 0,
        redCount: 0,
        amberCount: 0,
        greenCount: 0
      };
      
      stats.employeeCount++;
      stats.avgProgress += (employee.progress || 0);
      
      const status = (employee.ragStatus || 'green') as RAGStatus;
      switch (status) {
        case 'red': stats.redCount++; break;
        case 'amber': stats.amberCount++; break;
        case 'green': stats.greenCount++; break;
      }
      
      departmentPerformance.set(dept, stats);
    }
    
    // Calculate averages
    for (const [dept, stats] of departmentPerformance.entries()) {
      stats.avgProgress = stats.avgProgress / stats.employeeCount;
    }
    
    return {
      departmentPerformance: Object.fromEntries(departmentPerformance),
      insights: this.generateInsights(departmentPerformance)
    };
  }
  
  /**
   * Generate insights based on department performance
   */
  private generateInsights(departmentPerformance: Map<string, any>): string[] {
    const insights: string[] = [];
    
    for (const [dept, stats] of departmentPerformance.entries()) {
      if (stats.redCount / stats.employeeCount > 0.3) {
        insights.push(`The ${dept} department has a high proportion of employees (${(stats.redCount / stats.employeeCount * 100).toFixed(1)}%) requiring urgent intervention.`);
      }
      
      if (stats.avgProgress < 30) {
        insights.push(`The ${dept} department is showing low average progress (${stats.avgProgress.toFixed(1)}%). Consider reviewing the assigned learning content.`);
      }
      
      if (stats.greenCount / stats.employeeCount > 0.8) {
        insights.push(`The ${dept} department is performing exceptionally well with ${(stats.greenCount / stats.employeeCount * 100).toFixed(1)}% of employees on track.`);
      }
    }
    
    return insights;
  }
  
  /**
   * Calculate days since a given date
   */
  private daysSince(dateString?: string): number {
    if (!dateString) return 30; // Default to 30 days if no date provided
    
    const date = new Date(dateString);
    const today = new Date();
    const timeDiff = today.getTime() - date.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }
} 