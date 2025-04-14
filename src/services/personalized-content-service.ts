
import { supabase } from '@/lib/supabase';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing personalized course content
 */
export class PersonalizedContentService {
  private static instance: PersonalizedContentService;

  private constructor() {}

  /**
   * Get singleton instance of PersonalizedContentService
   */
  public static getInstance(): PersonalizedContentService {
    if (!PersonalizedContentService.instance) {
      PersonalizedContentService.instance = new PersonalizedContentService();
    }
    return PersonalizedContentService.instance;
  }

  /**
   * Check if a user has personalized content for a specific course
   * @param courseId The course ID
   * @param userId The user ID
   * @returns boolean indicating if personalized content exists
   */
  public async hasPersonalizedContent(courseId: string, userId: string): Promise<boolean> {
    console.log(`Checking if personalized content exists for course ${courseId} and user ${userId}`);
    
    try {
      // First check if the user is an employee
      let employeeId = userId; // Default to userId if no employee record found
      
      // First check if personalized content exists
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId);
      
      if (contentError) {
        console.error('Error checking personalized content:', contentError);
        return false;
      }
      
      console.log(`Found ${contentData?.length} personalized content records`);
      return contentData && contentData.length > 0;
    } catch (error) {
      console.error('Error in hasPersonalizedContent:', error);
      return false;
    }
  }

  /**
   * Get personalized content for a specific course and user
   * @param courseId The course ID
   * @param userId The user ID
   * @returns Object containing the content and sections
   */
  public async getPersonalizedContent(courseId: string, userId: string): Promise<{
    content: AICourseContent | null,
    sections: AICourseContentSection[]
  }> {
    console.log(`Fetching personalized content for course ${courseId} and user ${userId}`);
    
    try {
      // Get the personalized content
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .select('*')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .single();
      
      if (contentError) {
        console.error('Error fetching personalized content:', contentError);
        return { content: null, sections: [] };
      }
      
      if (!contentData) {
        return { content: null, sections: [] };
      }
      
      console.log(`Personalized content found with ID: ${contentData.id}`);
      
      // Get the sections for this content
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('ai_course_content_sections')
        .select('*')
        .eq('content_id', contentData.id);
      
      if (sectionsError) {
        console.error('Error fetching content sections:', sectionsError);
        return { content: contentData, sections: [] };
      }
      
      console.log(`Found ${sectionsData?.length} personalized content sections`);
      
      // If no sections exist, generate some basic ones
      if (!sectionsData || sectionsData.length === 0) {
        console.log('No sections found, generating basic sections');
        const generatedSections = await this.generateBasicSections(contentData.id);
        return { content: contentData, sections: generatedSections };
      }
      
      return { content: contentData, sections: sectionsData };
    } catch (error) {
      console.error('Error in getPersonalizedContent:', error);
      return { content: null, sections: [] };
    }
  }

  /**
   * Get the enrollment ID for a course and employee
   * @param courseId The course ID
   * @param employeeId The employee ID
   * @returns The enrollment ID or null if not found
   */
  public async getEnrollmentId(courseId: string, employeeId: string): Promise<string | null> {
    console.log(`Looking up enrollment for course ${courseId} and employee ${employeeId}`);
    
    try {
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .single();
      
      if (error) {
        console.error('Error fetching enrollment:', error);
        return null;
      }
      
      if (data) {
        console.log(`Enrollment found with ID: ${data.id}`);
        return data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getEnrollmentId:', error);
      return null;
    }
  }

  /**
   * Get content generation status for an enrollment
   * @param enrollmentId The enrollment ID
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
      
      if (error) {
        console.error('Error fetching content generation status:', error);
        return { isGenerating: false };
      }
      
      if (data.personalized_content_generation_status === 'generating') {
        // Calculate estimated completion time (5 minutes from start)
        const startedAt = data.personalized_content_started_at;
        let estimatedCompletion = undefined;
        
        if (startedAt) {
          const startTime = new Date(startedAt);
          const estimatedTime = new Date(startTime.getTime() + 5 * 60000); // 5 minutes
          estimatedCompletion = estimatedTime.toISOString();
        }
        
        return {
          isGenerating: true,
          startedAt,
          estimatedCompletion
        };
      }
      
      return { isGenerating: false };
    } catch (error) {
      console.error('Error in getContentGenerationStatus:', error);
      return { isGenerating: false };
    }
  }

  /**
   * Generate basic sections for personalized content when no sections exist yet
   * This is a fallback mechanism when automatic generation fails
   * @param contentId The content ID to create sections for
   */
  private async generateBasicSections(contentId: string): Promise<AICourseContentSection[]> {
    const generatedSections: AICourseContentSection[] = [];
    
    try {
      // Create 2 modules with 3 sections each
      for (let moduleIndex = 0; moduleIndex < 2; moduleIndex++) {
        // Generate a proper UUID for module_id
        const moduleId = uuidv4(); // Use UUID format for module_id
        
        for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
          // Section content with placeholder text
          const sectionTitle = `Module ${moduleIndex + 1}: ${sectionIndex === 0 ? 'Introduction' : 
            sectionIndex === 1 ? 'Key Concepts' : 'Application'}`;
          
          const sectionContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This is a placeholder for personalized content that will be tailored to your profile and learning needs.</p>
              <p>In a fully generated version, this would include customized examples, targeted learning materials, and personalized exercises.</p>
              <ul>
                <li>Personalized learning point 1</li>
                <li>Customized example for your role</li>
                <li>Tailored application scenario</li>
              </ul>
              <blockquote>
                <p>This content is automatically generated as a fallback. For full personalization, please try regenerating the content.</p>
              </blockquote>
            </div>
          `;
          
          try {
            // Insert the section into the database
            const { data, error } = await supabase
              .from('ai_course_content_sections')
              .insert({
                id: uuidv4(),
                content_id: contentId,
                title: sectionTitle,
                content: sectionContent,
                module_id: moduleId, // Use the UUID here
                section_id: uuidv4(), // Also use UUID for section_id
                order_index: sectionIndex
              })
              .select();
            
            if (error) {
              console.error(`Error inserting section:`, error);
            } else if (data && data[0]) {
              generatedSections.push(data[0]);
            }
          } catch (error) {
            console.error(`Error creating section:`, error);
          }
        }
      }
      
      console.log(`Generated ${generatedSections.length} basic sections for content ID: ${contentId}`);
      return generatedSections;
    } catch (error) {
      console.error('Error generating basic sections:', error);
      return [];
    }
  }

  /**
   * Check if HR tables have been initialized properly
   */
  public async checkHRTablesExist(): Promise<boolean> {
    try {
      // Check if essential tables exist
      const essentialTables = [
        'hr_employees',
        'hr_courses',
        'hr_course_enrollments',
        'ai_course_content',
        'ai_course_content_sections'
      ];
      
      let allExist = true;
      
      for (const tableName of essentialTables) {
        try {
          // Just query for a single row to see if the table exists
          await supabase
            .from(tableName)
            .select('id')
            .limit(1);
        } catch (error) {
          console.error(`Table ${tableName} does not exist or is not accessible`, error);
          allExist = false;
        }
      }
      
      console.log('HR tables essential check:', allExist ? 'All exist' : 'Some missing');
      return allExist;
    } catch (error) {
      console.error('Error checking HR tables:', error);
      return false;
    }
  }
}
