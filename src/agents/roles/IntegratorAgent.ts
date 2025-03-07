/**
 * Integrator Agent
 * 
 * Responsible for handling communication between agents and external systems,
 * and managing the workflow orchestration within the Multi-Agent System.
 */

import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig } from '../types';
import { RAGStatus, Employee, Intervention } from '@/types/hr.types';

export interface IntegrationMessage {
  type: 'database' | 'notification' | 'email' | 'api' | 'ui_update';
  action: string;
  payload: any;
  priority: 'low' | 'medium' | 'high';
}

export class IntegratorAgent extends BaseAgent {
  private externalSystems: Record<string, any> = {};
  private messageQueue: IntegrationMessage[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Integrator Agent",
      role: "System Integration Specialist",
      goal: "Seamlessly connect agent actions with external systems",
      backstory: "You are responsible for ensuring agent insights and decisions are properly communicated to databases, notification systems, and user interfaces.",
      ...config
    });
  }
  
  /**
   * Process incoming messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    if (message.content.includes('integrate') || message.content.includes('update')) {
      // Extract integration details from message
      const integration = this.parseIntegrationRequest(message.content);
      
      if (integration) {
        // Queue the integration message
        this.queueMessage(integration);
        
        return {
          id: message.id + "_response",
          from: this.id,
          to: message.from,
          content: `Integration request for ${integration.type}/${integration.action} has been queued with ${integration.priority} priority.`,
          timestamp: new Date()
        };
      }
    }
    
    // Default response
    return {
      id: message.id + "_response",
      from: this.id,
      to: message.from,
      content: `Received your message. I'll handle any necessary integrations.`,
      timestamp: new Date()
    };
  }
  
  /**
   * Process integration tasks
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'update_employee_status':
        return this.updateEmployeeStatus(
          task.data.employeeId,
          task.data.newStatus,
          task.data.justification
        );
        
      case 'create_intervention':
        return this.createIntervention(task.data.intervention);
        
      case 'send_notification':
        return this.sendNotification(
          task.data.recipientId,
          task.data.title,
          task.data.message,
          task.data.actionLink
        );
        
      case 'update_learning_path':
        return this.updateLearningPath(
          task.data.employeeId,
          task.data.adjustments
        );
        
      case 'fetch_employee_data':
        return this.fetchEmployeeData(
          task.data.employeeId,
          task.data.includeHistory
        );
        
      case 'process_queue':
        return this.processMessageQueue(
          task.data.maxItems || 10,
          task.data.priority
        );
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Initialize the agent with connections to external systems
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    try {
      await super.initialize();
      
      // Initialize connections to external systems
      // In a real implementation, these would be actual service connections
      this.externalSystems = {
        database: { connected: true, name: 'SupabaseMock' },
        notification: { connected: true, name: 'NotificationServiceMock' },
        email: { connected: true, name: 'EmailServiceMock' },
        ui: { connected: true, name: 'UiUpdateServiceMock' }
      };
      
      // Start message queue processing
      this.startQueueProcessing();
      
      return { 
        success: true, 
        message: `${this.config.name} initialized with ${Object.keys(this.externalSystems).length} external systems` 
      };
    } catch (error) {
      console.error(`Error initializing ${this.config.name}:`, error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : `Unknown error initializing ${this.config.name}`
      };
    }
  }
  
  /**
   * Start periodic message queue processing
   */
  startQueueProcessing(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(async () => {
      try {
        if (this.messageQueue.length > 0) {
          await this.processMessageQueue(5); // Process 5 items at a time
        }
      } catch (error) {
        console.error('Error processing message queue:', error);
      }
    }, intervalMs);
    
    console.log(`Message queue processing started with interval of ${intervalMs}ms`);
  }
  
  /**
   * Stop queue processing
   */
  stopQueueProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Message queue processing stopped');
    }
  }
  
  /**
   * Queue an integration message
   */
  queueMessage(message: IntegrationMessage): void {
    this.messageQueue.push(message);
    
    // Sort queue by priority
    this.messageQueue.sort((a, b) => {
      const priorityValues = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityValues[a.priority] - priorityValues[b.priority];
    });
    
    console.log(`Queued message: ${message.type}/${message.action} with ${message.priority} priority`);
  }
  
  /**
   * Process items in the message queue
   */
  async processMessageQueue(
    maxItems: number = 10, 
    priorityFilter?: 'high' | 'medium' | 'low'
  ): Promise<{ processedCount: number; remainingCount: number }> {
    let processed = 0;
    const initialLength = this.messageQueue.length;
    
    // Process up to maxItems from the queue (which is already priority-sorted)
    for (let i = 0; i < Math.min(maxItems, this.messageQueue.length); i++) {
      // If priority filter is specified, only process messages with that priority
      if (priorityFilter && this.messageQueue[0].priority !== priorityFilter) {
        // Skip to next item in queue
        const skipped = this.messageQueue.shift();
        if (skipped) this.messageQueue.push(skipped); // Move to end of queue
        continue;
      }
      
      const message = this.messageQueue.shift();
      if (!message) break;
      
      try {
        await this.processIntegrationMessage(message);
        processed++;
      } catch (error) {
        console.error(`Error processing message ${message.type}/${message.action}:`, error);
        // Re-queue failed messages with lower priority
        const nextPriority: Record<string, 'medium' | 'low'> = {
          'high': 'medium',
          'medium': 'low',
          'low': 'low'
        };
        this.queueMessage({
          ...message,
          priority: nextPriority[message.priority]
        });
      }
    }
    
    return {
      processedCount: processed,
      remainingCount: this.messageQueue.length
    };
  }
  
  /**
   * Process a single integration message
   */
  private async processIntegrationMessage(message: IntegrationMessage): Promise<boolean> {
    console.log(`Processing ${message.type}/${message.action}`);
    
    // In a real implementation, these would interface with actual services
    switch (message.type) {
      case 'database':
        return this.processDatabaseAction(message.action, message.payload);
        
      case 'notification':
        return this.processNotificationAction(message.action, message.payload);
        
      case 'email':
        return this.processEmailAction(message.action, message.payload);
        
      case 'ui_update':
        return this.processUiUpdateAction(message.action, message.payload);
        
      case 'api':
        return this.processApiAction(message.action, message.payload);
        
      default:
        throw new Error(`Unknown integration type: ${message.type}`);
    }
  }
  
  /**
   * Update employee RAG status
   */
  async updateEmployeeStatus(
    employeeId: string,
    newStatus: RAGStatus,
    justification: string
  ): Promise<{ success: boolean; message: string }> {
    // Create a database integration message
    this.queueMessage({
      type: 'database',
      action: 'update_employee_status',
      payload: {
        employeeId,
        status: newStatus,
        justification,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      },
      priority: newStatus === 'red' ? 'high' : 'medium'
    });
    
    // If status is red, also create notification
    if (newStatus === 'red') {
      this.queueMessage({
        type: 'notification',
        action: 'send_status_alert',
        payload: {
          recipientRole: 'hr',
          title: 'Employee Status Alert',
          message: `Employee ${employeeId} status changed to RED. Justification: ${justification}`,
          link: `/hr/employees/${employeeId}`
        },
        priority: 'high'
      });
    }
    
    return { 
      success: true, 
      message: `Employee ${employeeId} status update to ${newStatus} has been queued.` 
    };
  }
  
  /**
   * Create an intervention for an employee
   */
  async createIntervention(
    intervention: Partial<Intervention>
  ): Promise<{ success: boolean; interventionId?: string; message: string }> {
    // Validate intervention data
    if (!intervention.employeeId || !intervention.type) {
      return { 
        success: false, 
        message: 'Employee ID and intervention type are required' 
      };
    }
    
    const interventionId = `int_${Date.now()}`;
    
    // Queue database update
    this.queueMessage({
      type: 'database',
      action: 'create_intervention',
      payload: {
        id: interventionId,
        employeeId: intervention.employeeId,
        type: intervention.type,
        createdAt: new Date().toISOString(),
        createdBy: intervention.createdBy || 'system',
        notes: intervention.notes || '',
        content: intervention.content || '',
        status: 'pending'
      },
      priority: 'medium'
    });
    
    // Queue notification to HR
    this.queueMessage({
      type: 'notification',
      action: 'send_intervention_notification',
      payload: {
        recipientRole: 'hr',
        title: 'New Intervention Created',
        message: `A new ${intervention.type} intervention has been created for employee ${intervention.employeeId}.`,
        link: `/hr/employees/${intervention.employeeId}`
      },
      priority: 'medium'
    });
    
    return { 
      success: true, 
      interventionId,
      message: `Intervention created with ID: ${interventionId}`
    };
  }
  
  /**
   * Send a notification to a user
   */
  async sendNotification(
    recipientId: string | null,
    title: string,
    message: string,
    actionLink?: string
  ): Promise<{ success: boolean; message: string }> {
    this.queueMessage({
      type: 'notification',
      action: 'send',
      payload: {
        recipientId,
        title,
        message,
        actionLink,
        createdAt: new Date().toISOString()
      },
      priority: 'medium'
    });
    
    return { 
      success: true, 
      message: `Notification queued for ${recipientId || 'all users'}` 
    };
  }
  
  /**
   * Update an employee's learning path
   */
  async updateLearningPath(
    employeeId: string,
    adjustments: any[]
  ): Promise<{ success: boolean; message: string }> {
    this.queueMessage({
      type: 'database',
      action: 'update_learning_path',
      payload: {
        employeeId,
        adjustments,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      },
      priority: 'medium'
    });
    
    return { 
      success: true, 
      message: `Learning path update queued for employee ${employeeId}` 
    };
  }
  
  /**
   * Fetch employee data from database
   */
  async fetchEmployeeData(
    employeeId: string,
    includeHistory: boolean = false
  ): Promise<{ employee: Employee | null; history?: any[] }> {
    // In a real implementation, this would fetch from the database
    // For now, return mock data
    const employee: Employee = {
      id: employeeId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      department: 'Engineering',
      position: 'Software Developer',
      courses: 5,
      coursesCompleted: 3,
      progress: 60,
      lastActivity: new Date().toISOString(),
      status: 'active',
      ragStatus: 'amber',
      ragDetails: {
        status: 'amber',
        justification: 'Slow progress on current modules',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system',
        recommendedActions: [
          'Schedule check-in meeting',
          'Review current module difficulty'
        ]
      }
    };
    
    let history = undefined;
    
    if (includeHistory) {
      history = [
        {
          status: 'green',
          justification: 'Good progress through initial modules',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          status: 'amber',
          justification: 'Slow progress on current modules',
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    return { employee, history };
  }
  
  // Helper methods for processing different external system actions
  
  /**
   * Process database actions
   */
  private async processDatabaseAction(action: string, payload: any): Promise<boolean> {
    console.log(`Database action: ${action}`, payload);
    // Mock success/failure for demonstration
    return true;
  }
  
  /**
   * Process notification actions
   */
  private async processNotificationAction(action: string, payload: any): Promise<boolean> {
    console.log(`Notification action: ${action}`, payload);
    // Mock success/failure for demonstration
    return true;
  }
  
  /**
   * Process email actions
   */
  private async processEmailAction(action: string, payload: any): Promise<boolean> {
    console.log(`Email action: ${action}`, payload);
    // Mock success/failure for demonstration
    return true;
  }
  
  /**
   * Process UI update actions
   */
  private async processUiUpdateAction(action: string, payload: any): Promise<boolean> {
    console.log(`UI update action: ${action}`, payload);
    // Mock success/failure for demonstration
    return true;
  }
  
  /**
   * Process API actions
   */
  private async processApiAction(action: string, payload: any): Promise<boolean> {
    console.log(`API action: ${action}`, payload);
    // Mock success/failure for demonstration
    return true;
  }
  
  /**
   * Parse an integration request from message content
   */
  private parseIntegrationRequest(content: string): IntegrationMessage | null {
    // Simple parsing logic
    // In a real implementation, this would be more sophisticated,
    // potentially using NLP or a structured format
    
    const typeMatches = content.match(/integrate with (database|notification|email|api|ui_update)/i);
    const actionMatches = content.match(/to (update|create|send|fetch|process|notify)/i);
    const priorityMatches = content.match(/(high|medium|low) priority/i);
    
    if (!typeMatches || !actionMatches) {
      return null;
    }
    
    const type = typeMatches[1].toLowerCase() as 'database' | 'notification' | 'email' | 'api' | 'ui_update';
    const actionVerb = actionMatches[1].toLowerCase();
    const priority = (priorityMatches?.[1].toLowerCase() || 'medium') as 'high' | 'medium' | 'low';
    
    // Extract payload from message content
    // This is a simplistic approach
    const payloadMatch = content.match(/payload: (\{.+\})/i);
    let payload = {};
    
    if (payloadMatch) {
      try {
        payload = JSON.parse(payloadMatch[1]);
      } catch (e) {
        console.error('Error parsing payload JSON:', e);
      }
    }
    
    // Map action verb to specific action based on type
    const actionMap: Record<string, Record<string, string>> = {
      database: {
        update: 'update_record',
        create: 'create_record',
        fetch: 'fetch_data',
        delete: 'delete_record'
      },
      notification: {
        send: 'send_notification',
        notify: 'send_notification'
      },
      email: {
        send: 'send_email'
      },
      api: {
        fetch: 'api_request'
      },
      ui_update: {
        update: 'update_ui'
      }
    };
    
    const action = actionMap[type]?.[actionVerb] || `${actionVerb}_${type}`;
    
    return {
      type,
      action,
      payload,
      priority
    };
  }
} 