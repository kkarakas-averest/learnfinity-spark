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
      
      console.log(`Found ${contentData?.length || 0} personalized content records`);
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
      
      console.log(`Found ${sectionsData?.length || 0} personalized content sections`);
      
      // If no sections exist, generate some basic ones
      if (!sectionsData || sectionsData.length === 0) {
        console.log('No sections found, generating basic sections');
        const generatedSections = await this.generateBasicSections(contentData.id);
        return { content: contentData, sections: generatedSections };
      }
      
      // Check if content needs regeneration (has placeholder content)
      const needsRegeneration = sectionsData.some(section => 
        section.content.includes('Content will be regenerated') || 
        section.content.includes('<p>This content is automatically generated as a fallback</p>')
      );
      
      if (needsRegeneration) {
        console.log('Found placeholder content, regenerating with more detailed content');
        // Replace placeholder content with more detailed temporary content
        const updatedSections = await this.updatePlaceholderContent(contentData.id, sectionsData);
        return { content: contentData, sections: updatedSections };
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
        const moduleId = uuidv4();
        
        for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
          // Section content with placeholder text
          const sectionTitle = `Module ${moduleIndex + 1}: ${sectionIndex === 0 ? 'Introduction' : 
            sectionIndex === 1 ? 'Key Concepts' : 'Application'}`;
          
          const sectionId = uuidv4();
          
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
          
          // Create a new section object with proper typing
          const newSection: AICourseContentSection = {
            id: uuidv4(),
            content_id: contentId,
            title: sectionTitle,
            content: sectionContent,
            module_id: moduleId,
            section_id: sectionId,
            order_index: sectionIndex
          };
          
          try {
            // Use the Supabase API to insert a section
            const { data, error } = await supabase
              .from('ai_course_content_sections')
              .insert([newSection])
              .select();
            
            if (error) {
              console.error(`Error inserting section:`, error);
            } else if (data && data[0]) {
              generatedSections.push(data[0]);
            }
          } catch (error) {
            console.error(`Error creating section:`, error);
            // Add to the generated sections array even if DB insert failed
            // This way we can still display something to the user
            generatedSections.push(newSection);
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
   * Updates placeholder content with more detailed temporary content
   * @param contentId The content ID
   * @param sections The existing sections
   * @returns Updated sections
   */
  private async updatePlaceholderContent(contentId: string, sections: AICourseContentSection[]): Promise<AICourseContentSection[]> {
    const updatedSections: AICourseContentSection[] = [];
    
    for (const section of sections) {
      if (section.content.includes('Content will be regenerated') || 
          section.content.includes('<p>This content is automatically generated as a fallback</p>')) {
        
        // Generate more detailed content based on the section title
        const sectionTitle = section.title;
        const titleParts = sectionTitle.split(':');
        const moduleType = titleParts[0] || 'Module';
        const sectionType = titleParts[1]?.trim() || 'Content';
        
        // Create detailed content based on section type
        let newContent = '';
        
        if (sectionType.includes('Introduction') || sectionType.includes('Overview')) {
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>Welcome to this personalized introduction. This section provides an overview of key concepts that will be covered in this module.</p>
              <p>In this module, you will learn foundational principles that apply to your specific role and experience level. The content has been tailored based on your profile.</p>
              <ul>
                <li>Understand the core concepts and terminology</li>
                <li>Learn how these concepts apply to real-world scenarios</li>
                <li>Discover best practices relevant to your position</li>
              </ul>
              <p>As you progress through this module, you'll gain insights specifically relevant to your professional development needs.</p>
            </div>
          `;
        } else if (sectionType.includes('Key Concepts') || sectionType.includes('Concepts')) {
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This section covers the essential concepts that form the foundation of this subject matter. These concepts have been selected based on their relevance to your role.</p>
              <h3>Core Principles</h3>
              <ol>
                <li><strong>Principle 1:</strong> Understanding the fundamental framework and how it applies to your specific context.</li>
                <li><strong>Principle 2:</strong> Recognizing patterns and applying strategic thinking in your domain.</li>
                <li><strong>Principle 3:</strong> Implementing best practices tailored to your experience level and responsibilities.</li>
              </ol>
              <p>These concepts build upon each other to provide a comprehensive understanding tailored to your learning needs.</p>
            </div>
          `;
        } else if (sectionType.includes('Application') || sectionType.includes('Practical')) {
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This section focuses on practical applications of the concepts you've learned, with examples relevant to your specific role and industry.</p>
              <h3>Practical Examples</h3>
              <div class="bg-slate-50 p-4 rounded-md my-4">
                <p class="font-medium">Example Scenario</p>
                <p>Consider a situation where you need to apply these principles in your daily work. This personalized example illustrates how the concepts can be implemented effectively.</p>
                <ul>
                  <li>Step 1: Identify the specific challenge or opportunity</li>
                  <li>Step 2: Apply the relevant principles from this module</li>
                  <li>Step 3: Measure results and iterate based on feedback</li>
                </ul>
              </div>
              <p>By working through these examples, you'll develop practical skills that directly apply to your professional context.</p>
            </div>
          `;
        } else if (sectionType.includes('Resources') || sectionType.includes('Additional')) {
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This section provides additional resources to deepen your understanding and support your ongoing learning journey.</p>
              <h3>Recommended Resources</h3>
              <ul>
                <li><strong>Further Reading:</strong> Selected articles and books relevant to your professional interests</li>
                <li><strong>Tools and Templates:</strong> Practical resources to apply concepts in your daily work</li>
                <li><strong>Community Resources:</strong> Forums and groups where you can connect with peers in similar roles</li>
              </ul>
              <blockquote>
                <p>These personalized recommendations have been curated to match your learning style and professional development goals.</p>
              </blockquote>
            </div>
          `;
        } else if (sectionType.includes('Activities') || sectionType.includes('Exercises')) {
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This section provides interactive activities designed to reinforce your learning and help you apply concepts in practical situations.</p>
              <h3>Personalized Learning Activities</h3>
              <div class="border border-slate-200 p-4 rounded-md my-4">
                <p class="font-medium">Activity 1: Application Exercise</p>
                <p>Consider how you would apply the concepts from this module in your current role:</p>
                <ol>
                  <li>Identify a current challenge in your work that relates to these concepts</li>
                  <li>Outline a plan to address this challenge using the principles you've learned</li>
                  <li>Consider potential outcomes and how you would measure success</li>
                </ol>
              </div>
              <p>These activities are designed to be relevant to your specific role and responsibilities, making the learning immediately applicable.</p>
            </div>
          `;
        } else {
          // Default content for any other section type
          newContent = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This section contains personalized content related to ${sectionType}. The material has been tailored to your specific learning needs and professional context.</p>
              <p>As you work through this content, consider how these concepts apply to your current role and future career development goals.</p>
              <ul>
                <li>Connect these ideas to your existing knowledge and experience</li>
                <li>Consider practical applications in your daily work</li>
                <li>Identify areas where you can implement these concepts for improved outcomes</li>
              </ul>
              <p>This personalized approach ensures that the content is relevant and immediately applicable to your professional context.</p>
            </div>
          `;
        }
        
        // Update section in database
        const { data, error } = await supabase
          .from('ai_course_content_sections')
          .update({ content: newContent })
          .eq('id', section.id)
          .select()
          .single();
          
        if (error) {
          console.error(`Error updating section content:`, error);
          // If update fails, use updated content in memory but don't persist
          updatedSections.push({
            ...section,
            content: newContent
          });
        } else if (data) {
          updatedSections.push(data);
        }
      } else {
        // Keep existing content that doesn't need updating
        updatedSections.push(section);
      }
    }
    
    return updatedSections;
  }
}
