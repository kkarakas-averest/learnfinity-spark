
import { supabase } from "@/lib/supabase";
import { AICourseContent, AICourseContentSection } from "@/lib/types/content";

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

      if (contentError || !contentData) {
        console.log("No personalized content found", contentError);
        return { content: null, sections: [] };
      }

      // Get sections for this personalized content
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('ai_course_content_sections')
        .select('*')
        .eq('content_id', contentData.id)
        .order('order_index', { ascending: true });

      if (sectionsError) {
        console.error("Error retrieving personalized sections:", sectionsError);
        return { content: contentData as AICourseContent, sections: [] };
      }

      return { 
        content: contentData as AICourseContent, 
        sections: sectionsData as AICourseContentSection[] 
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
    try {
      const { count, error } = await supabase
        .from('ai_course_content')
        .select('id', { count: true })
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && !!count && count > 0;
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
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('id, personalized_content_id')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .single();

      if (error || !data) {
        console.log("No enrollment found", error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error getting enrollment:", error);
      return null;
    }
  }
}
