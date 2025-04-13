import { supabase } from '@/lib/supabase';
import { EmployeeContentGeneratorService } from './employee-content-generator.service';
import { CourseGenerationRequest } from './agent-service';

interface PendingPersonalization {
  id: string;
  employee_id: string;
  course_id: string;
}

// Enhanced logging function
function logEvent(category: string, action: string, details: any = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    action,
    details: typeof details === 'object' ? details : { message: details }
  };
  
  console.log(`[${timestamp}] [${category}] [${action}]`, JSON.stringify(logEntry.details, null, 2));
  
  // You could also save logs to a database table for later analysis
  try {
    supabase.from('system_logs').insert({
      timestamp,
      category,
      action,
      details: logEntry.details
    }).then(
      () => {},
      (e) => console.error('Failed to save log entry:', e)
    );
  } catch (error) {
    // Silently fail if logging to DB fails
  }
}

/**
 * Service to handle the processing of queued personalization requests
 */
export class ContentPersonalizationQueueService {
  private static instance: ContentPersonalizationQueueService;
  private contentGenerator: EmployeeContentGeneratorService;
  private isProcessing: boolean = false;
  
  private constructor() {
    this.contentGenerator = EmployeeContentGeneratorService.getInstance();
    logEvent('Personalization', 'ServiceInitialized', {
      message: 'ContentPersonalizationQueueService initialized'
    });
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ContentPersonalizationQueueService {
    if (!ContentPersonalizationQueueService.instance) {
      ContentPersonalizationQueueService.instance = new ContentPersonalizationQueueService();
    }
    return ContentPersonalizationQueueService.instance;
  }
  
  /**
   * Check for and process pending personalization requests
   */
  public async processPendingQueue(limit: number = 5): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    details: Array<{id: string; success: boolean; error?: string}>;
  }> {
    // Prevent multiple simultaneous processing
    if (this.isProcessing) {
      logEvent('Personalization', 'QueueBusy', {
        message: 'Queue is already being processed, skipping this run'
      });
      return { processed: 0, succeeded: 0, failed: 0, details: [] };
    }
    
    logEvent('Personalization', 'QueueProcessingStarted', {
      message: `Starting to process pending personalization queue (limit: ${limit})`,
      timestamp: new Date().toISOString()
    });
    
    try {
      this.isProcessing = true;
      
      // 1. Find pending personalizations
      logEvent('Personalization', 'FindingPendingItems', {
        message: `Searching for up to ${limit} pending personalization requests`
      });
      
      const pendingItems = await this.findPendingPersonalizations(limit);
      
      if (pendingItems.length === 0) {
        logEvent('Personalization', 'NoPendingItems', {
          message: 'No pending personalization requests found'
        });
        return { processed: 0, succeeded: 0, failed: 0, details: [] };
      }
      
      logEvent('Personalization', 'PendingItemsFound', {
        message: `Found ${pendingItems.length} pending personalization requests`,
        items: pendingItems.map(item => ({ id: item.id, employee_id: item.employee_id, course_id: item.course_id }))
      });
      
      // 2. Process each pending item
      const results = [];
      let succeeded = 0;
      let failed = 0;
      
      for (const item of pendingItems) {
        logEvent('Personalization', 'ProcessingItem', {
          enrollmentId: item.id,
          employeeId: item.employee_id,
          courseId: item.course_id,
          message: `Starting personalization for enrollment ${item.id}`
        });
        
        try {
          // Mark as generating
          await this.updateStatus(item.id, 'generating');
          
          // Get course details
          logEvent('Personalization', 'FetchingCourseDetails', {
            enrollmentId: item.id,
            courseId: item.course_id
          });
          
          const courseDetails = await this.fetchCourseDetails(item.course_id);
          
          if (!courseDetails) {
            logEvent('Personalization', 'CourseDetailsMissing', {
              enrollmentId: item.id,
              courseId: item.course_id,
              error: `Course details not found for ID: ${item.course_id}`
            });
            throw new Error(`Course details not found for ID: ${item.course_id}`);
          }
          
          logEvent('Personalization', 'CourseDetailsFound', {
            enrollmentId: item.id,
            courseDetails: {
              id: courseDetails.id,
              title: courseDetails.title,
              description: courseDetails.description?.substring(0, 100) + '...' || 'No description'
            }
          });
          
          // Create course generation request
          const courseRequest: CourseGenerationRequest = {
            title: courseDetails.title,
            description: courseDetails.description,
            targetAudience: 'beginner',
            duration: 'medium',
            moduleCount: 3,
            learningObjectives: courseDetails.objectives || ['Learn core concepts'],
            includeQuizzes: true,
            includeAssignments: true,
            includeResources: true,
            generationMode: 'complete'
          };
          
          logEvent('Personalization', 'GeneratingContent', {
            enrollmentId: item.id,
            employeeId: item.employee_id,
            courseRequest
          });
          
          // Generate personalized content
          const generatedCourse = await this.contentGenerator.generatePersonalizedCourse(
            item.employee_id,
            courseRequest
          );
          
          logEvent('Personalization', 'ContentGenerated', {
            enrollmentId: item.id,
            courseTitle: generatedCourse.title,
            moduleCount: generatedCourse.modules.length,
            contentSummary: {
              modules: generatedCourse.modules.map(m => ({ 
                title: m.title,
                sectionsCount: m.topics?.length || 0
              })),
              quizCount: generatedCourse.quizzes?.length || 0,
              assignmentCount: generatedCourse.assignments?.length || 0
            }
          });
          
          // Save generated content
          logEvent('Personalization', 'SavingContent', {
            enrollmentId: item.id,
            employeeId: item.employee_id
          });
          
          const saveResult = await this.contentGenerator.saveGeneratedCourse(
            item.employee_id,
            generatedCourse
          );
          
          if (saveResult.success && saveResult.courseId) {
            // Update enrollment with the personalized content ID
            logEvent('Personalization', 'ContentSaved', {
              enrollmentId: item.id,
              generatedContentId: saveResult.courseId
            });
            
            await this.completePersonalization(item.id, saveResult.courseId);
            
            logEvent('Personalization', 'PersonalizationCompleted', {
              enrollmentId: item.id,
              status: 'success'
            });
            
            succeeded++;
            results.push({ id: item.id, success: true });
          } else {
            logEvent('Personalization', 'SaveContentFailed', {
              enrollmentId: item.id,
              error: saveResult.error || 'Unknown error'
            });
            
            throw new Error(`Failed to save generated course: ${saveResult.error || 'Unknown error'}`);
          }
        } catch (error) {
          logEvent('Personalization', 'ProcessingFailed', {
            enrollmentId: item.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Mark as failed
          await this.updateStatus(item.id, 'failed');
          failed++;
          results.push({ 
            id: item.id, 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      logEvent('Personalization', 'QueueProcessingCompleted', {
        processed: pendingItems.length,
        succeeded,
        failed,
        details: results
      });
      
      return {
        processed: pendingItems.length,
        succeeded,
        failed,
        details: results
      };
    } catch (error) {
      logEvent('Personalization', 'QueueProcessingError', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        details: [{
          id: 'queue-processing',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }]
      };
    } finally {
      this.isProcessing = false;
      logEvent('Personalization', 'QueueProcessingFinished', {
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Find pending personalization requests
   */
  private async findPendingPersonalizations(limit: number): Promise<PendingPersonalization[]> {
    const { data, error } = await supabase
      .from('hr_course_enrollments')
      .select('id, employee_id, course_id')
      .eq('personalized_content_generation_status', 'pending')
      .limit(limit);
      
    if (error) {
      logEvent('Personalization', 'FindPendingError', {
        error: error.message,
        details: error
      });
      return [];
    }
    
    return data as PendingPersonalization[];
  }
  
  /**
   * Fetch course details for personalization
   */
  private async fetchCourseDetails(courseId: string): Promise<any> {
    const { data, error } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (error) {
      logEvent('Personalization', 'FetchCourseError', {
        courseId,
        error: error.message
      });
      return null;
    }
    
    return data;
  }
  
  /**
   * Update the status of a personalization request
   */
  private async updateStatus(enrollmentId: string, status: 'pending' | 'generating' | 'completed' | 'failed'): Promise<boolean> {
    const updates: any = {
      personalized_content_generation_status: status
    };
    
    // Set start time if generating
    if (status === 'generating') {
      updates.personalized_content_started_at = new Date().toISOString();
    }
    
    // Set completion time if completed or failed
    if (status === 'completed' || status === 'failed') {
      updates.personalized_content_completed_at = new Date().toISOString();
    }
    
    logEvent('Personalization', 'StatusUpdate', {
      enrollmentId,
      status,
      updates
    });
    
    const { error } = await supabase
      .from('hr_course_enrollments')
      .update(updates)
      .eq('id', enrollmentId);
      
    if (error) {
      logEvent('Personalization', 'StatusUpdateError', {
        enrollmentId,
        status,
        error: error.message
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Complete the personalization by linking the generated content
   */
  private async completePersonalization(enrollmentId: string, contentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_id: contentId,
        personalized_content_generation_status: 'completed',
        personalized_content_completed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
      
    if (error) {
      logEvent('Personalization', 'CompletePersonalizationError', {
        enrollmentId,
        contentId,
        error: error.message
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Manually trigger personalization for a specific enrollment
   */
  public async triggerPersonalization(enrollmentId: string): Promise<{ 
    success: boolean; 
    message: string;
  }> {
    logEvent('Personalization', 'TriggerRequested', {
      enrollmentId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Check if enrollment exists
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('hr_course_enrollments')
        .select('id, employee_id, course_id, personalized_content_generation_status')
        .eq('id', enrollmentId)
        .single();
        
      if (enrollmentError || !enrollment) {
        logEvent('Personalization', 'TriggerEnrollmentNotFound', {
          enrollmentId,
          error: enrollmentError?.message || 'Enrollment not found'
        });
        
        return { 
          success: false, 
          message: `Enrollment not found: ${enrollmentError?.message || 'Unknown error'}` 
        };
      }
      
      logEvent('Personalization', 'TriggerEnrollmentFound', {
        enrollmentId,
        employeeId: enrollment.employee_id,
        courseId: enrollment.course_id,
        currentStatus: enrollment.personalized_content_generation_status
      });
      
      // Reset status to pending
      await this.updateStatus(enrollmentId, 'pending');
      
      logEvent('Personalization', 'TriggerProcessingStarted', {
        enrollmentId
      });
      
      // Process immediately
      const result = await this.processPendingQueue(1);
      
      if (result.succeeded > 0) {
        logEvent('Personalization', 'TriggerSucceeded', {
          enrollmentId,
          result
        });
        
        return { success: true, message: 'Personalization completed successfully' };
      } else {
        logEvent('Personalization', 'TriggerFailed', {
          enrollmentId,
          result
        });
        
        return { 
          success: false, 
          message: `Personalization failed: ${result.details[0]?.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      logEvent('Personalization', 'TriggerError', {
        enrollmentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 