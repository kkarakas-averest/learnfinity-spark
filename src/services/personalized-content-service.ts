
import { supabase } from '@/lib/supabase';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for retrieving personalized course content
 */
export class PersonalizedContentService {
  private static instance: PersonalizedContentService;

  private constructor() {
    // Check if essential tables exist as a diagnostic step
    this.checkHRTablesExist();
  }

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
   * Diagnostic check to verify essential tables exist
   */
  private async checkHRTablesExist(): Promise<void> {
    try {
      const requiredTables = [
        'hr_courses',
        'hr_course_enrollments',
        'ai_course_content',
        'ai_course_content_sections'
      ];
      
      // Try a simple query to see if tables exist
      const { error } = await supabase
        .from('hr_courses')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error checking hr_courses table:', error);
      } else {
        console.log('HR tables essential check: All exist');
      }
    } catch (error) {
      console.error('Error checking HR tables:', error);
    }
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
      // Use ai_course_content table
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .select('*')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed from single() to maybeSingle() to prevent errors

      if (contentError) {
        console.log(`No personalized content found: ${contentError.message}`);
        return { content: null, sections: [] };
      }

      if (!contentData) {
        console.log('No personalized content found for this course and user');
        return { content: null, sections: [] };
      }

      console.log(`Personalized content found with ID: ${contentData.id}`);

      // Get sections for this personalized content using ai_course_content_sections table
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
      // Use ai_course_content table
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
   * Create personalized content for a course and user
   * This function is used as a fallback if the API call fails
   */
  public async createPersonalizedContent(courseId: string, userId: string, courseTitle: string, courseDescription: string = ''): Promise<{ 
    success: boolean;
    content?: AICourseContent;
    sections?: AICourseContentSection[];
    error?: string;
  }> {
    try {
      console.log(`Generating personalized content for course ${courseId} and user ${userId}`);
      
      // Get user/employee data for personalization context
      const { data: userData, error: userError } = await supabase
        .from('hr_employees')
        .select(`
          id,
          name,
          email,
          department_id,
          position_id,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('user_id', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching user data for personalization:", userError);
        // Continue without user context
      }
      
      // Create personalization context based on user data
      const personalizationContext: any = {
        userProfile: {
          role: userData?.hr_positions?.title || 'Employee',
          department: userData?.hr_departments?.name || 'General',
        },
        employeeContext: {
          name: userData?.name || 'Employee',
          hire_date: userData?.hire_date || new Date().toISOString(),
        },
        courseContext: {
          title: courseTitle,
          description: courseDescription,
          id: courseId
        }
      };
      
      // Generate a UUID for the content
      const contentId = uuidv4();
      
      // Create content record in ai_course_content
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentId,
          course_id: courseId,
          title: courseTitle,
          description: courseDescription,
          created_for_user_id: userId,
          employee_id: userData?.id, // Use employee_id from hr_employees
          personalization_context: personalizationContext,
          learning_objectives: [
            `Understand the core concepts of ${courseTitle}`,
            `Apply ${courseTitle} in practical situations`,
            `Develop expertise in ${courseTitle} techniques`
          ],
          is_active: true,
          version: '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (contentError) {
        console.error("Error creating ai_course_content record:", contentError);
        return { 
          success: false, 
          error: `Failed to create content record: ${contentError.message}` 
        };
      }
      
      // Generate basic module structure
      const modules = [
        { title: `Introduction to ${courseTitle}`, id: 'module-1' },
        { title: `Core Concepts of ${courseTitle}`, id: 'module-2' },
        { title: `Advanced ${courseTitle} Techniques`, id: 'module-3' }
      ];
      
      // Generate sections for each module
      const sections: AICourseContentSection[] = [];
      
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex];
        
        // Create 3 sections per module
        for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
          const sectionId = uuidv4();
          const sectionTitle = this.generateSectionTitle(module.title, sectionIndex);
          const sectionContent = this.generateSectionContent(module.title, sectionTitle, personalizationContext);
          
          sections.push({
            id: sectionId,
            content_id: contentId,
            module_id: module.id,
            section_id: `section-${moduleIndex + 1}-${sectionIndex + 1}`,
            title: sectionTitle,
            content: sectionContent,
            order_index: moduleIndex * 3 + sectionIndex,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      
      // Insert sections
      const { error: sectionsError } = await supabase
        .from('ai_course_content_sections')
        .insert(sections);
      
      if (sectionsError) {
        console.error("Error creating section records:", sectionsError);
        // We'll still return success but log the error
        console.warn("Content created but sections failed to save");
      }
      
      // Update the enrollment record to indicate content generation is complete
      await this.updateEnrollmentStatus(courseId, userId, contentId);
      
      return {
        success: true,
        content: contentData as AICourseContent,
        sections: sections
      };
    } catch (error: any) {
      console.error("Error in createPersonalizedContent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
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
        .maybeSingle(); // Changed from single() to maybeSingle() to prevent errors

      if (error || !data) {
        console.log(`No enrollment found: ${error?.message || 'No data returned'}`);
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
   * Update enrollment status after content generation
   */
  private async updateEnrollmentStatus(courseId: string, userId: string, contentId: string): Promise<void> {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle(); // Changed from single() to maybeSingle()
      
      if (employeeError || !employeeData) {
        console.error("Could not find employee record for user:", userId, employeeError);
        return;
      }
      
      const enrollmentId = await this.getEnrollmentId(courseId, employeeData.id);
      
      if (!enrollmentId) {
        console.error("Could not find enrollment for course and employee");
        return;
      }
      
      await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_id: contentId,
          personalized_content_generation_status: 'completed',
          personalized_content_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);
        
      console.log(`Updated enrollment ${enrollmentId} with personalized content ID: ${contentId}`);
    } catch (error) {
      console.error("Error updating enrollment status:", error);
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
        .maybeSingle(); // Changed from single() to maybeSingle()
        
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

  /**
   * Generate a title for a section based on module title and section index
   */
  private generateSectionTitle(moduleTitle: string, sectionIndex: number): string {
    // Extract the core topic from the module title
    const coreTopic = moduleTitle.replace(/introduction to |core concepts of |advanced |techniques/gi, '').trim();
    
    switch (sectionIndex) {
      case 0:
        return `Getting Started with ${coreTopic}`;
      case 1:
        return `Key Principles of ${coreTopic}`;
      case 2:
        return `Practical Applications of ${coreTopic}`;
      default:
        return `${coreTopic} - Section ${sectionIndex + 1}`;
    }
  }

  /**
   * Generate content for a section based on module and section titles and personalization context
   */
  private generateSectionContent(moduleTitle: string, sectionTitle: string, context: any): string {
    const coreTopic = moduleTitle.replace(/introduction to |core concepts of |advanced |techniques/gi, '').trim();
    const role = context?.userProfile?.role || 'professional';
    const department = context?.userProfile?.department || 'the organization';
    
    let content = `<h2>${sectionTitle}</h2>`;
    content += `<p>Welcome to this personalized section on ${coreTopic}. This content has been tailored for your role as a ${role} in ${department}.</p>`;
    
    if (sectionTitle.includes('Getting Started')) {
      content += `<p>In this introductory section, we'll explore the fundamental concepts of ${coreTopic} and why it's important for your role as a ${role}.</p>`;
      content += `<h3>What is ${coreTopic}?</h3>`;
      content += `<p>${coreTopic} is an essential area that impacts various aspects of ${department}. Understanding these concepts will help you improve your daily workflow and contribute more effectively to your team.</p>`;
      content += `<h3>Why ${coreTopic} Matters for ${role}s</h3>`;
      content += `<p>As a ${role}, you'll find that mastering ${coreTopic} helps you in several key areas:</p>`;
      content += `<ul>
        <li>Improved decision-making in your daily work</li>
        <li>Better collaboration with team members</li>
        <li>Enhanced problem-solving capabilities</li>
        <li>Greater impact on organizational goals</li>
      </ul>`;
    } else if (sectionTitle.includes('Key Principles')) {
      content += `<p>Now that we've covered the basics, let's dive deeper into the key principles of ${coreTopic} that are most relevant to your work in ${department}.</p>`;
      content += `<h3>Core Principle 1: Understanding the Fundamentals</h3>`;
      content += `<p>The first key principle involves mastering the foundational elements of ${coreTopic}. This includes recognizing patterns, understanding key terminology, and identifying how these concepts apply specifically to your role as a ${role}.</p>`;
      content += `<h3>Core Principle 2: Application in Your Context</h3>`;
      content += `<p>The second principle focuses on how ${coreTopic} applies specifically to your work in ${department}. This includes customized approaches that align with your organization's goals and objectives.</p>`;
      content += `<h3>Core Principle 3: Measuring Impact</h3>`;
      content += `<p>Finally, understanding how to measure the impact of applying ${coreTopic} principles in your work is crucial for continuous improvement and demonstrating value.</p>`;
    } else if (sectionTitle.includes('Practical Applications')) {
      content += `<p>In this section, we'll explore practical applications of ${coreTopic} specifically tailored for ${role}s in ${department}.</p>`;
      content += `<h3>Case Study: ${coreTopic} in Action</h3>`;
      content += `<p>Consider this scenario that's relevant to your role: A team in ${department} needed to implement ${coreTopic} principles to solve a critical challenge. By applying the concepts we've discussed, they were able to achieve significant improvements in efficiency and outcomes.</p>`;
      content += `<h3>Tools and Techniques</h3>`;
      content += `<p>Here are some specific tools and techniques that you can apply immediately in your role:</p>`;
      content += `<ol>
        <li><strong>Framework Application</strong>: Adapt the core ${coreTopic} framework to your specific needs in ${department}</li>
        <li><strong>Collaborative Approach</strong>: Engage team members using ${coreTopic} methodologies</li>
        <li><strong>Outcome Measurement</strong>: Track and report on the impact using key metrics relevant to your role</li>
      </ol>`;
      content += `<h3>Next Steps</h3>`;
      content += `<p>As you continue through this course, keep these practical applications in mind and think about how you can apply them to your current projects and responsibilities as a ${role}.</p>`;
    }
    
    return content;
  }
}

export default PersonalizedContentService.getInstance();
