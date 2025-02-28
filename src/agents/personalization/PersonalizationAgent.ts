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

/**
 * Types of tasks the Personalization Agent can handle
 */
export enum PersonalizationTaskType {
  CREATE_LEARNING_PATH = 'create_learning_path',
  ADAPT_LEARNING_PATH = 'adapt_learning_path',
  RECOMMEND_CONTENT = 'recommend_content',
}

/**
 * Personalization Agent customizes learning experiences
 */
export class PersonalizationAgent implements BaseAgent {
  public id: string;
  public type: string = 'personalization';
  public status: AgentStatus = 'idle';
  
  private context: AgentContext = {};
  private unsubscribeFunctions: Array<() => void> = [];
  
  /**
   * Create a new instance of the Personalization Agent
   */
  constructor(id: string = uuidv4()) {
    this.id = id;
  }
  
  /**
   * Initialize the Personalization Agent
   */
  public async initialize(config?: Record<string, any>): Promise<void> {
    console.info('Initializing Personalization Agent:', this.id);
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
          name: 'Personalization Agent',
          description: 'Customizes learning paths for learners',
          last_active: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Error registering personalization agent:', error);
      }
    } catch (error) {
      console.warn('Could not register personalization agent, table might not exist:', error);
    }
    
    // Publish initialization event
    await AgentEventBus.publish({
      source: this.id,
      type: 'personalization.initialized',
      data: {
        agentId: this.id,
      },
    });
  }
  
  /**
   * Subscribe to events the Personalization Agent needs to handle
   */
  private subscribeToEvents(): void {
    // Subscribe to agent initialization events
    const initUnsubscribe = AgentEventBus.subscribe(
      'agent.initialize',
      async (event: AgentEvent) => {
        if (event.data.agentType === 'personalization') {
          await this.initialize(event.data.context);
        }
      }
    );
    
    // Subscribe to learning path creation requests
    const pathUnsubscribe = AgentEventBus.subscribe(
      'personalization.create_path',
      async (event: AgentEvent) => {
        const { learnerId, preferences, requestId } = event.data;
        
        // Create task to create learning path
        const task: AgentTask = {
          id: requestId || uuidv4(),
          type: PersonalizationTaskType.CREATE_LEARNING_PATH,
          status: 'idle',
          startTime: new Date(),
          data: {
            learnerId,
            preferences,
          },
        };
        
        await this.executeTask(task);
      }
    );
    
    // Subscribe to learning path adaptation requests
    const adaptUnsubscribe = AgentEventBus.subscribe(
      'personalization.adapt_path',
      async (event: AgentEvent) => {
        const { learnerId, pathId, feedback, requestId } = event.data;
        
        // Create task to adapt learning path
        const task: AgentTask = {
          id: requestId || uuidv4(),
          type: PersonalizationTaskType.ADAPT_LEARNING_PATH,
          status: 'idle',
          startTime: new Date(),
          data: {
            learnerId,
            pathId,
            feedback,
          },
        };
        
        await this.executeTask(task);
      }
    );
    
    // Store unsubscribe functions for cleanup
    this.unsubscribeFunctions.push(initUnsubscribe, pathUnsubscribe, adaptUnsubscribe);
  }
  
  /**
   * Handle events from other components
   */
  public async handleEvent(event: AgentEvent): Promise<void> {
    console.info(`Personalization Agent handling event: ${event.type}`, event);
    
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
    console.info(`Personalization Agent executing task: ${task.type}`, task);
    
    // Update task status
    task.status = 'running';
    
    try {
      switch (task.type) {
        case PersonalizationTaskType.CREATE_LEARNING_PATH:
          await this.createLearningPath(task);
          break;
          
        case PersonalizationTaskType.ADAPT_LEARNING_PATH:
          await this.adaptLearningPath(task);
          break;
          
        case PersonalizationTaskType.RECOMMEND_CONTENT:
          await this.recommendContent(task);
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
   * Create a personalized learning path for a learner
   */
  private async createLearningPath(task: AgentTask): Promise<void> {
    const { learnerId, preferences } = task.data;
    
    if (!learnerId) {
      throw new Error('Missing learnerId in learning path task');
    }
    
    try {
      // Get learner details
      const { data: learner, error: learnerError } = await supabase
        .from('learners')
        .select('*')
        .eq('id', learnerId)
        .single();
      
      if (learnerError) {
        throw new Error(`Error fetching learner details: ${learnerError.message}`);
      }
      
      // Get company ID for the learner to fetch relevant courses
      const companyId = learner.company_id;
      
      // Get courses for this company
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', companyId);
      
      if (coursesError) {
        throw new Error(`Error fetching company courses: ${coursesError.message}`);
      }
      
      // For MVP, we'll work with just one course
      // In the future, this would involve more sophisticated selection logic
      let selectedCourse = null;
      if (courses && courses.length > 0) {
        // Simple selection logic - just pick the first course
        // In a real implementation, this would use ML to match courses to preferences
        selectedCourse = courses[0];
      } else {
        throw new Error('No courses available for this company');
      }
      
      // Create personalized learning path
      const pathData = {
        id: uuidv4(),
        learner_id: learnerId,
        course_id: selectedCourse.id,
        ai_adaptation: {
          preferences: preferences || learner.preferences || {},
          adaptationLevel: 'basic', // For MVP
          contentFocus: [],
          pacePreference: 'normal',
        },
        created_at: new Date().toISOString(),
      };
      
      // Insert the new learning path
      const { error: pathError } = await supabase
        .from('learning_paths')
        .insert(pathData);
      
      if (pathError) {
        throw new Error(`Error creating learning path: ${pathError.message}`);
      }
      
      // Publish event for path creation
      await AgentEventBus.publish({
        source: this.id,
        type: 'learning_path.created',
        data: {
          learnerId,
          pathId: pathData.id,
          courseId: selectedCourse.id,
          preferences: pathData.ai_adaptation,
        },
      });
      
      // Set task result
      task.result = {
        pathId: pathData.id,
        courseId: selectedCourse.id,
        status: 'Learning path created successfully',
      };
    } catch (error) {
      console.error('Error in createLearningPath:', error);
      throw error;
    }
  }
  
  /**
   * Adapt an existing learning path based on feedback or performance
   */
  private async adaptLearningPath(task: AgentTask): Promise<void> {
    const { learnerId, pathId, feedback } = task.data;
    
    if (!learnerId || !pathId) {
      throw new Error('Missing required data in adapt learning path task');
    }
    
    try {
      // Get current learning path
      const { data: path, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();
      
      if (pathError) {
        throw new Error(`Error fetching learning path: ${pathError.message}`);
      }
      
      // Update AI adaptation based on feedback
      const updatedAdaptation = {
        ...path.ai_adaptation,
        lastFeedback: feedback,
        adaptationHistory: [
          ...(path.ai_adaptation.adaptationHistory || []),
          {
            timestamp: new Date().toISOString(),
            feedback,
            action: 'path_adjusted',
          }
        ],
      };
      
      // For MVP, just record the feedback
      // In a more advanced implementation, this would analyze the feedback 
      // and make specific adjustments to the learning path
      
      // Update the learning path
      const { error: updateError } = await supabase
        .from('learning_paths')
        .update({
          ai_adaptation: updatedAdaptation,
        })
        .eq('id', pathId);
      
      if (updateError) {
        throw new Error(`Error updating learning path: ${updateError.message}`);
      }
      
      // Publish event for path adaption
      await AgentEventBus.publish({
        source: this.id,
        type: 'learning_path.adapted',
        data: {
          learnerId,
          pathId,
          adaptation: updatedAdaptation,
        },
      });
      
      // Set task result
      task.result = {
        pathId,
        status: 'Learning path adapted successfully',
      };
    } catch (error) {
      console.error('Error in adaptLearningPath:', error);
      throw error;
    }
  }
  
  /**
   * Recommend additional content based on learner interests and performance
   */
  private async recommendContent(task: AgentTask): Promise<void> {
    const { learnerId, moduleId } = task.data;
    
    if (!learnerId) {
      throw new Error('Missing learnerId in recommend content task');
    }
    
    // This is a placeholder for future recommendation logic
    // For MVP, we'll just return some basic recommendations
    
    task.result = {
      recommendations: [
        {
          type: 'resource',
          title: 'Additional Reading Material',
          description: 'Some helpful resources to reinforce your learning.',
          url: 'https://example.com/resources',
        },
        {
          type: 'exercise',
          title: 'Practice Exercise',
          description: 'Try this exercise to apply what you\'ve learned.',
          difficulty: 'medium',
        },
      ],
      status: 'Recommendations generated successfully',
    };
    
    // Publish event for recommendations
    await AgentEventBus.publish({
      source: this.id,
      type: 'content.recommendations',
      data: {
        learnerId,
        moduleId,
        recommendations: task.result.recommendations,
      },
    });
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
    console.info('Shutting down Personalization Agent:', this.id);
    
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