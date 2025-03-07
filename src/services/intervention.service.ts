import { supabase } from '@/lib/supabase';
import { 
  Intervention, 
  InterventionInput, 
  InterventionType,
  InterventionStatus,
  InterventionReason,
  ContentModification,
  ResourceAssignment,
  ScheduleAdjustment,
  MentorAssignment,
  FeedbackRequest,
  InterventionTemplate,
  InterventionFilter,
  InterventionUpdate,
  Employee
} from '@/types/intervention.types';
import { RAGStatus } from '@/types/hr.types';
import { NotificationService } from './notification.service';

/**
 * InterventionService
 * 
 * Handles all HR intervention operations including:
 * - Creating and retrieving interventions
 * - Managing intervention details (content modifications, resource assignments, etc.)
 * - Integrating with the notification system for alerts
 */
export class InterventionService {
  private static instance: InterventionService;
  private notificationService: NotificationService;
  private interventions: Intervention[] = [];

  // Singleton pattern to ensure only one instance of the service
  public static getInstance(): InterventionService {
    if (!InterventionService.instance) {
      InterventionService.instance = new InterventionService();
    }
    return InterventionService.instance;
  }

  private constructor() {
    // Initialize service
    console.log('Intervention Service initialized');
    this.notificationService = NotificationService.getInstance();
    this.initMockData();
  }

  /**
   * Initialize mock data
   */
  private initMockData(): void {
    this.interventions = [
      {
        id: 'int-001',
        title: 'Content Simplification for Module 3',
        description: 'Simplify the content in Module 3 to make it more accessible for the employee who is struggling with the technical concepts.',
        type: 'content_modification',
        status: 'active',
        employeeId: 'emp-002',
        employeeName: 'Jane Smith',
        ragStatusAtCreation: 'red',
        createdBy: 'hr-001',
        createdAt: '2023-11-15T10:30:00Z',
        updatedAt: '2023-11-15T10:30:00Z',
        dueDate: '2023-11-30T23:59:59Z',
        reason: 'Employee is struggling with technical concepts in Module 3',
        contentModifications: [
          {
            contentId: 'content-003',
            contentType: 'module',
            originalContent: 'The advanced algorithms utilize polynomial time complexity to optimize the search space...',
            modifiedContent: 'The algorithms use efficient methods to search through data quickly...',
            reason: 'Simplify technical language'
          }
        ]
      },
      {
        id: 'int-002',
        title: 'Additional Resources for Data Analysis',
        description: 'Provide supplementary resources to help the employee better understand data analysis concepts.',
        type: 'resource_assignment',
        status: 'completed',
        employeeId: 'emp-005',
        employeeName: 'Michael Johnson',
        ragStatusAtCreation: 'amber',
        createdBy: 'hr-001',
        createdAt: '2023-11-10T14:15:00Z',
        updatedAt: '2023-11-20T09:45:00Z',
        completedAt: '2023-11-20T09:45:00Z',
        reason: 'Employee requested additional materials on data analysis',
        resourceAssignments: [
          {
            resourceId: 'res-001',
            resourceType: 'video',
            resourceName: 'Introduction to Data Analysis',
            resourceUrl: 'https://learning.example.com/videos/data-analysis-intro',
            assignmentReason: 'Foundational concepts'
          },
          {
            resourceId: 'res-002',
            resourceType: 'document',
            resourceName: 'Data Analysis Cheat Sheet',
            resourceUrl: 'https://learning.example.com/docs/data-analysis-cheatsheet',
            assignmentReason: 'Quick reference guide'
          }
        ]
      },
      {
        id: 'int-003',
        title: 'Mentor Assignment for Leadership Skills',
        description: 'Assign a mentor to help develop leadership skills for upcoming project management role.',
        type: 'mentor_assignment',
        status: 'pending',
        employeeId: 'emp-008',
        employeeName: 'Sarah Williams',
        ragStatusAtCreation: 'green',
        createdBy: 'hr-002',
        createdAt: '2023-11-18T11:20:00Z',
        updatedAt: '2023-11-18T11:20:00Z',
        dueDate: '2023-12-15T23:59:59Z',
        reason: 'Preparation for upcoming promotion to team lead',
        notes: 'Sarah has shown great potential but needs guidance on team management aspects.'
      }
    ];
  }

  /**
   * Get interventions with optional filtering
   */
  public async getInterventions(filter?: InterventionFilter): Promise<Intervention[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredInterventions = [...this.interventions];
    
    if (filter) {
      if (filter.status) {
        filteredInterventions = filteredInterventions.filter(i => i.status === filter.status);
      }
      
      if (filter.employeeId) {
        filteredInterventions = filteredInterventions.filter(i => i.employeeId === filter.employeeId);
      }
      
      if (filter.type) {
        filteredInterventions = filteredInterventions.filter(i => i.type === filter.type);
      }
      
      if (filter.createdBy) {
        filteredInterventions = filteredInterventions.filter(i => i.createdBy === filter.createdBy);
      }
      
      if (filter.fromDate) {
        const fromDate = new Date(filter.fromDate);
        filteredInterventions = filteredInterventions.filter(i => new Date(i.createdAt) >= fromDate);
      }
      
      if (filter.toDate) {
        const toDate = new Date(filter.toDate);
        filteredInterventions = filteredInterventions.filter(i => new Date(i.createdAt) <= toDate);
      }
    }
    
    // Sort by creation date (newest first)
    return filteredInterventions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  /**
   * Get a single intervention by ID with all related details
   */
  async getInterventionById(id: string): Promise<Intervention | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const intervention = this.interventions.find(i => i.id === id);
    return intervention || null;
  }
  
  /**
   * Create a new intervention
   */
  async createIntervention(input: InterventionInput): Promise<Intervention> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock employee data lookup
    const employeeName = this.getMockEmployeeName(input.employeeId);
    
    const now = new Date().toISOString();
    const newIntervention: Intervention = {
      id: `int-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'pending',
      employeeId: input.employeeId,
      employeeName,
      ragStatusAtCreation: this.getMockEmployeeRAGStatus(input.employeeId),
      createdBy: 'hr-001', // In a real app, this would be the current user's ID
      createdAt: now,
      updatedAt: now,
      dueDate: input.dueDate,
      reason: input.reason,
      contentModifications: input.contentModifications,
      resourceAssignments: input.resourceAssignments,
      notes: input.notes
    };
    
    this.interventions.unshift(newIntervention);
    return newIntervention;
  }
  
  /**
   * Update an intervention
   */
  async updateIntervention(id: string, update: InterventionUpdate): Promise<Intervention> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.interventions.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Intervention with ID ${id} not found`);
    }
    
    const intervention = this.interventions[index];
    const updatedIntervention: Intervention = {
      ...intervention,
      ...update,
      updatedAt: new Date().toISOString(),
      completedAt: update.status === 'completed' && intervention.status !== 'completed' 
        ? new Date().toISOString() 
        : intervention.completedAt
    };
    
    this.interventions[index] = updatedIntervention;
    return updatedIntervention;
  }
  
  /**
   * Delete an intervention
   */
  async deleteIntervention(id: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.interventions.findIndex(i => i.id === id);
    if (index === -1) {
      return false;
    }
    
    this.interventions.splice(index, 1);
    return true;
  }
  
  /**
   * Get mock employees
   */
  async getEmployees(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        id: 'emp-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        department: 'Engineering',
        position: 'Software Developer',
        ragStatus: 'green',
        lastAssessmentDate: '2023-11-01T10:00:00Z'
      },
      {
        id: 'emp-002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        department: 'Engineering',
        position: 'Junior Developer',
        ragStatus: 'red',
        lastAssessmentDate: '2023-11-05T14:30:00Z'
      },
      {
        id: 'emp-003',
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        department: 'Product',
        position: 'Product Manager',
        ragStatus: 'green',
        lastAssessmentDate: '2023-10-28T09:15:00Z'
      },
      {
        id: 'emp-004',
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        department: 'Design',
        position: 'UI Designer',
        ragStatus: 'green',
        lastAssessmentDate: '2023-11-02T11:45:00Z'
      },
      {
        id: 'emp-005',
        name: 'Michael Johnson',
        email: 'michael.johnson@example.com',
        department: 'Data Science',
        position: 'Data Analyst',
        ragStatus: 'amber',
        lastAssessmentDate: '2023-11-08T13:20:00Z'
      },
      {
        id: 'emp-006',
        name: 'Lisa Brown',
        email: 'lisa.brown@example.com',
        department: 'Marketing',
        position: 'Marketing Specialist',
        ragStatus: 'green',
        lastAssessmentDate: '2023-10-30T15:10:00Z'
      },
      {
        id: 'emp-007',
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        department: 'Engineering',
        position: 'DevOps Engineer',
        ragStatus: 'amber',
        lastAssessmentDate: '2023-11-07T10:30:00Z'
      },
      {
        id: 'emp-008',
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        department: 'Engineering',
        position: 'Senior Developer',
        ragStatus: 'green',
        lastAssessmentDate: '2023-11-03T09:00:00Z'
      }
    ];
  }
  
  /**
   * Helper method to get mock employee name
   */
  private getMockEmployeeName(employeeId: string): string {
    const employeeMap: Record<string, string> = {
      'emp-001': 'John Doe',
      'emp-002': 'Jane Smith',
      'emp-003': 'Robert Johnson',
      'emp-004': 'Emily Davis',
      'emp-005': 'Michael Johnson',
      'emp-006': 'Lisa Brown',
      'emp-007': 'David Wilson',
      'emp-008': 'Sarah Williams'
    };
    
    return employeeMap[employeeId] || 'Unknown Employee';
  }
  
  /**
   * Helper method to get mock employee RAG status
   */
  private getMockEmployeeRAGStatus(employeeId: string): 'red' | 'amber' | 'green' {
    const statusMap: Record<string, 'red' | 'amber' | 'green'> = {
      'emp-001': 'green',
      'emp-002': 'red',
      'emp-003': 'green',
      'emp-004': 'green',
      'emp-005': 'amber',
      'emp-006': 'green',
      'emp-007': 'amber',
      'emp-008': 'green'
    };
    
    return statusMap[employeeId] || 'green';
  }

  /**
   * Get intervention templates
   */
  public async getInterventionTemplates(): Promise<InterventionTemplate[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        id: 'template-001',
        name: 'Content Simplification',
        description: 'Simplify complex content for better understanding',
        type: 'content_modification',
        reasonForUse: 'For employees struggling with technical concepts',
        contentTemplate: 'The content in [MODULE] needs to be simplified by [SPECIFIC CHANGES].'
      },
      {
        id: 'template-002',
        name: 'Additional Learning Resources',
        description: 'Provide supplementary resources for deeper understanding',
        type: 'resource_assignment',
        reasonForUse: 'For employees who need additional materials',
        resourceIds: ['res-001', 'res-002', 'res-003']
      },
      {
        id: 'template-003',
        name: 'Mentor Support Program',
        description: 'Assign a mentor for one-on-one guidance',
        type: 'mentor_assignment',
        reasonForUse: 'For employees who need personalized support'
      },
      {
        id: 'template-004',
        name: 'Schedule Extension',
        description: 'Extend deadlines for specific modules',
        type: 'schedule_adjustment',
        reasonForUse: 'For employees who need more time to complete modules'
      }
    ];
  }
  
  /**
   * Create intervention from template
   */
  async createInterventionFromTemplate(
    templateId: string, 
    employeeId: string,
    createdBy: string,
    ragStatusAtCreation: string,
    customFields?: Record<string, any>
  ): Promise<Intervention> {
    try {
      // Get template
      const templates = await this.getInterventionTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Create intervention input
      const interventionInput: InterventionInput = {
        employeeId,
        type: template.type,
        status: 'pending',
        reason: template.reasonsForUse[0] as InterventionReason,
        createdBy,
        ragStatusAtCreation: ragStatusAtCreation as RAGStatus,
        title: template.name,
        description: template.contentTemplate || template.description,
        customFields,
      };
      
      // Add template-specific data
      if (template.type === 'feedback_request' && template.feedbackQuestions) {
        const questions = Array.isArray(template.feedbackQuestions) 
          ? template.feedbackQuestions 
          : JSON.parse(template.feedbackQuestions as string);
          
        interventionInput.feedbackRequest = {
          questions,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          isAnonymous: false,
          feedbackType: 'experience'
        };
      }
      
      // Create intervention
      return this.createIntervention(interventionInput);
    } catch (error) {
      console.error('Error in createInterventionFromTemplate:', error);
      throw error;
    }
  }
  
  /**
   * Send notification for new intervention
   */
  private async sendInterventionNotification(intervention: InterventionInput): Promise<void> {
    try {
      // Format notification based on intervention type
      let title = 'New intervention';
      let message = 'A new intervention has been created for you.';
      let actionText = 'View Details';
      
      switch (intervention.type) {
        case 'content_modification':
          title = 'Learning Content Updated';
          message = 'Your learning content has been modified to better suit your needs.';
          break;
        case 'resource_assignment':
          title = 'Additional Resources Assigned';
          message = 'New learning resources have been assigned to help with your progress.';
          actionText = 'View Resources';
          break;
        case 'schedule_adjustment':
          title = 'Learning Schedule Adjusted';
          message = 'Your learning schedule has been adjusted. Please check the new deadlines.';
          actionText = 'View Schedule';
          break;
        case 'mentor_assignment':
          title = 'Mentor Assigned';
          message = 'A mentor has been assigned to assist with your learning journey.';
          actionText = 'Meet Your Mentor';
          break;
        case 'feedback_request':
          title = 'Feedback Requested';
          message = 'Your feedback is requested on your learning experience.';
          actionText = 'Provide Feedback';
          break;
      }
      
      // Send notification
      await this.notificationService.createNotification({
        recipientId: intervention.employeeId,
        senderId: intervention.createdBy,
        title,
        message,
        type: 'intervention',
        priority: 'medium',
        actionText,
        actionLink: `/learner-dashboard/interventions/${intervention.id}`,
        relatedEntityId: intervention.id,
        relatedEntityType: 'intervention'
      });
    } catch (error) {
      console.error('Error sending intervention notification:', error);
    }
  }
  
  /**
   * Send notification for intervention status update
   */
  private async sendInterventionStatusUpdateNotification(
    interventionId: string, 
    newStatus: InterventionStatus
  ): Promise<void> {
    try {
      // Get intervention details
      const intervention = await this.getInterventionById(interventionId);
      
      if (!intervention) {
        return;
      }
      
      // Format notification based on new status
      let title = 'Intervention Status Updated';
      let message = `Your intervention status has been updated to ${newStatus}.`;
      
      switch (newStatus) {
        case 'active':
          title = 'Intervention Now Active';
          message = 'Your intervention is now active. Please review the details.';
          break;
        case 'completed':
          title = 'Intervention Completed';
          message = 'Your intervention has been marked as completed.';
          break;
        case 'cancelled':
          title = 'Intervention Cancelled';
          message = 'Your intervention has been cancelled.';
          break;
      }
      
      // Send notification
      await this.notificationService.createNotification({
        recipientId: intervention.employeeId,
        senderId: intervention.createdBy,
        title,
        message,
        type: 'intervention',
        priority: 'low',
        actionText: 'View Details',
        actionLink: `/learner-dashboard/interventions/${interventionId}`,
        relatedEntityId: interventionId,
        relatedEntityType: 'intervention'
      });
    } catch (error) {
      console.error('Error sending intervention status update notification:', error);
    }
  }
  
  /**
   * Convert snake_case object to camelCase
   */
  private snakeToCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(v => this.snakeToCamelCase(v));
    }
    
    return Object.keys(obj).reduce((result, key) => {
      // Convert key from snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Convert value recursively if it's an object
      const value = obj[key];
      result[camelKey] = this.snakeToCamelCase(value);
      
      return result;
    }, {} as any);
  }
  
  /**
   * Convert camelCase object to snake_case
   */
  private camelToSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(v => this.camelToSnakeCase(v));
    }
    
    return Object.keys(obj).reduce((result, key) => {
      // Convert key from camelCase to snake_case
      const snakeKey = key.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`);
      
      // Convert value recursively if it's an object
      const value = obj[key];
      result[snakeKey] = this.camelToSnakeCase(value);
      
      return result;
    }, {} as any);
  }
} 