import { supabase, getSupabase } from '@/lib/supabase';
import { AgentFactory } from '@/agents/AgentFactory';
import { ContentGenerationRequest } from '@/agents/types';

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
  private async generateMockCourseContent(
    courseId: string, 
    userId: string, 
    courseData?: any, 
    enrollmentData?: any
  ): Promise<Course> {
    // Try to use AI content generation when available
    try {
      const aiContent = await this.generateAIPersonalizedContent(courseId, userId, courseData, enrollmentData);
      if (aiContent) {
        console.log('Using AI-generated course content');
        return aiContent;
      }
    } catch (error) {
      console.error('Error generating AI personalized content:', error);
      console.log('Falling back to template-based mock content');
    }

    // Fallback to template-based content - create a rich content experience
    console.log('Generating template-based mock course content');
    
    // Determine course type and base details
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
    
    // Get content outline for this course type
    const contentOutline = this.createContentOutlineForCourse(title, courseId);
    
    // Generate modules with rich content for each section
    const modules: CourseModule[] = contentOutline.modules.map((moduleOutline: any) => {
      return {
        id: `${courseId}-${moduleOutline.id}`,
        title: moduleOutline.title,
        description: moduleOutline.description,
        orderIndex: moduleOutline.orderIndex,
        duration: moduleOutline.sections.reduce((total: number, s: any) => total + (s.duration || 20), 0),
        isCompleted: false,
        sections: moduleOutline.sections.map((sectionOutline: any, index: number) => ({
          id: `${courseId}-${moduleOutline.id}-section-${index + 1}`,
          title: sectionOutline.title,
          content: this.generateMockSectionContent(moduleOutline.title, sectionOutline.title),
          contentType: sectionOutline.type || 'text',
          orderIndex: index + 1,
          duration: sectionOutline.duration || 20,
          isCompleted: false
        })),
        resources: moduleOutline.resources || []
      };
    });
    
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
   * Generate AI personalized content for the course
   */
  private async generateAIPersonalizedContent(
    courseId: string,
    userId: string,
    courseData?: any,
    enrollmentData?: any
  ): Promise<Course | null> {
    try {
      // Determine course type and base details
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

      // Fetch user profile and preferences for personalization
      const { data: userProfile, error: profileError } = await supabase
        .from('learner_profiles')
        .select('*, learning_preferences')
        .eq('user_id', userId)
        .single();
        
      // Get employee data if available
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Create a user profile for personalization
      const learnerProfile = {
        id: userId,
        name: employeeData?.first_name 
          ? `${employeeData.first_name} ${employeeData.last_name}` 
          : 'Learner',
        role: employeeData?.title || 'Employee',
        department: employeeData?.department,
        preferences: userProfile?.learning_preferences || {
          preferred_learning_style: 'visual',
          preferred_content_types: ['text', 'video'],
          learning_goals: ['skill development']
        }
      };

      // Initialize the agent factory
      const agentFactory = AgentFactory.getInstance();
      
      // Create an educator agent
      const educatorAgent = agentFactory.createAgent('educator') as any;
      
      // Content outline based on course type
      const contentOutline = this.createContentOutlineForCourse(title, courseId);
      
      // Generate personalized content for the course
      const contentRequest: any = {
        contentType: 'course',
        topic: title,
        targetAudience: {
          skillLevel: level.toLowerCase(),
          role: learnerProfile.role,
          department: learnerProfile.department
        },
        learningObjectives: contentOutline.learningObjectives,
        keywords: contentOutline.keywords,
        includeExamples: true,
        includeQuizQuestions: true
      };

      // Generate content for each module
      const moduleGenerationPromises = contentOutline.modules.map(async (moduleOutline: any) => {
        // Create a module-specific content request
        const moduleRequest: ContentGenerationRequest = {
          ...contentRequest,
          topic: moduleOutline.title,
          learningObjectives: moduleOutline.objectives
        };

        try {
          // Generate content for this module
          const generatedContent = await educatorAgent.generateContentForRequest(moduleRequest);
          
          // Transform the generated content into the required format
          const sections = moduleOutline.sections.map((sectionOutline: any, index: number) => {
            // Get content from the generated content or use default
            let sectionContent = '';
            // Check if generatedContent exists and has the expected properties
            if (generatedContent && generatedContent.mainContent && generatedContent.mainContent.length > 0) {
              // If there are sections in the generated content, use them
              if (generatedContent.sections && generatedContent.sections.length > index) {
                sectionContent = `<div class="prose max-w-none">${generatedContent.sections[index].content}</div>`;
              } else {
                // Otherwise split the main content into parts
                const contentParts = generatedContent.mainContent.split('\n\n');
                const partIndex = index % contentParts.length;
                sectionContent = `<div class="prose max-w-none">${contentParts[partIndex]}</div>`;
              }
            } else {
              // Fallback content with more detailed information
              sectionContent = this.generateMockSectionContent(moduleOutline.title, sectionOutline.title);
            }

            return {
              id: `${courseId}-${moduleOutline.id}-section-${index + 1}`,
              title: sectionOutline.title,
              content: sectionContent,
              contentType: sectionOutline.type || 'text',
              orderIndex: index + 1,
              duration: sectionOutline.duration || 20,
              isCompleted: false
            };
          });

          // Create the course module
          return {
            id: `${courseId}-${moduleOutline.id}`,
            title: moduleOutline.title,
            description: moduleOutline.description,
            orderIndex: moduleOutline.orderIndex,
            duration: moduleOutline.sections.reduce((total: number, s: any) => total + (s.duration || 20), 0),
            isCompleted: false,
            sections,
            resources: moduleOutline.resources || []
          };
        } catch (error) {
          console.error(`Error generating content for module ${moduleOutline.title}:`, error);
          // Return a default module if content generation fails
          return {
            id: `${courseId}-${moduleOutline.id}`,
            title: moduleOutline.title,
            description: moduleOutline.description,
            orderIndex: moduleOutline.orderIndex,
            duration: moduleOutline.sections.reduce((total: number, s: any) => total + (s.duration || 20), 0),
            isCompleted: false,
            sections: moduleOutline.sections.map((sectionOutline: any, index: number) => ({
              id: `${courseId}-${moduleOutline.id}-section-${index + 1}`,
              title: sectionOutline.title,
              content: this.generateMockSectionContent(moduleOutline.title, sectionOutline.title),
              contentType: sectionOutline.type || 'text',
              orderIndex: index + 1,
              duration: sectionOutline.duration || 20,
              isCompleted: false
            })),
            resources: moduleOutline.resources || []
          };
        }
      });

      // Wait for all module generation to complete
      const modules = await Promise.all(moduleGenerationPromises);

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
    } catch (error) {
      console.error('Error in AI content generation:', error);
      return null;
    }
  }

  /**
   * Create a content outline for a specific course type
   */
  private createContentOutlineForCourse(title: string, courseId: string): any {
    // Base outline
    const baseOutline = {
      title,
      learningObjectives: [
        'Understand core concepts and principles',
        'Apply knowledge to practical scenarios',
        'Develop professional expertise'
      ],
      keywords: ['learning', 'professional development'],
      modules: []
    };

    // Communication Skills course
    if (courseId.startsWith('comm-skills-')) {
      return {
        ...baseOutline,
        learningObjectives: [
          'Understand the principles of effective communication',
          'Develop active listening skills',
          'Master verbal and nonverbal communication techniques',
          'Apply communication strategies in professional settings'
        ],
        keywords: ['communication', 'active listening', 'presentation', 'interpersonal skills', 'professional communication'],
        modules: [
          {
            id: 'module-1',
            title: 'Fundamentals of Professional Communication',
            description: 'Understanding the core principles and importance of effective communication in professional environments.',
            orderIndex: 1,
            sections: [
              { 
                title: 'The Communication Process', 
                type: 'text',
                duration: 15 
              },
              { 
                title: 'Barriers to Effective Communication', 
                type: 'text',
                duration: 20 
              },
              { 
                title: 'Communication Styles Assessment', 
                type: 'interactive',
                duration: 25 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-1`,
                title: 'Communication Framework Handbook',
                type: 'pdf',
                url: '#',
                description: 'A guide to understanding different communication models',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-2',
            title: 'Verbal and Non-Verbal Communication',
            description: 'Mastering the art of clear verbal communication and understanding body language.',
            orderIndex: 2,
            sections: [
              { 
                title: 'Powerful Language Techniques', 
                type: 'text',
                duration: 20 
              },
              { 
                title: 'Reading and Using Body Language', 
                type: 'video',
                duration: 25 
              },
              { 
                title: 'Voice Modulation and Tone', 
                type: 'text',
                duration: 15 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-2`,
                title: 'Body Language in Business Settings',
                type: 'video',
                url: '#',
                description: 'Expert analysis of effective non-verbal communication',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-3',
            title: 'Effective Workplace Communication',
            description: 'Applying communication skills in professional contexts for better outcomes.',
            orderIndex: 3,
            sections: [
              { 
                title: 'Email and Written Communication', 
                type: 'text',
                duration: 20 
              },
              { 
                title: 'Presentation Skills Mastery', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Difficult Conversations', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Communication Skills Assessment', 
                type: 'quiz',
                duration: 20 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-3`,
                title: 'Email Templates for Professionals',
                type: 'file',
                url: '#',
                description: 'Ready-to-use templates for common business scenarios',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      };
    } 
    // Data Analysis with Python course
    else if (courseId.startsWith('data-python-')) {
      return {
        ...baseOutline,
        learningObjectives: [
          'Understand Python fundamentals for data analysis',
          'Master key data manipulation libraries (NumPy, Pandas)',
          'Create effective data visualizations',
          'Apply statistical analysis techniques to real datasets'
        ],
        keywords: ['python', 'data analysis', 'pandas', 'numpy', 'visualization', 'statistics'],
        modules: [
          {
            id: 'module-1',
            title: 'Python Fundamentals for Data Analysis',
            description: 'Core Python concepts essential for data analysis work.',
            orderIndex: 1,
            sections: [
              { 
                title: 'Python Data Structures for Analysis', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Working with Files and Data Sources', 
                type: 'text',
                duration: 20 
              },
              { 
                title: 'Python Functions for Data Manipulation', 
                type: 'text',
                duration: 30 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-1`,
                title: 'Python Cheat Sheet for Data Analysis',
                type: 'pdf',
                url: '#',
                description: 'Quick reference for Python data functions',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-2',
            title: 'Data Manipulation with NumPy and Pandas',
            description: 'Using Python libraries to clean, transform, and analyze data effectively.',
            orderIndex: 2,
            sections: [
              { 
                title: 'NumPy Arrays and Operations', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Pandas DataFrames and Series', 
                type: 'text',
                duration: 35 
              },
              { 
                title: 'Data Cleaning Techniques', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Practical Data Manipulation Exercise', 
                type: 'interactive',
                duration: 40 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-2`,
                title: 'Sample Datasets',
                type: 'file',
                url: '#',
                description: 'Practice datasets for exercises',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-3',
            title: 'Data Visualization and Analysis',
            description: 'Creating meaningful visualizations and drawing insights from data.',
            orderIndex: 3,
            sections: [
              { 
                title: 'Visualization with Matplotlib and Seaborn', 
                type: 'text',
                duration: 35 
              },
              { 
                title: 'Statistical Analysis Fundamentals', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Creating Interactive Dashboards', 
                type: 'video',
                duration: 25 
              },
              { 
                title: 'Final Project: Data Analysis Report', 
                type: 'interactive',
                duration: 45 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-3`,
                title: 'Visualization Best Practices',
                type: 'link',
                url: '#',
                description: 'Guide to creating effective data visualizations',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      };
    } 
    // Leadership course
    else if (courseId.startsWith('leadership-')) {
      return {
        ...baseOutline,
        learningObjectives: [
          'Understand core leadership principles and styles',
          'Develop effective team management techniques',
          'Master strategic decision-making processes',
          'Build emotional intelligence and interpersonal skills'
        ],
        keywords: ['leadership', 'management', 'team building', 'strategic thinking', 'emotional intelligence'],
        modules: [
          {
            id: 'module-1',
            title: 'Leadership Foundations',
            description: 'Understanding the core principles and theories of effective leadership.',
            orderIndex: 1,
            sections: [
              { 
                title: 'Leadership Styles and Their Impact', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Traits of Effective Leaders', 
                type: 'text',
                duration: 20 
              },
              { 
                title: 'Leadership Self-Assessment', 
                type: 'interactive',
                duration: 30 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-1`,
                title: 'Leadership Models Overview',
                type: 'pdf',
                url: '#',
                description: 'Comprehensive guide to leadership theories',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-2',
            title: 'Team Leadership and Management',
            description: 'Building and managing high-performing teams through effective leadership.',
            orderIndex: 2,
            sections: [
              { 
                title: 'Building High-Performance Teams', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Effective Delegation and Empowerment', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Managing Team Dynamics and Conflict', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Team Leadership Case Study', 
                type: 'interactive',
                duration: 35 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-2`,
                title: 'Team Performance Assessment Tool',
                type: 'link',
                url: '#',
                description: 'Interactive tool for evaluating team effectiveness',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-3',
            title: 'Strategic Leadership and Decision Making',
            description: 'Developing strategic thinking and effective decision-making capabilities.',
            orderIndex: 3,
            sections: [
              { 
                title: 'Strategic Vision and Planning', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Critical Decision-Making Frameworks', 
                type: 'text',
                duration: 25 
              },
              { 
                title: 'Leading Organizational Change', 
                type: 'video',
                duration: 35 
              },
              { 
                title: 'Leadership Capstone Challenge', 
                type: 'quiz',
                duration: 40 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-3`,
                title: 'Decision-Making Models',
                type: 'file',
                url: '#',
                description: 'Templates for strategic decision-making processes',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      };
    } 
    // Default generic course
    else {
      return {
        ...baseOutline,
        modules: [
          {
            id: 'module-1',
            title: 'Introduction and Overview',
            description: 'Get started with the basics and understand key concepts.',
            orderIndex: 1,
            sections: [
              { 
                title: 'Course Introduction', 
                type: 'text',
                duration: 15 
              },
              { 
                title: 'Key Concepts Overview', 
                type: 'text',
                duration: 20 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-1`,
                title: 'Course Handbook',
                type: 'pdf',
                url: '#',
                description: 'A comprehensive guide to this course',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-2',
            title: 'Core Principles',
            description: 'Explore the essential principles and practical applications.',
            orderIndex: 2,
            sections: [
              { 
                title: 'Principle One', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Principle Two', 
                type: 'text',
                duration: 30 
              },
              { 
                title: 'Video Demonstration', 
                type: 'video',
                duration: 30 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-2`,
                title: 'Supplementary Reading',
                type: 'link',
                url: '#',
                description: 'Additional resources to deepen your understanding',
                createdAt: new Date().toISOString()
              }
            ]
          },
          {
            id: 'module-3',
            title: 'Advanced Applications',
            description: 'Take your skills to the next level with advanced techniques and applications.',
            orderIndex: 3,
            sections: [
              { 
                title: 'Advanced Application 1', 
                type: 'text',
                duration: 40 
              },
              { 
                title: 'Case Study Analysis', 
                type: 'text',
                duration: 40 
              },
              { 
                title: 'Practice Assessment', 
                type: 'quiz',
                duration: 40 
              }
            ],
            resources: [
              {
                id: `${courseId}-resource-3`,
                title: 'Case Studies',
                type: 'file',
                url: '#',
                description: 'Real-world examples and solutions',
                createdAt: new Date().toISOString()
              }
            ]
          }
        ]
      };
    }
  }

  /**
   * Generate detailed content for a section when LLM generation fails
   */
  private generateMockSectionContent(moduleName: string, sectionName: string): string {
    // Create rich, detailed content based on the module and section names
    return `<div class="prose max-w-none">
      <h2>${sectionName}</h2>
      
      <p>Welcome to this section on ${sectionName.toLowerCase()} within the ${moduleName} module. 
      This content covers essential principles and practical applications that will enhance your skills and knowledge.</p>
      
      <h3>Key Points</h3>
      <ul>
        <li><strong>Understanding fundamentals:</strong> Master the core concepts related to ${sectionName.toLowerCase()}</li>
        <li><strong>Practical application:</strong> Learn how to apply these principles in real-world scenarios</li>
        <li><strong>Best practices:</strong> Discover industry standards and proven approaches</li>
      </ul>
      
      <h3>Why This Matters</h3>
      <p>Mastering ${sectionName.toLowerCase()} is crucial for professional success because it enables more effective interactions, 
      clearer expression of ideas, and better outcomes in workplace situations. Research shows that professionals with strong skills 
      in this area are 65% more likely to achieve their objectives.</p>
      
      <h3>Practical Example</h3>
      <p>Consider this scenario: A team leader needs to communicate a significant change to their department. 
      By applying the principles covered in this section, they can:</p>
      <ol>
        <li>Structure their message for maximum clarity</li>
        <li>Anticipate and address potential concerns</li>
        <li>Choose the most effective communication channels</li>
        <li>Gather meaningful feedback to ensure understanding</li>
      </ol>
      
      <h3>Key Techniques</h3>
      <p>Through this course section, you'll learn several proven techniques:</p>
      <ul>
        <li><strong>Technique 1:</strong> Structured approach to ${sectionName.toLowerCase()}</li>
        <li><strong>Technique 2:</strong> Adapting your style for different situations</li>
        <li><strong>Technique 3:</strong> Measuring effectiveness and making adjustments</li>
      </ul>
      
      <p>By the end of this section, you'll have both theoretical knowledge and practical skills 
      that you can apply immediately in your professional environment.</p>
      
      <blockquote>
        <p>"The most important thing in communication is hearing what isn't said." — Peter Drucker</p>
      </blockquote>
    </div>`;
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

  /**
   * Save AI-generated content to the database
   */
  private async saveGeneratedContent(
    courseId: string,
    userId: string,
    content: any,
    personalizationParams?: any
  ): Promise<string | null> {
    try {
      const supabase = getSupabase();
      
      // Insert the main content record
      const { data: contentRecord, error: contentError } = await supabase
        .from('ai_generated_course_content')
        .insert({
          course_id: courseId,
          title: content.title || `Generated content for ${courseId}`,
          content: JSON.stringify(content), // Store the full content as JSON
          created_by: userId,
          personalization_params: personalizationParams || {}
        })
        .select('id')
        .single();
      
      if (contentError) {
        console.error('Error saving AI-generated content:', contentError);
        return null;
      }
      
      const contentId = contentRecord.id;
      
      // Save individual sections if present
      if (content.sections && Array.isArray(content.sections)) {
        for (let i = 0; i < content.sections.length; i++) {
          const section = content.sections[i];
          const { error: sectionError } = await supabase
            .from('course_content_sections')
            .insert({
              content_id: contentId,
              title: section.title,
              module_id: `module-${Math.floor(i / 3) + 1}`, // Group sections into modules (3 sections per module)
              section_id: `section-${i + 1}`,
              content: section.content,
              order_index: i
            });
          
          if (sectionError) {
            console.error(`Error saving section ${i}:`, sectionError);
          }
        }
      }
      
      // Save quizzes if present
      if (content.quiz) {
        const { error: quizError } = await supabase
          .from('course_module_quizzes')
          .insert({
            content_id: contentId,
            module_id: 'module-assessment',
            quiz_data: content.quiz
          });
        
        if (quizError) {
          console.error('Error saving quiz:', quizError);
        }
      }
      
      console.log(`Successfully saved AI-generated content with ID: ${contentId}`);
      return contentId;
    } catch (error) {
      console.error('Error in saveGeneratedContent:', error);
      return null;
    }
  }

  /**
   * Get the most recent AI-generated content for a course
   */
  private async getLatestGeneratedContent(
    courseId: string,
    userId: string
  ): Promise<any | null> {
    try {
      const supabase = getSupabase();
      
      // Get the latest content record
      const { data: contentRecord, error: contentError } = await supabase
        .from('ai_generated_course_content')
        .select('id, title, content, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (contentError || !contentRecord) {
        console.log('No existing AI content found, generating new content');
        return null;
      }
      
      console.log(`Found existing AI content: ${contentRecord.id}`);
      return contentRecord.content;
    } catch (error) {
      console.error('Error in getLatestGeneratedContent:', error);
      return null;
    }
  }

  /**
   * Create or get learner profile
   */
  private async getOrCreateLearnerProfile(userId: string): Promise<any> {
    try {
      const supabase = getSupabase();
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!profileError && existingProfile) {
        return existingProfile;
      }
      
      // Get user details to create a profile
      const { data: userDetails, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user details:', userError);
        return null;
      }
      
      // Get employee details if available
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Create a new profile
      const newProfile = {
        user_id: userId,
        learning_style: 'visual', // Default
        preferred_content_type: 'text', // Default
        preferred_difficulty: userDetails?.role === 'beginner' ? 'beginner' : 'intermediate',
        skill_level: userDetails?.role === 'beginner' ? 'beginner' : 'intermediate',
        learning_preferences: {
          includeExamples: true,
          includeQuizzes: true,
          contentFormat: 'mixed'
        } as any // Use any type to allow additional properties
      };
      
      // If employee data exists, enhance the profile
      if (!employeeError && employee) {
        newProfile.learning_preferences = {
          ...newProfile.learning_preferences,
          role: employee.role,
          department: employee.department,
          jobTitle: employee.job_title
        } as any; // Use any type for flexibility
      }
      
      // Save the new profile
      const { data: insertedProfile, error: insertError } = await supabase
        .from('learner_profiles')
        .insert(newProfile)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating learner profile:', insertError);
        return newProfile; // Return unsaved profile as fallback
      }
      
      return insertedProfile;
    } catch (error) {
      console.error('Error in getOrCreateLearnerProfile:', error);
      return {
        learning_style: 'visual',
        preferred_content_type: 'text',
        preferred_difficulty: 'intermediate',
        skill_level: 'intermediate',
        learning_preferences: {
          includeExamples: true,
          includeQuizzes: true,
          contentFormat: 'mixed'
        }
      };
    }
  }
}

export default CourseContentService; 