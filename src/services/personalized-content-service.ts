
// Add or update the PersonalizedContentService implementation
import { supabase } from '@/lib/supabase';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { v4 as uuidv4 } from 'uuid';

export class PersonalizedContentService {
  private static instance: PersonalizedContentService;

  private constructor() {}

  public static getInstance(): PersonalizedContentService {
    if (!PersonalizedContentService.instance) {
      PersonalizedContentService.instance = new PersonalizedContentService();
    }
    return PersonalizedContentService.instance;
  }

  /**
   * Check if personalized content exists for a course and user
   */
  public async hasPersonalizedContent(courseId: string, userId: string): Promise<boolean> {
    try {
      console.log(`Checking if personalized content exists for course ${courseId} and user ${userId}`);
      
      const { data, error } = await supabase
        .from('ai_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      if (error) throw error;
      
      const exists = data && data.length > 0;
      console.log(`Found ${data?.length} personalized content records`);
      return exists;
    } catch (error) {
      console.error('Error checking for personalized content:', error);
      return false;
    }
  }

  /**
   * Get personalized content for a course and user
   */
  public async getPersonalizedContent(courseId: string, userId: string): Promise<{
    content: AICourseContent | null;
    sections: AICourseContentSection[];
  }> {
    try {
      console.log(`Fetching personalized content for course ${courseId} and user ${userId}`);
      
      // Get content
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .select('*')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (contentError) {
        console.error('Error fetching personalized content:', contentError);
        return { content: null, sections: [] };
      }
      
      console.log(`Personalized content found with ID: ${contentData?.id}`);
      
      // Get sections for this content
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('ai_course_content_sections')
        .select('*')
        .eq('content_id', contentData?.id)
        .order('order_index', { ascending: true });
      
      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        return { content: contentData, sections: [] };
      }
      
      console.log(`Found ${sectionsData?.length} personalized content sections`);
      
      // If no sections found, generate basic placeholder sections
      if (contentData && (!sectionsData || sectionsData.length === 0)) {
        console.log(`No sections found, generating basic sections`);
        try {
          const generatedSections = await this.generateBasicSections(contentData);
          console.log(`Generated ${generatedSections.length} basic sections for content ID: ${contentData.id}`);
          return { content: contentData, sections: generatedSections };
        } catch (error) {
          console.error('Error generating basic sections:', error);
          // Return content but with empty sections
          return { content: contentData, sections: [] };
        }
      }
      
      return { content: contentData, sections: sectionsData || [] };
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      return { content: null, sections: [] };
    }
  }
  
  /**
   * Generate basic placeholder sections for content that doesn't have any
   */
  private async generateBasicSections(content: AICourseContent): Promise<AICourseContentSection[]> {
    const sections: AICourseContentSection[] = [];
    
    try {
      // Helper function to create a section and handle insertion
      const createSection = async (moduleId: string, sectionIndex: number, title: string, sectionContent: string): Promise<AICourseContentSection> => {
        // Generate proper UUIDs for module_id and section_id
        const sectionId = uuidv4();
        const sectionModuleId = uuidv4(); // Using UUID instead of string format
        
        const section: AICourseContentSection = {
          id: sectionId,
          title: title,
          module_id: sectionModuleId, // Using proper UUID
          section_id: sectionId, // Using the same UUID as id for section_id
          content: sectionContent,
          content_id: content.id,
          order_index: sectionIndex
        };
        
        try {
          const { error } = await supabase
            .from('ai_course_content_sections')
            .insert(section);
            
          if (error) {
            console.error(`Error inserting section:`, error);
            // Return the section object even if insertion failed - user will still see something
          }
        } catch (err) {
          console.error('Exception inserting section:', err);
        }
        
        return section;
      };
      
      // Module one UUID
      const moduleOneId = uuidv4();
      const moduleTwoId = uuidv4();
      
      // For first module (Introduction)
      const introContent = `<div class="prose max-w-none">
        <h2>Welcome to Your Personalized Course</h2>
        <p>This content has been specially tailored for you based on your profile, experience level, and career goals.</p>
        <p>The system is currently preparing your complete personalized learning path. In the meantime, here is some introductory content to get you started.</p>
        <h3>How to Use This Course</h3>
        <ul>
          <li>Work through the sections sequentially</li>
          <li>Complete all activities and quizzes</li>
          <li>Mark sections as complete when you're done with them</li>
        </ul>
        <blockquote>
          <p>Learning is not a spectator sport. To understand is to discover, to reconstruct for oneself, and to invent.</p>
        </blockquote>
      </div>`;
      
      const overviewContent = `<div class="prose max-w-none">
        <h2>Course Overview</h2>
        <p>This course will cover key concepts and skills that are relevant to your role and experience level.</p>
        <h3>Learning Objectives</h3>
        <ul>
          <li>Understand core concepts with examples tailored to your background</li>
          <li>Develop practical skills that are immediately applicable to your role</li>
          <li>Connect new knowledge with your existing experience</li>
        </ul>
        <p>Your profile indicates interests and experience that will be incorporated throughout this personalized learning experience.</p>
      </div>`;
      
      // For second module (Core Content)
      const conceptsContent = `<div class="prose max-w-none">
        <h2>Key Concepts</h2>
        <p>This section introduces the fundamental concepts of the course with examples relevant to your background.</p>
        <p>Your personalized learning path will expand on these concepts with more specific examples and applications once it's fully generated.</p>
        <h3>Core Principles</h3>
        <ul>
          <li>Principle One: Foundation of understanding</li>
          <li>Principle Two: Application in context</li>
          <li>Principle Three: Advanced implementation</li>
        </ul>
      </div>`;
      
      const applicationsContent = `<div class="prose max-w-none">
        <h2>Practical Applications</h2>
        <p>This section provides practical examples of how to apply course concepts in real-world scenarios.</p>
        <h3>Case Study</h3>
        <p>Consider a situation where you need to implement these concepts in your current role. What steps would you take?</p>
        <ol>
          <li>Identify the specific challenge</li>
          <li>Apply relevant principles from this course</li>
          <li>Measure outcomes and adjust your approach</li>
        </ol>
      </div>`;
      
      // For assessment/activities
      const activitiesContent = `<div class="prose max-w-none">
        <h2>Learning Activities</h2>
        <p>Complete these activities to reinforce your understanding:</p>
        <h3>Activity 1: Reflection</h3>
        <p>Consider how the concepts in this course relate to your current role:</p>
        <ul>
          <li>What aspects are most relevant to your daily work?</li>
          <li>Which concepts represent new knowledge for you?</li>
          <li>How might applying these concepts improve your effectiveness?</li>
        </ul>
      </div>`;
      
      const resourcesContent = `<div class="prose max-w-none">
        <h2>Additional Resources</h2>
        <p>These resources will help deepen your understanding:</p>
        <ul>
          <li>Recommended reading materials tailored to your learning style</li>
          <li>Practical exercises to apply concepts in your specific context</li>
          <li>Community forums to discuss topics with peers</li>
        </ul>
        <p>Your complete personalized learning path will include more specific resources matched to your profile and learning preferences.</p>
      </div>`;
      
      // Create and save sections
      const contents = [
        { moduleId: moduleOneId, title: "Module 1: Introduction", content: introContent },
        { moduleId: moduleOneId, title: "Module 1: Course Overview", content: overviewContent },
        { moduleId: moduleTwoId, title: "Module 2: Key Concepts", content: conceptsContent },
        { moduleId: moduleTwoId, title: "Module 2: Practical Applications", content: applicationsContent },
        { moduleId: moduleTwoId, title: "Module 2: Learning Activities", content: activitiesContent },
        { moduleId: moduleTwoId, title: "Module 2: Additional Resources", content: resourcesContent }
      ];
      
      let index = 0;
      for (const item of contents) {
        const section = await createSection(item.moduleId, index, item.title, item.content);
        sections.push(section);
        index++;
      }
    } catch (error) {
      console.error('Error in generateBasicSections:', error);
    }
    
    return sections;
  }
  
  /**
   * Get enrollment ID for a course and employee
   */
  public async getEnrollmentId(courseId: string, employeeId: string): Promise<string | null> {
    try {
      console.log(`Looking up enrollment for course ${courseId} and employee ${employeeId}`);
      
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No enrollment found');
          return null;
        }
        throw error;
      }
      
      console.log(`Enrollment found with ID: ${data?.id}`);
      return data?.id || null;
    } catch (error) {
      console.error('Error getting enrollment ID:', error);
      return null;
    }
  }
  
  /**
   * Get content generation status
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
      
      if (error) throw error;
      
      const isGenerating = data?.personalized_content_generation_status === 'in_progress';
      const startedAt = data?.personalized_content_started_at;
      
      // Estimate completion time (5 minutes from start)
      let estimatedCompletion;
      if (startedAt) {
        const startTime = new Date(startedAt);
        const estimatedTime = new Date(startTime.getTime() + 5 * 60000); // 5 minutes
        estimatedCompletion = estimatedTime.toISOString();
      }
      
      return {
        isGenerating,
        startedAt,
        estimatedCompletion
      };
    } catch (error) {
      console.error('Error getting content generation status:', error);
      return { isGenerating: false };
    }
  }
}
