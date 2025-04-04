import { supabase } from '@/lib/supabase';

// Define interfaces for course content
export interface CourseResource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
  description?: string;
  createdAt: string;
}

export interface CourseSection {
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'quiz' | 'interactive';
  orderIndex: number;
  duration: number;
  isCompleted: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  duration: number;
  isCompleted: boolean;
  sections: CourseSection[];
  resources: CourseResource[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  progress: number;
  ragStatus: 'red' | 'amber' | 'green';
  enrolledDate?: string;
  lastAccessed?: string;
  dueDate?: string;
  instructor?: string;
  modules: CourseModule[];
}

/**
 * Service for managing course content
 */
class CourseContentService {
  private static instance: CourseContentService;

  /**
   * Get the singleton instance
   */
  public static getInstance(): CourseContentService {
    if (!CourseContentService.instance) {
      CourseContentService.instance = new CourseContentService();
    }
    return CourseContentService.instance;
  }

  /**
   * Fetch a course by its ID, including all modules, sections, and resources
   */
  async getCourseById(courseId: string, userId: string): Promise<Course | null> {
    try {
      // Check if this is a mock course ID (for development/testing)
      if (courseId.startsWith('comm-skills-') || courseId.startsWith('data-python-') || courseId.startsWith('leadership-')) {
        console.log(`Generating mock course content for course: ${courseId}`);
        return this.generateMockCourseContent(courseId, userId);
      }

      // Try to get enrollment from both regular enrollments and HR enrollments
      let enrollmentData: any = null;
      let enrollmentError: any = null;
      let isCourseHRAssigned = false;
      
      // 1a. Get the course enrollment details from regular enrollments
      const { data: regularEnrollment, error: regularEnrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          progress,
          rag_status,
          enrolled_date,
          due_date,
          last_accessed,
          course:courses (
            id,
            title,
            description,
            cover_image,
            level,
            estimated_duration,
            instructor
          )
        `)
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();

      if (!regularEnrollmentError && regularEnrollment) {
        enrollmentData = regularEnrollment;
      } else if (regularEnrollmentError && regularEnrollmentError.code !== 'PGRST116') {
        // Only throw if it's an error other than "not found"
        console.error('Error checking regular enrollment:', regularEnrollmentError);
      }

      // 1b. If no regular enrollment, check for HR assignment
      if (!enrollmentData) {
        const { data: hrEnrollment, error: hrEnrollmentError } = await supabase
          .from('hr_course_enrollments')
          .select(`
            id,
            progress,
            status,
            enrollment_date,
            completion_date,
            course_id
          `)
          .eq('course_id', courseId)
          .eq('employee_id', userId)
          .single();

        if (!hrEnrollmentError && hrEnrollment) {
          isCourseHRAssigned = true;
          
          // Fetch course details separately to avoid type issues
          const { data: hrCourse, error: hrCourseError } = await supabase
            .from('hr_courses')
            .select('id, title, description, thumbnail, level, duration_hours, category')
            .eq('id', courseId)
            .single();
            
          enrollmentData = {
            id: hrEnrollment.id,
            progress: hrEnrollment.progress || 0,
            rag_status: hrEnrollment.status || 'amber',
            enrolled_date: hrEnrollment.enrollment_date,
            due_date: null,
            last_accessed: new Date().toISOString(),
            course: {
              id: courseId,
              title: hrCourse?.title || 'Untitled Course',
              description: hrCourse?.description || '',
              cover_image: hrCourse?.thumbnail || null,
              level: hrCourse?.level || 'All Levels',
              estimated_duration: hrCourse?.duration_hours || 2,
              instructor: null
            }
          };
        } else if (hrEnrollmentError && hrEnrollmentError.code !== 'PGRST116') {
          console.error('Error checking HR enrollment:', hrEnrollmentError);
        }
      }

      // If no enrollment found in either system, return null
      if (!enrollmentData) {
        console.error('No enrollment found for this course');
        return null;
      }

      // Extract course data
      const courseData = enrollmentData.course;
      
      // 2. Get all modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        // If we can't get modules, try to create mock content
        return this.generateMockCourseContent(courseId, userId, courseData, enrollmentData);
      }

      // If there are no modules for this course, generate mock content
      if (!modulesData || modulesData.length === 0) {
        console.log('No modules found for this course, generating mock content');
        return this.generateMockCourseContent(courseId, userId, courseData, enrollmentData);
      }

      // Continue with the rest of the method (sections, resources, etc.)
      // ... existing code ...

      // 3. Get all sections for these modules
      const moduleIds = modulesData.map(module => module.id);
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('module_sections')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // 4. Get all resources for this course
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId);

      if (resourcesError) throw resourcesError;

      // 5. Get completion status for modules and sections
      const { data: completionData, error: completionError } = await supabase
        .from('content_completions')
        .select('content_id, content_type, completed')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (completionError) throw completionError;

      // Create lookup maps for completed content
      const completedContent = new Map<string, boolean>();
      completionData?.forEach(item => {
        completedContent.set(`${item.content_type}_${item.content_id}`, item.completed);
      });

      // Map sections by module
      const sectionsByModule = new Map<string, CourseSection[]>();
      sectionsData?.forEach(section => {
        if (!sectionsByModule.has(section.module_id)) {
          sectionsByModule.set(section.module_id, []);
        }
        
        const isCompleted = completedContent.get(`section_${section.id}`) || false;
        
        sectionsByModule.get(section.module_id)?.push({
          id: section.id,
          title: section.title,
          content: section.content || '',
          contentType: section.content_type || 'text',
          orderIndex: section.order_index,
          duration: section.duration || 0,
          isCompleted
        });
      });

      // Map resources by module
      const resourcesByModule = new Map<string, CourseResource[]>();
      resourcesData?.forEach(resource => {
        if (resource.module_id) {
          if (!resourcesByModule.has(resource.module_id)) {
            resourcesByModule.set(resource.module_id, []);
          }
          
          resourcesByModule.get(resource.module_id)?.push({
            id: resource.id,
            title: resource.title,
            type: resource.type || 'file',
            url: resource.url || '',
            description: resource.description,
            createdAt: resource.created_at
          });
        }
      });

      // Map modules
      const modules: CourseModule[] = modulesData.map(module => {
        const isCompleted = completedContent.get(`module_${module.id}`) || false;
        
        return {
          id: module.id,
          title: module.title,
          description: module.description || '',
          orderIndex: module.order_index,
          duration: module.duration || 0,
          isCompleted,
          sections: sectionsByModule.get(module.id) || [],
          resources: resourcesByModule.get(module.id) || []
        };
      });

      // Construct the course object
      const course: Course = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || '',
        coverImage: courseData.cover_image,
        level: courseData.level || 'All Levels',
        duration: `${courseData.estimated_duration || 0} hours`,
        progress: enrollmentData.progress || 0,
        ragStatus: (enrollmentData.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
        enrolledDate: enrollmentData.enrolled_date,
        lastAccessed: enrollmentData.last_accessed,
        dueDate: enrollmentData.due_date,
        instructor: courseData.instructor,
        modules
      };

      return course;
    } catch (error) {
      console.error('Error fetching course content:', error);
      // If an error occurs, try to generate mock data as a fallback
      return this.generateMockCourseContent(courseId, userId);
    }
  }

  /**
   * Generate mock course content for development and testing
   */
  private generateMockCourseContent(
    courseId: string, 
    userId: string, 
    courseData?: any, 
    enrollmentData?: any
  ): Course {
    // Determine course type from ID pattern
    let title = 'Course';
    let description = 'Course description';
    let level = 'All Levels';
    
    if (courseId.startsWith('comm-skills-')) {
      title = 'Communication Skills for Professionals';
      description = 'Develop effective communication skills for professional environments';
      level = 'Intermediate';
    } else if (courseId.startsWith('data-python-')) {
      title = 'Data Analysis with Python';
      description = 'Learn data analysis and visualization techniques using Python';
      level = 'Beginner';
    } else if (courseId.startsWith('leadership-')) {
      title = 'Leadership Essentials';
      description = 'Core leadership skills for emerging leaders';
      level = 'Advanced';
    }
    
    // Use provided data if available
    if (courseData) {
      title = courseData.title || title;
      description = courseData.description || description;
      level = courseData.level || level;
    }
    
    // Generate modules with sections
    const modules: CourseModule[] = [];
    
    // Module 1: Introduction
    const introModule: CourseModule = {
      id: `${courseId}-module-1`,
      title: 'Introduction and Overview',
      description: 'Get started with the basics and understand key concepts.',
      orderIndex: 1,
      duration: 60,
      isCompleted: false,
      resources: [
        {
          id: `${courseId}-resource-1`,
          title: 'Course Handbook',
          type: 'pdf',
          url: '#',
          description: 'A comprehensive guide to this course',
          createdAt: new Date().toISOString()
        }
      ],
      sections: [
        {
          id: `${courseId}-section-1-1`,
          title: 'Course Introduction',
          content: `<div class="prose max-w-none">
            <h2>Welcome to ${title}</h2>
            <p>This course will help you master key concepts and skills in ${description.toLowerCase()}. Through a combination of interactive content, practical exercises, and assessments, you'll build your expertise and confidence.</p>
            <h3>Learning Objectives</h3>
            <ul>
              <li>Understand fundamental principles</li>
              <li>Apply concepts to real-world scenarios</li>
              <li>Develop practical skills that enhance your career</li>
            </ul>
            <p>Let's begin our learning journey!</p>
          </div>`,
          contentType: 'text',
          orderIndex: 1,
          duration: 15,
          isCompleted: false
        },
        {
          id: `${courseId}-section-1-2`,
          title: 'Key Concepts Overview',
          content: `<div class="prose max-w-none">
            <h2>Essential Concepts</h2>
            <p>Before diving deep into practical applications, it's important to understand the core concepts that form the foundation of this course.</p>
            <p>We'll explore these ideas in detail throughout the modules, but here's a quick overview:</p>
            <ul>
              <li><strong>Concept 1:</strong> Understanding the fundamentals</li>
              <li><strong>Concept 2:</strong> Building on basic principles</li>
              <li><strong>Concept 3:</strong> Advanced applications</li>
            </ul>
            <p>These concepts will be reinforced through practical exercises and real-world examples.</p>
          </div>`,
          contentType: 'text',
          orderIndex: 2,
          duration: 20,
          isCompleted: false
        }
      ]
    };
    
    // Module 2: Core Content
    const coreModule: CourseModule = {
      id: `${courseId}-module-2`,
      title: 'Core Principles',
      description: 'Explore the essential principles and practical applications.',
      orderIndex: 2,
      duration: 90,
      isCompleted: false,
      resources: [
        {
          id: `${courseId}-resource-2`,
          title: 'Supplementary Reading',
          type: 'link',
          url: '#',
          description: 'Additional resources to deepen your understanding',
          createdAt: new Date().toISOString()
        }
      ],
      sections: [
        {
          id: `${courseId}-section-2-1`,
          title: 'Principle One',
          content: `<div class="prose max-w-none">
            <h2>First Core Principle</h2>
            <p>This section explores the first fundamental principle in detail. Understanding this concept is crucial for mastering the subject matter.</p>
            <h3>Key Points</h3>
            <ul>
              <li>Important aspect #1 of this principle</li>
              <li>Important aspect #2 of this principle</li>
              <li>How this connects to real-world applications</li>
            </ul>
            <p>By the end of this section, you should be able to explain this principle in your own words and recognize its application in various contexts.</p>
          </div>`,
          contentType: 'text',
          orderIndex: 1,
          duration: 30,
          isCompleted: false
        },
        {
          id: `${courseId}-section-2-2`,
          title: 'Principle Two',
          content: `<div class="prose max-w-none">
            <h2>Second Core Principle</h2>
            <p>Building on what we learned in the previous section, we'll now explore the second core principle.</p>
            <p>This principle extends our understanding and provides a framework for more complex applications.</p>
            <h3>Practical Application</h3>
            <p>Let's examine how this principle works in practice:</p>
            <ol>
              <li>Step 1: Identify the context</li>
              <li>Step 2: Apply the principle</li>
              <li>Step 3: Evaluate the outcome</li>
            </ol>
            <p>Practice applying this principle in different scenarios to reinforce your understanding.</p>
          </div>`,
          contentType: 'text',
          orderIndex: 2,
          duration: 30,
          isCompleted: false
        },
        {
          id: `${courseId}-section-2-3`,
          title: 'Video Demonstration',
          content: `<div class="prose max-w-none">
            <h2>Visual Learning</h2>
            <p>Sometimes concepts are easier to understand when demonstrated visually. The following video shows the practical application of what we've discussed so far.</p>
            <div class="aspect-video bg-slate-100 rounded-md flex items-center justify-center my-4">
              <p class="text-slate-500">Video demonstration would be embedded here</p>
            </div>
            <p>After watching the video, try to identify the key principles being applied and how they contribute to the overall outcome.</p>
          </div>`,
          contentType: 'video',
          orderIndex: 3,
          duration: 30,
          isCompleted: false
        }
      ]
    };
    
    // Module 3: Advanced Topics
    const advancedModule: CourseModule = {
      id: `${courseId}-module-3`,
      title: 'Advanced Applications',
      description: 'Take your skills to the next level with advanced techniques and applications.',
      orderIndex: 3,
      duration: 120,
      isCompleted: false,
      resources: [
        {
          id: `${courseId}-resource-3`,
          title: 'Case Studies',
          type: 'file',
          url: '#',
          description: 'Real-world examples and solutions',
          createdAt: new Date().toISOString()
        }
      ],
      sections: [
        {
          id: `${courseId}-section-3-1`,
          title: 'Advanced Application 1',
          content: `<div class="prose max-w-none">
            <h2>Taking It to the Next Level</h2>
            <p>Now that you have a solid grasp of the fundamental principles, we can explore more advanced applications.</p>
            <p>This section introduces techniques that build upon what you've already learned but add complexity and sophistication.</p>
            <h3>Advanced Technique Overview</h3>
            <p>The following techniques require a strong foundation in the core principles:</p>
            <ul>
              <li><strong>Technique A:</strong> Extending basic concepts to complex scenarios</li>
              <li><strong>Technique B:</strong> Combining multiple principles for comprehensive solutions</li>
              <li><strong>Technique C:</strong> Optimizing approaches for efficiency and effectiveness</li>
            </ul>
            <p>We'll explore each of these in depth, with practical examples and exercises.</p>
          </div>`,
          contentType: 'text',
          orderIndex: 1,
          duration: 40,
          isCompleted: false
        },
        {
          id: `${courseId}-section-3-2`,
          title: 'Case Study Analysis',
          content: `<div class="prose max-w-none">
            <h2>Learning from Real Examples</h2>
            <p>One of the best ways to deepen your understanding is to analyze real-world cases where these principles have been applied successfully (or unsuccessfully).</p>
            <p>In this section, we'll examine a case study that illustrates the application of what we've learned so far.</p>
            <h3>Case Study: [Example Scenario]</h3>
            <p><strong>Background:</strong> Brief description of the scenario and context.</p>
            <p><strong>Challenge:</strong> What problems needed to be addressed?</p>
            <p><strong>Solution Approach:</strong> How were the principles applied?</p>
            <p><strong>Outcome:</strong> What results were achieved?</p>
            <p><strong>Lessons Learned:</strong> Key takeaways from this case.</p>
            <p>As you review this case, consider how you might apply similar approaches to challenges in your own context.</p>
          </div>`,
          contentType: 'text',
          orderIndex: 2,
          duration: 40,
          isCompleted: false
        },
        {
          id: `${courseId}-section-3-3`,
          title: 'Practice Assessment',
          content: `<div class="prose max-w-none">
            <h2>Test Your Knowledge</h2>
            <p>Now it's time to put your understanding to the test with a series of questions and exercises.</p>
            <p>This assessment will help you identify areas where you're strong and areas that might need further review.</p>
            <div class="bg-slate-50 p-4 rounded-md my-4">
              <h3 class="mb-2">Sample Question 1</h3>
              <p>In what situation would you apply Principle A instead of Principle B?</p>
              <ul class="mt-2">
                <li>A. When dealing with [specific scenario]</li>
                <li>B. When the goal is to [specific outcome]</li>
                <li>C. When resources are limited and [specific constraint]</li>
                <li>D. All of the above</li>
              </ul>
              <p class="mt-2 text-sm text-slate-500">Select the best answer and check your understanding.</p>
            </div>
            <p>Complete the full assessment in your own time, and don't hesitate to revisit earlier sections if you need to refresh your understanding.</p>
          </div>`,
          contentType: 'quiz',
          orderIndex: 3,
          duration: 40,
          isCompleted: false
        }
      ]
    };
    
    // Add modules to the course
    modules.push(introModule, coreModule, advancedModule);
    
    // Create the course object
    const course: Course = {
      id: courseId,
      title: title,
      description: description,
      coverImage: courseData?.cover_image || null,
      level: level as 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels',
      duration: enrollmentData?.course?.estimated_duration ? `${enrollmentData.course.estimated_duration} hours` : '4.5 hours',
      progress: enrollmentData?.progress || 0,
      ragStatus: (enrollmentData?.rag_status || 'amber').toLowerCase() as 'red' | 'amber' | 'green',
      enrolledDate: enrollmentData?.enrolled_date || new Date().toISOString(),
      lastAccessed: enrollmentData?.last_accessed || new Date().toISOString(),
      dueDate: enrollmentData?.due_date || null,
      instructor: enrollmentData?.course?.instructor || 'Course Instructor',
      modules
    };

    return course;
  }

  /**
   * Mark a module or section as completed
   */
  async markContentAsCompleted(
    userId: string,
    courseId: string,
    contentId: string,
    contentType: 'module' | 'section'
  ): Promise<boolean> {
    try {
      // Check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('content_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;

      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from('content_completions')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        // Insert new record
        result = await supabase
          .from('content_completions')
          .insert({
            user_id: userId,
            course_id: courseId,
            content_id: contentId,
            content_type: contentType,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      // Update the course progress
      await this.updateCourseProgress(userId, courseId);

      return true;
    } catch (error) {
      console.error('Error marking content as completed:', error);
      return false;
    }
  }

  /**
   * Update overall course progress based on completed modules and sections
   */
  private async updateCourseProgress(userId: string, courseId: string): Promise<void> {
    try {
      // Get all modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      // Get completion data
      const { data: completionData, error: completionError } = await supabase
        .from('content_completions')
        .select('content_id, content_type, completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

      if (completionError) throw completionError;

      // Calculate progress
      const totalModules = modulesData.length;
      const completedModules = completionData
        .filter(item => item.content_type === 'module' && item.completed)
        .length;

      const progress = totalModules > 0 
        ? Math.round((completedModules / totalModules) * 100) 
        : 0;

      // Update the enrollment record
      await supabase
        .from('course_enrollments')
        .update({
          progress,
          last_accessed: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);

    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  }
}

export default CourseContentService; 