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
      // 1. Get the course enrollment details
      const { data: enrollmentData, error: enrollmentError } = await supabase
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

      if (enrollmentError) {
        if (enrollmentError.code === 'PGRST116') {
          console.error('No enrollment found for this course');
          return null;
        }
        throw enrollmentError;
      }

      // Extract course data
      const courseData = enrollmentData.course as any;
      
      // 2. Get all modules for this course
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

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
      return null;
    }
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