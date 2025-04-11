
import { supabase } from '@/lib/supabase';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';

/**
 * Service for retrieving personalized course content
 */
export class PersonalizedContentService {
  private static instance: PersonalizedContentService;

  private constructor() {}

  /**
   * Get the singleton instance of PersonalizedContentService
   */
  public static getInstance(): PersonalizedContentService {
    if (!PersonalizedContentService.instance) {
      PersonalizedContentService.instance = new PersonalizedContentService();
    }
    return PersonalizedContentService.instance;
  }

  /**
   * Get personalized content for a specific course and user
   */
  public async getPersonalizedContent(courseId: string, userId: string): Promise<{
    content: AICourseContent | null;
    sections: AICourseContentSection[];
  }> {
    console.log(`Fetching personalized content for course ${courseId} and user ${userId}`);
    
    try {
      // Check if there's personalized content for this course and user
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .select('*')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (contentError) {
        console.log(`No personalized content found: ${contentError.message}`);
        return { content: null, sections: [] };
      }

      console.log(`Personalized content found with ID: ${contentData.id}`);

      // Get sections for this personalized content
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('ai_course_content_sections')
        .select('*')
        .eq('content_id', contentData.id)
        .order('order_index', { ascending: true });

      if (sectionsError) {
        console.error(`Error retrieving personalized sections: ${sectionsError.message}`);
        return { content: contentData as AICourseContent, sections: [] };
      }

      console.log(`Found ${sectionsData?.length || 0} personalized content sections`);

      return { 
        content: contentData as AICourseContent, 
        sections: sectionsData as AICourseContentSection[] || []
      };
    } catch (error) {
      console.error("Error retrieving personalized content:", error);
      return { content: null, sections: [] };
    }
  }

  /**
   * Check if personalized content exists for a course and user
   */
  public async hasPersonalizedContent(courseId: string, userId: string): Promise<boolean> {
    console.log(`Checking if personalized content exists for course ${courseId} and user ${userId}`);
    
    try {
      const { count, error } = await supabase
        .from('ai_course_content')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error(`Error checking for personalized content: ${error.message}`);
        return false;
      }

      console.log(`Found ${count} personalized content records`);
      return count !== null && count > 0;
    } catch (error) {
      console.error("Error checking personalized content:", error);
      return false;
    }
  }

  /**
   * Get enrollment ID for a course and user from hr_course_enrollments
   */
  public async getEnrollmentId(courseId: string, employeeId: string): Promise<string | null> {
    try {
      console.log(`Looking up enrollment for course ${courseId} and employee ${employeeId}`);
      
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('id, personalized_content_id')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .single();

      if (error) {
        console.log(`No enrollment found: ${error.message}`);
        return null;
      }

      console.log(`Enrollment found with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error(`Error getting enrollment: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Check the status of a content generation request
   */
  public async getContentGenerationStatus(enrollmentId: string): Promise<{
    isGenerating: boolean;
    startedAt?: string;
    estimatedCompletion?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('personalized_content_generation_status, personalized_content_started_at')
        .eq('id', enrollmentId)
        .single();
        
      if (error || !data) {
        return { isGenerating: false };
      }
      
      return {
        isGenerating: data.personalized_content_generation_status === 'generating',
        startedAt: data.personalized_content_started_at,
        estimatedCompletion: data.personalized_content_started_at ? 
          new Date(new Date(data.personalized_content_started_at).getTime() + 5 * 60000).toISOString() : undefined
      };
    } catch (error) {
      console.error("Error checking content generation status:", error);
      return { isGenerating: false };
    }
  }
}
