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
  InterventionTemplate
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
  }

  /**
   * Get interventions with optional filtering
   */
  async getInterventions(options: {
    employeeId?: string;
    status?: InterventionStatus;
    type?: InterventionType;
    limit?: number;
    offset?: number;
  } = {}): Promise<Intervention[]> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using mock data');
        return this.getMockInterventions(options);
      }
      
      let query = supabase
        .from('interventions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (options.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching interventions:', error);
        throw error;
      }
      
      // Convert from snake_case to camelCase
      return data.map(this.snakeToCamelCase) as Intervention[];
    } catch (error) {
      console.error('Error in getInterventions:', error);
      return this.getMockInterventions(options);
    }
  }
  
  /**
   * Get a single intervention by ID with all related details
   */
  async getInterventionById(id: string): Promise<Intervention | null> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using mock data');
        return this.getMockInterventionById(id);
      }
      
      // Get main intervention data
      const { data: interventionData, error: interventionError } = await supabase
        .from('interventions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (interventionError) {
        console.error('Error fetching intervention:', interventionError);
        throw interventionError;
      }
      
      if (!interventionData) {
        return null;
      }
      
      // Get related data
      const contentModificationsPromise = supabase
        .from('content_modifications')
        .select('*')
        .eq('intervention_id', id);
        
      const resourceAssignmentsPromise = supabase
        .from('resource_assignments')
        .select('*')
        .eq('intervention_id', id);
        
      const scheduleAdjustmentsPromise = supabase
        .from('schedule_adjustments')
        .select('*')
        .eq('intervention_id', id);
        
      const mentorAssignmentsPromise = supabase
        .from('mentor_assignments')
        .select('*')
        .eq('intervention_id', id);
        
      const feedbackRequestsPromise = supabase
        .from('feedback_requests')
        .select('*')
        .eq('intervention_id', id);
      
      // Wait for all related data to be fetched
      const [
        contentModificationsResult,
        resourceAssignmentsResult,
        scheduleAdjustmentsResult,
        mentorAssignmentsResult,
        feedbackRequestsResult
      ] = await Promise.all([
        contentModificationsPromise,
        resourceAssignmentsPromise,
        scheduleAdjustmentsPromise,
        mentorAssignmentsPromise,
        feedbackRequestsPromise
      ]);
      
      // Convert data from snake_case to camelCase
      const intervention = this.snakeToCamelCase(interventionData) as Intervention;
      
      // Add related data
      if (!contentModificationsResult.error && contentModificationsResult.data) {
        intervention.contentModifications = contentModificationsResult.data.map(
          this.snakeToCamelCase
        ) as ContentModification[];
      }
      
      if (!resourceAssignmentsResult.error && resourceAssignmentsResult.data) {
        intervention.resourceAssignments = resourceAssignmentsResult.data.map(
          this.snakeToCamelCase
        ) as ResourceAssignment[];
      }
      
      if (!scheduleAdjustmentsResult.error && scheduleAdjustmentsResult.data && scheduleAdjustmentsResult.data.length > 0) {
        intervention.scheduleAdjustment = this.snakeToCamelCase(
          scheduleAdjustmentsResult.data[0]
        ) as ScheduleAdjustment;
      }
      
      if (!mentorAssignmentsResult.error && mentorAssignmentsResult.data && mentorAssignmentsResult.data.length > 0) {
        intervention.mentorAssignment = this.snakeToCamelCase(
          mentorAssignmentsResult.data[0]
        ) as MentorAssignment;
      }
      
      if (!feedbackRequestsResult.error && feedbackRequestsResult.data && feedbackRequestsResult.data.length > 0) {
        intervention.feedbackRequest = this.snakeToCamelCase(
          feedbackRequestsResult.data[0]
        ) as FeedbackRequest;
      }
      
      return intervention;
    } catch (error) {
      console.error('Error in getInterventionById:', error);
      return this.getMockInterventionById(id);
    }
  }
  
  /**
   * Create a new intervention
   */
  async createIntervention(intervention: InterventionInput): Promise<Intervention> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using mock data');
        return this.createMockIntervention(intervention);
      }
      
      // Convert from camelCase to snake_case
      const snakeCaseData = this.camelToSnakeCase(intervention);
      
      // Separate the base intervention data from related data
      const {
        content_modifications,
        resource_assignments,
        schedule_adjustment,
        mentor_assignment,
        feedback_request,
        ...baseInterventionData
      } = snakeCaseData;
      
      // Add required timestamps
      baseInterventionData.created_at = new Date().toISOString();
      baseInterventionData.updated_at = new Date().toISOString();
      
      // Generate ID if not provided
      if (!baseInterventionData.id) {
        baseInterventionData.id = crypto.randomUUID();
      }
      
      // Insert base intervention
      const { data: insertedIntervention, error: insertError } = await supabase
        .from('interventions')
        .insert(baseInterventionData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating intervention:', insertError);
        throw insertError;
      }
      
      const interventionId = insertedIntervention.id;
      
      // Insert related data if provided
      const promises = [];
      
      if (content_modifications?.length) {
        const contentModPromise = supabase
          .from('content_modifications')
          .insert(content_modifications.map(mod => ({
            ...mod,
            intervention_id: interventionId,
            created_at: new Date().toISOString()
          })));
        promises.push(contentModPromise);
      }
      
      if (resource_assignments?.length) {
        const resourceAssignPromise = supabase
          .from('resource_assignments')
          .insert(resource_assignments.map(assignment => ({
            ...assignment,
            intervention_id: interventionId,
            created_at: new Date().toISOString()
          })));
        promises.push(resourceAssignPromise);
      }
      
      if (schedule_adjustment) {
        const scheduleAdjPromise = supabase
          .from('schedule_adjustments')
          .insert({
            ...schedule_adjustment,
            intervention_id: interventionId,
            created_at: new Date().toISOString()
          });
        promises.push(scheduleAdjPromise);
      }
      
      if (mentor_assignment) {
        const mentorAssignPromise = supabase
          .from('mentor_assignments')
          .insert({
            ...mentor_assignment,
            intervention_id: interventionId,
            created_at: new Date().toISOString()
          });
        promises.push(mentorAssignPromise);
      }
      
      if (feedback_request) {
        const feedbackReqPromise = supabase
          .from('feedback_requests')
          .insert({
            ...feedback_request,
            intervention_id: interventionId,
            created_at: new Date().toISOString()
          });
        promises.push(feedbackReqPromise);
      }
      
      // Wait for all related data to be inserted
      await Promise.all(promises);
      
      // Send notification
      await this.sendInterventionNotification(intervention);
      
      // Return the full intervention with related data
      return this.getInterventionById(interventionId) as Promise<Intervention>;
    } catch (error) {
      console.error('Error in createIntervention:', error);
      return this.createMockIntervention(intervention);
    }
  }
  
  /**
   * Update an existing intervention
   */
  async updateIntervention(id: string, updates: Partial<Intervention>): Promise<Intervention> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using mock data');
        return this.updateMockIntervention(id, updates);
      }
      
      // Get current intervention
      const currentIntervention = await this.getInterventionById(id);
      if (!currentIntervention) {
        throw new Error(`Intervention with ID ${id} not found`);
      }
      
      // Convert from camelCase to snake_case
      const snakeCaseUpdates = this.camelToSnakeCase(updates);
      
      // Separate the base intervention updates from related data updates
      const {
        content_modifications,
        resource_assignments,
        schedule_adjustment,
        mentor_assignment,
        feedback_request,
        ...baseUpdates
      } = snakeCaseUpdates;
      
      // Add updated timestamp
      baseUpdates.updated_at = new Date().toISOString();
      
      // Update base intervention
      const { error: updateError } = await supabase
        .from('interventions')
        .update(baseUpdates)
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating intervention:', updateError);
        throw updateError;
      }
      
      // Update related data if provided
      const promises = [];
      
      if (content_modifications) {
        // Delete existing and insert new content modifications
        const deleteContentPromise = supabase
          .from('content_modifications')
          .delete()
          .eq('intervention_id', id);
          
        promises.push(deleteContentPromise);
        
        if (content_modifications.length > 0) {
          const insertContentPromise = supabase
            .from('content_modifications')
            .insert(content_modifications.map(mod => ({
              ...mod,
              intervention_id: id,
              created_at: new Date().toISOString()
            })));
          promises.push(insertContentPromise);
        }
      }
      
      if (resource_assignments) {
        // Delete existing and insert new resource assignments
        const deleteResourcesPromise = supabase
          .from('resource_assignments')
          .delete()
          .eq('intervention_id', id);
          
        promises.push(deleteResourcesPromise);
        
        if (resource_assignments.length > 0) {
          const insertResourcesPromise = supabase
            .from('resource_assignments')
            .insert(resource_assignments.map(assignment => ({
              ...assignment,
              intervention_id: id,
              created_at: new Date().toISOString()
            })));
          promises.push(insertResourcesPromise);
        }
      }
      
      if (schedule_adjustment !== undefined) {
        // Delete existing schedule adjustment
        const deleteSchedulePromise = supabase
          .from('schedule_adjustments')
          .delete()
          .eq('intervention_id', id);
          
        promises.push(deleteSchedulePromise);
        
        if (schedule_adjustment) {
          // Insert new schedule adjustment
          const insertSchedulePromise = supabase
            .from('schedule_adjustments')
            .insert({
              ...schedule_adjustment,
              intervention_id: id,
              created_at: new Date().toISOString()
            });
          promises.push(insertSchedulePromise);
        }
      }
      
      if (mentor_assignment !== undefined) {
        // Delete existing mentor assignment
        const deleteMentorPromise = supabase
          .from('mentor_assignments')
          .delete()
          .eq('intervention_id', id);
          
        promises.push(deleteMentorPromise);
        
        if (mentor_assignment) {
          // Insert new mentor assignment
          const insertMentorPromise = supabase
            .from('mentor_assignments')
            .insert({
              ...mentor_assignment,
              intervention_id: id,
              created_at: new Date().toISOString()
            });
          promises.push(insertMentorPromise);
        }
      }
      
      if (feedback_request !== undefined) {
        // Delete existing feedback request
        const deleteFeedbackPromise = supabase
          .from('feedback_requests')
          .delete()
          .eq('intervention_id', id);
          
        promises.push(deleteFeedbackPromise);
        
        if (feedback_request) {
          // Insert new feedback request
          const insertFeedbackPromise = supabase
            .from('feedback_requests')
            .insert({
              ...feedback_request,
              intervention_id: id,
              created_at: new Date().toISOString()
            });
          promises.push(insertFeedbackPromise);
        }
      }
      
      // Wait for all related data updates to complete
      await Promise.all(promises);
      
      // Send update notification if status changed
      if (updates.status && updates.status !== currentIntervention.status) {
        await this.sendInterventionStatusUpdateNotification(id, updates.status);
      }
      
      // Return the updated intervention
      return this.getInterventionById(id) as Promise<Intervention>;
    } catch (error) {
      console.error('Error in updateIntervention:', error);
      return this.updateMockIntervention(id, updates);
    }
  }
  
  /**
   * Get intervention templates
   */
  async getInterventionTemplates(): Promise<InterventionTemplate[]> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using mock data');
        return this.getMockInterventionTemplates();
      }
      
      const { data, error } = await supabase
        .from('intervention_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching intervention templates:', error);
        throw error;
      }
      
      return data.map(this.snakeToCamelCase) as InterventionTemplate[];
    } catch (error) {
      console.error('Error in getInterventionTemplates:', error);
      return this.getMockInterventionTemplates();
    }
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
  
  // Mock data methods for when Supabase is not available
  private getMockInterventions(options: any): Intervention[] {
    const mockInterventions: Intervention[] = [
      {
        id: '1',
        employeeId: '101',
        type: 'content_modification',
        status: 'active',
        reason: 'rag_status_change',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '201',
        ragStatusAtCreation: 'red',
        title: 'Content Simplification',
        description: 'Simplifying module 3 content for better understanding',
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        contentModifications: [
          {
            contentId: '301',
            contentType: 'module',
            originalContent: 'Complex content...',
            modifiedContent: 'Simplified content...',
            reason: 'Too complex for beginner level'
          }
        ]
      },
      {
        id: '2',
        employeeId: '102',
        type: 'resource_assignment',
        status: 'pending',
        reason: 'low_engagement',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '202',
        ragStatusAtCreation: 'amber',
        title: 'Additional Learning Resources',
        description: 'Supplementary videos and articles for module 2',
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resourceAssignments: [
          {
            resourceId: '401',
            resourceType: 'video',
            resourceName: 'Introduction to Concept X',
            resourceUrl: 'https://example.com/video1',
            reason: 'Additional visual explanation',
            isRequired: true
          },
          {
            resourceId: '402',
            resourceType: 'document',
            resourceName: 'Concept X Explained',
            resourceUrl: 'https://example.com/doc1',
            reason: 'Detailed explanation with examples',
            isRequired: false
          }
        ]
      },
      {
        id: '3',
        employeeId: '103',
        type: 'mentor_assignment',
        status: 'completed',
        reason: 'poor_performance',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '203',
        ragStatusAtCreation: 'red',
        title: 'Mentor Support Program',
        description: 'One-on-one mentoring sessions to improve understanding',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        mentorAssignment: {
          mentorId: '501',
          mentorName: 'Jane Smith',
          sessionCount: 3,
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          focusAreas: ['Module 3', 'Performance Optimization']
        }
      }
    ];
    
    // Apply filters
    let filteredInterventions = [...mockInterventions];
    
    if (options.employeeId) {
      filteredInterventions = filteredInterventions.filter(
        i => i.employeeId === options.employeeId
      );
    }
    
    if (options.status) {
      filteredInterventions = filteredInterventions.filter(
        i => i.status === options.status
      );
    }
    
    if (options.type) {
      filteredInterventions = filteredInterventions.filter(
        i => i.type === options.type
      );
    }
    
    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      filteredInterventions = filteredInterventions.slice(offset, offset + options.limit);
    }
    
    return filteredInterventions;
  }
  
  private getMockInterventionById(id: string): Intervention | null {
    const mockInterventions = this.getMockInterventions({});
    return mockInterventions.find(i => i.id === id) || null;
  }
  
  private createMockIntervention(intervention: InterventionInput): Intervention {
    const newIntervention: Intervention = {
      ...intervention,
      id: intervention.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newIntervention;
  }
  
  private updateMockIntervention(id: string, updates: Partial<Intervention>): Intervention {
    const intervention = this.getMockInterventionById(id);
    
    if (!intervention) {
      throw new Error(`Intervention with ID ${id} not found`);
    }
    
    const updatedIntervention: Intervention = {
      ...intervention,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return updatedIntervention;
  }
  
  private getMockInterventionTemplates(): InterventionTemplate[] {
    return [
      {
        id: '1',
        name: 'Performance Improvement Plan',
        description: 'A structured plan for employees who are struggling with course completion',
        type: 'content_modification',
        reasonsForUse: ['poor_performance', 'progress_slowdown'],
        contentTemplate: 'We have noticed that you are having some difficulty with the course material. This personalized plan is designed to help you overcome these challenges.',
        feedbackQuestions: [
          'What specific challenges are you facing with the current content?',
          'What learning style works best for you?',
          'Is there anything specific we can do to better support your learning?'
        ],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '201',
        isActive: true
      },
      {
        id: '2',
        name: 'Additional Resources Package',
        description: 'Supplementary materials for employees who need more context',
        type: 'resource_assignment',
        reasonsForUse: ['low_engagement', 'poor_performance'],
        contentTemplate: 'To help you better understand the concepts, we have assigned these additional resources.',
        feedbackQuestions: [
          'Did you find these additional resources helpful?',
          'Which format of materials do you prefer?'
        ],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '201',
        isActive: true
      },
      {
        id: '3',
        name: 'Mentor Support Program',
        description: 'One-on-one guidance with an experienced mentor',
        type: 'mentor_assignment',
        reasonsForUse: ['rag_status_change', 'poor_performance'],
        contentTemplate: 'To provide additional support, we have assigned a mentor who will guide you through the challenging aspects of this course.',
        suggestedMentorIds: ['501', '502', '503'],
        feedbackQuestions: [
          'How helpful were the mentoring sessions?',
          'What specific areas did the mentor help you with?'
        ],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: '201',
        isActive: true
      }
    ];
  }
} 