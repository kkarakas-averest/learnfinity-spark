import { supabase } from '@/lib/supabase';
import { EmployeeContentGeneratorService } from './employee-content-generator.service';
import { CourseGenerationRequest } from './agent-service';

interface PendingPersonalization {
  id: string;
  employee_id: string;
  course_id: string;
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
      console.log('Queue is already being processed');
      return { processed: 0, succeeded: 0, failed: 0, details: [] };
    }
    
    try {
      this.isProcessing = true;
      
      // 1. Find pending personalizations
      const pendingItems = await this.findPendingPersonalizations(limit);
      
      if (pendingItems.length === 0) {
        console.log('No pending personalization requests found');
        return { processed: 0, succeeded: 0, failed: 0, details: [] };
      }
      
      console.log(`Found ${pendingItems.length} pending personalization requests`);
      
      // 2. Process each pending item
      const results = [];
      let succeeded = 0;
      let failed = 0;
      
      for (const item of pendingItems) {
        try {
          // Mark as generating
          await this.updateStatus(item.id, 'generating');
          
          // Get course details
          const courseDetails = await this.fetchCourseDetails(item.course_id);
          
          if (!courseDetails) {
            throw new Error(`Course details not found for ID: ${item.course_id}`);
          }
          
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
          
          // Generate personalized content
          const generatedCourse = await this.contentGenerator.generatePersonalizedCourse(
            item.employee_id,
            courseRequest
          );
          
          // Save generated content
          const saveResult = await this.contentGenerator.saveGeneratedCourse(
            item.employee_id,
            generatedCourse
          );
          
          if (saveResult.success && saveResult.courseId) {
            // Update enrollment with the personalized content ID
            await this.completePersonalization(item.id, saveResult.courseId);
            succeeded++;
            results.push({ id: item.id, success: true });
          } else {
            throw new Error(`Failed to save generated course: ${saveResult.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Error processing personalization for enrollment ${item.id}:`, error);
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
      
      return {
        processed: pendingItems.length,
        succeeded,
        failed,
        details: results
      };
    } finally {
      this.isProcessing = false;
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
      console.error('Error finding pending personalizations:', error);
      return [];
    }
    
    return data as PendingPersonalization[];
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
    
    const { error } = await supabase
      .from('hr_course_enrollments')
      .update(updates)
      .eq('id', enrollmentId);
      
    if (error) {
      console.error(`Error updating status to ${status}:`, error);
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
      console.error('Error completing personalization:', error);
      return false;
    }
    
    return true;
  }
  
  /**
   * Fetch course details
   */
  private async fetchCourseDetails(courseId: string): Promise<any> {
    // Try hr_courses first
    const { data: hrCourse, error: hrError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (!hrError && hrCourse) {
      return hrCourse;
    }
    
    // Try courses table as fallback
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) {
      console.error('Error fetching course details:', courseError);
      return null;
    }
    
    return course;
  }
  
  /**
   * Manually trigger personalization for a specific enrollment
   */
  public async triggerPersonalization(enrollmentId: string): Promise<{ 
    success: boolean; 
    message: string;
  }> {
    try {
      // Check if enrollment exists
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('hr_course_enrollments')
        .select('id, employee_id, course_id, personalized_content_generation_status')
        .eq('id', enrollmentId)
        .single();
        
      if (enrollmentError || !enrollment) {
        return { 
          success: false, 
          message: `Enrollment not found: ${enrollmentError?.message || 'Unknown error'}` 
        };
      }
      
      // Reset status to pending
      await this.updateStatus(enrollmentId, 'pending');
      
      // Process immediately
      const result = await this.processPendingQueue(1);
      
      if (result.succeeded > 0) {
        return { success: true, message: 'Personalization completed successfully' };
      } else {
        return { 
          success: false, 
          message: `Personalization failed: ${result.details[0]?.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      console.error('Error triggering personalization:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 