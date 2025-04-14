import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Course } from '@/types/hr.types';
import { SupabaseResponse, SupabaseError } from '@/types/service-responses';
import { v4 as uuidv4 } from 'uuid';

// Error handling helper
const handleError = (error: SupabaseError | Error | any, customMessage: string = 'An error occurred'): SupabaseResponse<null> => {
  console.error(`${customMessage}:`, error);
  toast({
    title: 'Error',
    description: customMessage,
    variant: 'destructive',
  });
  return { 
    data: null,
    error: error.message 
      ? { message: error.message, details: customMessage }
      : { message: customMessage } 
  };
};

// Course data interface for create/update operations
export interface CourseData {
  title: string;
  description?: string;
  department_id?: string;
  duration?: number;
  status?: 'active' | 'draft' | 'archived';
}

// HR Course service with specialized functions for course operations
const hrCourseService = {
  /**
   * Get all courses with their department information
   * @returns {Promise<SupabaseResponse<Course[]>>}
   */
  async getAllCourses(): Promise<SupabaseResponse<Course[]>> {
    try {
      const { data, error } = await supabase
        .from('hr_courses')
        .select(`
          *,
          department:hr_departments(id, name)
        `)
        .order('title');
        
      if (error) {
        return { data: null, error };
      }
      
      // Format the course data to match our frontend Course type
      const courses: Course[] = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        department: course.department?.name || 'General',
        enrollments: 0, // We'll fetch this in a separate query
        completionRate: 0, // We'll calculate this
        duration: `${course.duration || 0} mins`,
        status: course.status || 'active',
        createdAt: new Date(course.created_at).toLocaleDateString(),
        updatedAt: new Date(course.updated_at).toLocaleDateString(),
      }));
      
      // Get enrollment data for each course
      for (const course of courses) {
        const { data: enrollments, error: enrollError } = await supabase
          .from('hr_course_enrollments')
          .select('*')
          .eq('course_id', course.id);
          
        if (!enrollError && enrollments) {
          course.enrollments = enrollments.length;
          const completed = enrollments.filter(e => e.status === 'completed').length;
          course.completionRate = course.enrollments > 0 
            ? Math.round((completed / course.enrollments) * 100) 
            : 0;
        }
      }
      
      return { data: courses, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching courses:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to fetch courses' }
      };
    }
  },
  
  /**
   * Get a specific course by ID with detailed information
   * @param {string} id - The course ID to retrieve
   * @returns {Promise<SupabaseResponse<Course>>}
   */
  async getCourseById(id: string): Promise<SupabaseResponse<Course>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Course ID is required' }
        };
      }

      const { data, error } = await supabase
        .from('hr_courses')
        .select(`
          *,
          department:hr_departments(id, name)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        return { data: null, error };
      }
      
      if (!data) {
        return {
          data: null,
          error: { message: 'Course not found' }
        };
      }
      
      // Get enrollments for this course
      const { data: enrollments, error: enrollError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          *,
          employee:hr_employees(id, name, email)
        `)
        .eq('course_id', id);
        
      if (enrollError) throw enrollError;
      
      // Calculate completion metrics
      const totalEnrollments = enrollments?.length || 0;
      const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;
      const averageScore = completed > 0 
        ? enrollments?.filter(e => e.score)
            .reduce((sum, e) => sum + parseFloat(e.score), 0) / completed 
        : 0;
      
      // Format the course data
      const course: Course = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        department: data.department?.name || 'General',
        enrollments: totalEnrollments || 0,
        completionRate: completionRate || 0,
        averageScore: averageScore ? Number(averageScore.toFixed(1)) : 0,
        duration: `${data.duration || 0} mins`,
        status: data.status || 'active',
        createdAt: new Date(data.created_at).toLocaleDateString(),
        updatedAt: new Date(data.updated_at).toLocaleDateString(),
      };
      
      return { data: course, error: null };
    } catch (error) {
      return handleError(error, `Failed to fetch course with ID ${id}`);
    }
  },
  
  /**
   * Create a new course
   * @param {CourseData} courseData - The course data to create
   * @returns {Promise<SupabaseResponse<Course>>}
   */
  async createCourse(courseData: CourseData): Promise<SupabaseResponse<Course>> {
    try {
      if (!courseData.title) {
        return {
          data: null,
          error: { message: 'Course title is required' }
        };
      }
      
      // Prepare the data for insertion
      const courseRecord = {
        id: uuidv4(),
        title: courseData.title,
        description: courseData.description || '',
        department_id: courseData.department_id,
        duration: courseData.duration || 0,
        status: courseData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('hr_courses')
        .insert(courseRecord)
        .select()
        .single();
        
      if (error) {
        return { data: null, error };
      }
      
      // Return the newly created course in the expected format
      const course: Course = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        department: 'General', // We'll need to fetch the actual department name
        enrollments: 0,
        completionRate: 0,
        duration: `${data.duration || 0} mins`,
        status: data.status || 'draft',
        createdAt: new Date(data.created_at).toLocaleDateString(),
        updatedAt: new Date(data.updated_at).toLocaleDateString(),
      };
      
      if (courseData.department_id) {
        // Fetch department name if department_id is provided
        const { data: deptData } = await supabase
          .from('hr_departments')
          .select('name')
          .eq('id', courseData.department_id)
          .single();
          
        if (deptData) {
          course.department = deptData.name;
        }
      }
      
      return { data: course, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error creating course:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to create course' }
      };
    }
  },
  
  /**
   * Update an existing course
   * @param {string} id - The course ID to update
   * @param {CourseData} courseData - The course data to update
   * @returns {Promise<SupabaseResponse<Course>>}
   */
  async updateCourse(id: string, courseData: CourseData): Promise<SupabaseResponse<Course>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Course ID is required' }
        };
      }
      
      // Prepare the data for update
      const updates = {
        ...courseData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('hr_courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        return { data: null, error };
      }
      
      // Return the updated course in the expected format
      const course: Course = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        department: 'General', // We'll need to fetch the actual department name
        enrollments: 0, // This will be populated elsewhere
        completionRate: 0, // This will be calculated elsewhere
        duration: `${data.duration || 0} mins`,
        status: data.status || 'active',
        createdAt: new Date(data.created_at).toLocaleDateString(),
        updatedAt: new Date(data.updated_at).toLocaleDateString(),
      };
      
      if (data.department_id) {
        // Fetch department name
        const { data: deptData } = await supabase
          .from('hr_departments')
          .select('name')
          .eq('id', data.department_id)
          .single();
          
        if (deptData) {
          course.department = deptData.name;
        }
      }
      
      return { data: course, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error updating course:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to update course' }
      };
    }
  },
  
  /**
   * Delete a course by ID
   * @param {string} id - The course ID to delete
   * @returns {Promise<SupabaseResponse<null>>}
   */
  async deleteCourse(id: string): Promise<SupabaseResponse<null>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Course ID is required' }
        };
      }
      
      // First check if the course exists
      const { data: existingCourse, error: fetchError } = await supabase
        .from('hr_courses')
        .select('id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        return { data: null, error: fetchError };
      }
      
      if (!existingCourse) {
        return {
          data: null,
          error: { message: 'Course not found' }
        };
      }
      
      // Delete the course
      const { error } = await supabase
        .from('hr_courses')
        .delete()
        .eq('id', id);
        
      if (error) {
        return { data: null, error };
      }
      
      return { data: null, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting course:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to delete course' }
      };
    }
  },
  
  /**
   * Enroll employees in a course
   * @param {string} courseId - The course ID
   * @param {string[]} employeeIds - Array of employee IDs to enroll
   * @returns {Promise<SupabaseResponse<{ success: boolean, enrolled: number }>>}
   */
  async enrollEmployees(courseId: string, employeeIds: string[]): Promise<SupabaseResponse<{ success: boolean, enrolled: number }>> {
    try {
      if (!courseId) {
        return {
          data: null,
          error: { message: 'Course ID is required' }
        };
      }
      
      if (!employeeIds || !employeeIds.length) {
        return {
          data: null,
          error: { message: 'At least one employee ID is required' }
        };
      }
      
      // Create enrollment records
      const enrollments = employeeIds.map(employeeId => ({
        id: uuidv4(),
        course_id: courseId,
        employee_id: employeeId,
        status: 'enrolled',
        progress: 0,
        score: null,
        enrolled_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }));
      
      // Try to use supabaseAdmin first if available
      const { supabaseAdmin, supabase } = await import('@/lib/supabase-client');
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('hr_course_enrollments')
        .insert(enrollments);
        
      if (error) {
        return { data: null, error };
      }
      
      return { 
        data: {
          success: true,
          enrolled: employeeIds.length
        }, 
        error: null
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error enrolling employees:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to enroll employees' }
      };
    }
  },
  
  /**
   * Update a course enrollment (progress, status, score)
   * @param {string} enrollmentId - The enrollment ID to update
   * @param {string} status - New enrollment status
   * @param {number} progress - New progress percentage (0-100)
   * @param {number} [score] - Optional score to update
   * @returns {Promise<SupabaseResponse<{ success: boolean }>>}
   */
  async updateEnrollment(
    enrollmentId: string, 
    status: string, 
    progress: number, 
    score?: number
  ): Promise<SupabaseResponse<{ success: boolean }>> {
    try {
      if (!enrollmentId) {
        return {
          data: null,
          error: { message: 'Enrollment ID is required' }
        };
      }
      
      // Validate progress is a number between 0-100
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return {
          data: null,
          error: { message: 'Progress must be a number between 0 and 100' }
        };
      }
      
      const updates = {
        status,
        progress,
        ...(score !== undefined ? { score } : {}),
        last_activity_at: new Date().toISOString(),
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      };
      
      const { error } = await supabase
        .from('hr_course_enrollments')
        .update(updates)
        .eq('id', enrollmentId);
        
      if (error) {
        return { data: null, error };
      }
      
      return { 
        data: { success: true }, 
        error: null
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error updating enrollment:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to update enrollment' }
      };
    }
  },
  
  /**
   * Get course metrics for dashboards and reports
   * @returns {Promise<SupabaseResponse<{
   *   totalCourses: number,
   *   activeCourses: number,
   *   totalEnrollments: number,
   *   averageCompletionRate: number,
   *   departmentBreakdown: {id: string, name: string, courseCount: number}[]
   * }>>}
   */
  async getCourseMetrics(): Promise<SupabaseResponse<{
    totalCourses: number,
    activeCourses: number,
    totalEnrollments: number,
    averageCompletionRate: number,
    departmentBreakdown: {id: string, name: string, courseCount: number}[]
  }>> {
    try {
      // Get total courses and active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('hr_courses')
        .select('id, status, department_id')
        .order('created_at', { ascending: false });
        
      if (coursesError) {
        return { data: null, error: coursesError };
      }
      
      const totalCourses = coursesData.length;
      const activeCourses = coursesData.filter(c => c.status === 'active').length;
      
      // Get enrollment data
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('hr_course_enrollments')
        .select('id, status, progress');
        
      if (enrollmentsError) {
        return { data: null, error: enrollmentsError };
      }
      
      const totalEnrollments = enrollmentsData.length;
      const completedEnrollments = enrollmentsData.filter(e => e.status === 'completed').length;
      
      // Calculate average completion rate
      const averageCompletionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;
      
      // Get department breakdown
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('hr_departments')
        .select('id, name');
        
      if (departmentsError) {
        return { data: null, error: departmentsError };
      }
      
      // Count courses by department
      const departmentBreakdown = departmentsData.map(dept => {
        const courseCount = coursesData.filter(course => course.department_id === dept.id).length;
        return {
          id: dept.id,
          name: dept.name,
          courseCount
        };
      });
      
      // Return the metrics
      return {
        data: {
          totalCourses,
          activeCourses,
          totalEnrollments,
          averageCompletionRate,
          departmentBreakdown
        },
        error: null
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching course metrics:', error);
      return {
        data: null,
        error: { message: error.message || 'Failed to fetch course metrics' }
      };
    }
  }
};

export default hrCourseService; 