import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { 
  BaseAgent, 
  AgentStatus, 
  AgentTask, 
  AgentEvent,
  AgentContext 
} from '../interfaces/BaseAgent';
import { AgentEventBus } from '../AgentEventBus';
import { RagStatus } from '@/lib/database.types';

/**
 * Types of tasks the RAG Agent can handle
 */
export enum RAGTaskType {
  EVALUATE_PROGRESS = 'evaluate_progress',
  UPDATE_STATUS = 'update_status',
  GENERATE_INTERVENTION = 'generate_intervention',
}

/**
 * RAG Agent monitors learner progress and triggers interventions
 */
export class RAGAgent implements BaseAgent {
  public id: string;
  public type: string = 'rag';
  public status: AgentStatus = 'idle';
  
  private context: AgentContext = {};
  private unsubscribeFunctions: Array<() => void> = [];
  
  // Thresholds for determining RAG status
  private static readonly AMBER_THRESHOLD = 0.70; // Below 70% completion = amber
  private static readonly RED_THRESHOLD = 0.40;   // Below 40% completion = red
  
  /**
   * Create a new instance of the RAG Agent
   */
  constructor(id: string = uuidv4()) {
    this.id = id;
  }
  
  /**
   * Initialize the RAG Agent
   */
  public async initialize(config?: Record<string, any>): Promise<void> {
    console.info('Initializing RAG Agent:', this.id);
    this.status = 'running';
    
    // Store context information
    if (config) {
      this.context = { 
        ...this.context,
        ...config
      };
    }
    
    // Subscribe to relevant events
    this.subscribeToEvents();
    
    // Register the agent in the database
    try {
      const { error } = await supabase
        .from('ai_agents')
        .upsert({
          id: this.id,
          name: 'RAG System Agent',
          description: 'Monitors learner progress using RAG system',
          last_active: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Error registering RAG agent:', error);
      }
    } catch (error) {
      console.warn('Could not register RAG agent, table might not exist:', error);
    }
    
    // Publish initialization event
    await AgentEventBus.publish({
      source: this.id,
      type: 'rag.initialized',
      data: {
        agentId: this.id,
      },
    });
  }
  
  /**
   * Subscribe to events the RAG Agent needs to handle
   */
  private subscribeToEvents(): void {
    // Subscribe to agent initialization events
    const initUnsubscribe = AgentEventBus.subscribe(
      'agent.initialize',
      async (event: AgentEvent) => {
        if (event.data.agentType === 'rag') {
          await this.initialize(event.data.context);
        }
      }
    );
    
    // Subscribe to module completion events
    const moduleUnsubscribe = AgentEventBus.subscribe(
      'module.completed',
      async (event: AgentEvent) => {
        const { learnerId, moduleId, performance, requestId } = event.data;
        
        // Create task to evaluate progress
        const task: AgentTask = {
          id: requestId || uuidv4(),
          type: RAGTaskType.EVALUATE_PROGRESS,
          status: 'idle',
          startTime: new Date(),
          data: {
            learnerId,
            moduleId,
            performance,
          },
        };
        
        await this.executeTask(task);
      }
    );
    
    // Subscribe to manual status update requests
    const updateUnsubscribe = AgentEventBus.subscribe(
      'rag.update_status',
      async (event: AgentEvent) => {
        const { learnerId, moduleId, status, requestId } = event.data;
        
        // Create task to update status
        const task: AgentTask = {
          id: requestId || uuidv4(),
          type: RAGTaskType.UPDATE_STATUS,
          status: 'idle',
          startTime: new Date(),
          data: {
            learnerId,
            moduleId,
            status,
          },
        };
        
        await this.executeTask(task);
      }
    );
    
    // Store unsubscribe functions for cleanup
    this.unsubscribeFunctions.push(initUnsubscribe, moduleUnsubscribe, updateUnsubscribe);
  }
  
  /**
   * Handle events from other components
   */
  public async handleEvent(event: AgentEvent): Promise<void> {
    console.info(`RAG Agent handling event: ${event.type}`, event);
    
    // Handle different event types
    switch (event.type) {
      case 'system.shutdown':
        await this.shutdown();
        break;
    }
  }
  
  /**
   * Execute a task based on its type
   */
  public async executeTask(task: AgentTask): Promise<AgentTask> {
    console.info(`RAG Agent executing task: ${task.type}`, task);
    
    // Update task status
    task.status = 'running';
    
    try {
      switch (task.type) {
        case RAGTaskType.EVALUATE_PROGRESS:
          await this.evaluateProgress(task);
          break;
          
        case RAGTaskType.UPDATE_STATUS:
          await this.updateStatus(task);
          break;
          
        case RAGTaskType.GENERATE_INTERVENTION:
          await this.generateIntervention(task);
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Mark task as completed
      task.status = 'completed';
      task.endTime = new Date();
      
    } catch (error) {
      console.error(`Error executing task ${task.type}:`, error);
      
      // Mark task as failed
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error instanceof Error ? error.message : String(error);
    }
    
    // Publish task completion event
    await AgentEventBus.publish({
      source: this.id,
      type: 'task.completed',
      data: {
        taskId: task.id,
        taskType: task.type,
        status: task.status,
        result: task.result,
        error: task.error,
      },
    });
    
    return task;
  }
  
  /**
   * Evaluate a learner's progress and determine RAG status
   */
  private async evaluateProgress(task: AgentTask): Promise<void> {
    const { learnerId, moduleId, performance } = task.data;
    
    if (!learnerId || !moduleId) {
      throw new Error('Missing required data in evaluate progress task');
    }
    
    try {
      // Get current progress for this module
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('module_id', moduleId)
        .single();
      
      // Determine the RAG status based on performance
      let ragStatus: RagStatus = 'green';
      let details = {};
      
      // If we have performance data from the event
      if (performance) {
        // Calculate progress based on score, time spent, etc.
        const completionRate = performance.completionRate || 0;
        const score = performance.score || 0;
        
        // Store details for later use
        details = {
          completionRate,
          score,
          timeSpent: performance.timeSpent || 0,
          attemptsCount: performance.attemptsCount || 1,
        };
        
        // Determine RAG status based on thresholds
        if (completionRate < RAGAgent.RED_THRESHOLD || score < 0.4) {
          ragStatus = 'red';
        } else if (completionRate < RAGAgent.AMBER_THRESHOLD || score < 0.7) {
          ragStatus = 'amber';
        }
      } 
      // If no performance data is provided but we have existing progress
      else if (progressData) {
        // Keep the existing status if no new data
        ragStatus = progressData.rag_status;
      }
      
      // Update or insert progress tracking record
      const progressRecord = {
        id: progressData?.id || uuidv4(),
        learner_id: learnerId,
        module_id: moduleId,
        rag_status: ragStatus,
        updated_at: new Date().toISOString(),
      };
      
      const { error: upsertError } = await supabase
        .from('progress_tracking')
        .upsert(progressRecord, { onConflict: 'learner_id,module_id' });
      
      if (upsertError) {
        throw new Error(`Error updating progress tracking: ${upsertError.message}`);
      }
      
      // Check if status has changed and publish event if needed
      if (!progressData || progressData.rag_status !== ragStatus) {
        await AgentEventBus.publish({
          source: this.id,
          type: 'rag.status_changed',
          data: {
            learnerId,
            moduleId,
            status: ragStatus,
            previousStatus: progressData?.rag_status || null,
            details,
          },
        });
        
        // If status is red or amber, also create an intervention task
        if (ragStatus === 'red' || ragStatus === 'amber') {
          const interventionTask: AgentTask = {
            id: uuidv4(),
            type: RAGTaskType.GENERATE_INTERVENTION,
            status: 'idle',
            startTime: new Date(),
            data: {
              learnerId,
              moduleId,
              status: ragStatus,
              details,
            },
          };
          
          await this.executeTask(interventionTask);
        }
      }
      
      // Set task result
      task.result = {
        status: 'Progress evaluated successfully',
        ragStatus,
        learnerId,
        moduleId,
      };
    } catch (error) {
      console.error('Error in evaluateProgress:', error);
      throw error;
    }
  }
  
  /**
   * Manually update a learner's RAG status
   */
  private async updateStatus(task: AgentTask): Promise<void> {
    const { learnerId, moduleId, status } = task.data;
    
    if (!learnerId || !moduleId || !status) {
      throw new Error('Missing required data in update status task');
    }
    
    // Validate status value
    if (status !== 'red' && status !== 'amber' && status !== 'green') {
      throw new Error(`Invalid RAG status: ${status}`);
    }
    
    try {
      // Get current progress to check previous status
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('module_id', moduleId)
        .single();
      
      // Create or update progress record
      const progressRecord = {
        id: progressData?.id || uuidv4(),
        learner_id: learnerId,
        module_id: moduleId,
        rag_status: status as RagStatus,
        updated_at: new Date().toISOString(),
      };
      
      const { error: upsertError } = await supabase
        .from('progress_tracking')
        .upsert(progressRecord, { onConflict: 'learner_id,module_id' });
      
      if (upsertError) {
        throw new Error(`Error updating progress tracking: ${upsertError.message}`);
      }
      
      // Check if status has changed and publish event if needed
      if (!progressData || progressData.rag_status !== status) {
        await AgentEventBus.publish({
          source: this.id,
          type: 'rag.status_changed',
          data: {
            learnerId,
            moduleId,
            status,
            previousStatus: progressData?.rag_status || null,
            details: {
              manually_updated: true,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
      
      // Set task result
      task.result = {
        status: 'Status updated successfully',
        ragStatus: status,
        learnerId,
        moduleId,
      };
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  }
  
  /**
   * Generate intervention recommendations based on RAG status
   */
  private async generateIntervention(task: AgentTask): Promise<void> {
    const { learnerId, moduleId, status, details } = task.data;
    
    if (!learnerId || !moduleId || !status) {
      throw new Error('Missing required data in generate intervention task');
    }
    
    // For MVP, we'll generate simple interventions based on status
    // In a more advanced implementation, this would involve more sophisticated analysis
    let interventions = [];
    
    if (status === 'red') {
      interventions = [
        {
          type: 'content_review',
          title: 'Review Module Content',
          description: 'It looks like you might be struggling with this module. We recommend reviewing the content again.',
          urgency: 'high',
        },
        {
          type: 'tutor_assistance',
          title: 'Request Tutor Help',
          description: 'Consider reaching out to a tutor for personalized assistance with this topic.',
          urgency: 'high',
        },
        {
          type: 'simplified_content',
          title: 'Simplified Explanations',
          description: 'We\'ve prepared some simpler explanations of key concepts that might help.',
          urgency: 'medium',
        },
      ];
    } else if (status === 'amber') {
      interventions = [
        {
          type: 'additional_resources',
          title: 'Additional Resources',
          description: 'Here are some extra resources that might help you better understand this topic.',
          urgency: 'medium',
        },
        {
          type: 'practice_exercises',
          title: 'Practice Exercises',
          description: 'Try these practice exercises to reinforce your understanding.',
          urgency: 'medium',
        },
      ];
    }
    
    // Publish intervention recommendations
    await AgentEventBus.publish({
      source: this.id,
      type: 'intervention.recommendations',
      data: {
        learnerId,
        moduleId,
        status,
        interventions,
      },
    });
    
    // Set task result
    task.result = {
      status: 'Interventions generated successfully',
      interventions,
      learnerId,
      moduleId,
    };
  }
  
  /**
   * Get the current status of the agent
   */
  public getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Clean up and shut down the agent
   */
  public async shutdown(): Promise<void> {
    console.info('Shutting down RAG Agent:', this.id);
    
    // Unsubscribe from all events
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    
    // Update status
    this.status = 'idle';
    
    // Update last active timestamp
    try {
      await supabase
        .from('ai_agents')
        .update({ last_active: new Date().toISOString() })
        .eq('id', this.id);
    } catch (error) {
      console.warn('Could not update last active time:', error);
    }
  }
} 