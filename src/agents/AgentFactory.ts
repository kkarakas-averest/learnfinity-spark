/**
 * Agent Factory
 * 
 * Provides a simplified interface for creating and managing agent instances
 * and crew configurations for the HR dashboard.
 */

import { CrewManager } from './core/CrewManager';
import { AnalyzerAgent } from './roles/AnalyzerAgent';
import { EducatorAgent } from './roles/EducatorAgent';
import { MonitorAgent } from './roles/MonitorAgent';
import { IntegratorAgent } from './roles/IntegratorAgent';
import { Agent, AgentConfig } from './types';

export class AgentFactory {
  private static instance: AgentFactory;
  private crew: CrewManager | null = null;
  
  private constructor() {
    // Private constructor to implement singleton
  }
  
  /**
   * Get the AgentFactory singleton instance
   */
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }
  
  /**
   * Initialize the standard RAG agent crew
   */
  public async initializeRAGCrew(debug: boolean = false): Promise<CrewManager> {
    if (this.crew) {
      return this.crew;
    }
    
    this.crew = CrewManager.createStandardCrew(debug);
    await this.crew.initialize();
    
    return this.crew;
  }
  
  /**
   * Get the crew manager instance
   */
  public getCrew(): CrewManager | null {
    return this.crew;
  }
  
  /**
   * Create an individual agent of a specific type
   */
  public createAgent(type: 'analyzer' | 'educator' | 'monitor' | 'integrator', config?: Partial<AgentConfig>): Agent {
    switch (type) {
      case 'analyzer':
        return new AnalyzerAgent({
          name: config?.name || 'Pattern Analyzer',
          role: config?.role || 'Data Analyst',
          goal: config?.goal || 'Identify learning patterns and determine RAG status',
          backstory: config?.backstory || 'You specialize in analyzing learning patterns and determining appropriate interventions.',
          ...config
        });
        
      case 'educator':
        return new EducatorAgent({
          name: config?.name || 'Learning Path Designer',
          role: config?.role || 'Education Specialist',
          goal: config?.goal || 'Create personalized learning experiences',
          backstory: config?.backstory || 'You are an expert in educational design and content adaptation.',
          ...config
        });
        
      case 'monitor':
        return new MonitorAgent({
          name: config?.name || 'Progress Monitor',
          role: config?.role || 'Monitoring Specialist',
          goal: config?.goal || 'Track learning progress and detect issues',
          backstory: config?.backstory || 'You excel at monitoring systems and detecting anomalies.',
          ...config
        });
        
      case 'integrator':
        return new IntegratorAgent({
          name: config?.name || 'System Integrator',
          role: config?.role || 'Integration Specialist',
          goal: config?.goal || 'Connect agent insights with external systems',
          backstory: config?.backstory || 'You specialize in system integration and data flow optimization.',
          ...config
        });
    }
  }
  
  /**
   * Determine RAG status for an employee
   */
  public async determineRAGStatus(employeeData: any): Promise<any> {
    if (!this.crew) {
      throw new Error('Crew must be initialized before performing actions');
    }
    
    const analyzer = this.crew.getAgent('analyzer-agent');
    if (!analyzer) {
      throw new Error('Analyzer agent not found in crew');
    }
    
    return this.crew.processTask({
      agentId: analyzer.id,
      type: 'determine_rag_status',
      data: { employeeData }
    });
  }
  
  /**
   * Generate or update a learning path for an employee
   */
  public async manageLearningPath(employeeId: string, currentStatus: string, preferences: any): Promise<any> {
    if (!this.crew) {
      throw new Error('Crew must be initialized before performing actions');
    }
    
    const educator = this.crew.getAgent('educator-agent');
    if (!educator) {
      throw new Error('Educator agent not found in crew');
    }
    
    return this.crew.processTask({
      agentId: educator.id,
      type: 'generate_learning_path',
      data: { 
        employeeProfile: {
          id: employeeId,
          ...preferences
        }
      }
    });
  }
  
  /**
   * Check employee status and generate alerts if needed
   */
  public async checkEmployeeStatus(employeeId: string): Promise<any> {
    if (!this.crew) {
      throw new Error('Crew must be initialized before performing actions');
    }
    
    const monitor = this.crew.getAgent('monitor-agent');
    if (!monitor) {
      throw new Error('Monitor agent not found in crew');
    }
    
    return this.crew.processTask({
      agentId: monitor.id,
      type: 'check_employee_status',
      data: { employeeId }
    });
  }
  
  /**
   * Send a notification based on agent insights
   */
  public async sendNotification(recipientId: string, title: string, message: string, actionLink?: string): Promise<any> {
    if (!this.crew) {
      throw new Error('Crew must be initialized before performing actions');
    }
    
    const integrator = this.crew.getAgent('integrator-agent');
    if (!integrator) {
      throw new Error('Integrator agent not found in crew');
    }
    
    return this.crew.processTask({
      agentId: integrator.id,
      type: 'send_notification',
      data: { 
        recipientId,
        title,
        message,
        actionLink
      }
    });
  }
  
  /**
   * Create an intervention for an employee
   */
  public async createIntervention(employeeId: string, interventionType: string, content: string, notes?: string): Promise<any> {
    if (!this.crew) {
      throw new Error('Crew must be initialized before performing actions');
    }
    
    const integrator = this.crew.getAgent('integrator-agent');
    if (!integrator) {
      throw new Error('Integrator agent not found in crew');
    }
    
    return this.crew.processTask({
      agentId: integrator.id,
      type: 'create_intervention',
      data: { 
        intervention: {
          employeeId,
          type: interventionType,
          content,
          notes,
          createdBy: 'hr-dashboard'
        } 
      }
    });
  }
  
  /**
   * Clean up resources when done with the factory
   */
  public cleanup(): void {
    // Stop any running monitoring or processing
    if (this.crew) {
      const monitor = this.crew.getAgent('monitor-agent') as MonitorAgent;
      if (monitor) {
        monitor.stopMonitoring();
      }
      
      const integrator = this.crew.getAgent('integrator-agent') as IntegratorAgent;
      if (integrator) {
        integrator.stopQueueProcessing();
      }
      
      this.crew = null;
    }
  }
} 