import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Course } from '@/types/hr.types';

// Error handling helper
const handleError = (error: any, customMessage: string = 'An error occurred') => {
  console.error(`${customMessage}:`, error);
  toast({
    title: 'Error',
    description: customMessage,
    variant: 'destructive',
  });
  return null;
};

// HR Course service with specialized functions for course operations
const hrCourseService = {
  /**
   * Get all courses with their department information
   */
  async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('hr_courses')
        .select(`
          *,
          department:hr_departments(id, name)
        `)
        .order('title');
        
      if (error) throw error;
      
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
      
      return courses;
    } catch (error) {
      return handleError(error, 'Failed to fetch courses');
    }
  },
  
  /**
   * Get a course by ID with all related information
   */
  async getCourseById(id: string) {
    try {
      const { data, error } = await supabase
        .from('hr_courses')
        .select(`
          *,
          department:hr_departments(id, name)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
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
      
      return {
        ...data,
        enrollments: enrollments || [],
        totalEnrollments,
        completed,
        completionRate,
        averageScore: averageScore ? averageScore.toFixed(1) : 'N/A',
        duration: `${data.duration || 0} mins`,
      };
    } catch (error) {
      return handleError(error, `Failed to fetch course with ID ${id}`);
    }
  },
  
  /**
   * Create a new course
   */
  async createCourse(courseData: Partial<Course>) {
    try {
      // Validate required fields
      if (!courseData.title) {
        throw new Error('Course title is required');
      }
      
      // Format data for insertion
      const newCourse = {
        title: courseData.title,
        description: courseData.description || '',
        department_id: courseData.department,
        skill_level: courseData.status || 'beginner',
        duration: parseInt(courseData.duration) || 60,
        status: courseData.status || 'draft',
      };
      
      const { data, error } = await supabase
        .from('hr_courses')
        .insert(newCourse)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Course "${data.title}" created successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to create course');
    }
  },
  
  /**
   * Update an existing course
   */
  async updateCourse(id: string, courseData: Partial<Course>) {
    try {
      // Format data for update
      const updateData = {
        title: courseData.title,
        description: courseData.description,
        department_id: courseData.department,
        skill_level: courseData.status,
        duration: courseData.duration ? parseInt(courseData.duration) : undefined,
        status: courseData.status,
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      const { data, error } = await supabase
        .from('hr_courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Course "${data.title}" updated successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to update course');
    }
  },
  
  /**
   * Delete a course
   */
  async deleteCourse(id: string) {
    try {
      // Get course title first for the success message
      const { data: course } = await supabase
        .from('hr_courses')
        .select('title')
        .eq('id', id)
        .single();
      
      // Delete the course
      const { error } = await supabase
        .from('hr_courses')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Course "${course?.title || ''}" deleted successfully`,
      });
      
      return true;
    } catch (error) {
      return handleError(error, 'Failed to delete course');
    }
  },
  
  /**
   * Enroll employees in a course
   */
  async enrollEmployees(courseId: string, employeeIds: string[]) {
    try {
      // Prepare the enrollment data
      const enrollments = employeeIds.map(employeeId => ({
        course_id: courseId,
        employee_id: employeeId,
        status: 'enrolled',
        progress: 0,
      }));
      
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .insert(enrollments)
        .select();
        
      if (error) throw error;
      
      // Log the enrollment activity for each employee
      for (const enrollment of data) {
        await supabase.from('hr_employee_activities').insert({
          employee_id: enrollment.employee_id,
          activity_type: 'enrollment',
          description: 'Enrolled in course',
          course_id: courseId,
        });
      }
      
      toast({
        title: 'Success',
        description: `${data.length} employees enrolled successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to enroll employees');
    }
  },
  
  /**
   * Update an enrollment status
   */
  async updateEnrollment(enrollmentId: string, status: string, progress: number, score?: number) {
    try {
      const updateData: any = {
        status,
        progress,
      };
      
      // Add completion date if completed
      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString();
        updateData.score = score || null;
      }
      
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .update(updateData)
        .eq('id', enrollmentId)
        .select(`*, employee:hr_employees(id, name), course:hr_courses(id, title)`)
        .single();
        
      if (error) throw error;
      
      // Log activity if completed
      if (status === 'completed') {
        await supabase.from('hr_employee_activities').insert({
          employee_id: data.employee.id,
          activity_type: 'completion',
          description: `Completed course: ${data.course.title}`,
          course_id: data.course.id,
        });
      }
      
      toast({
        title: 'Success',
        description: `Enrollment updated successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to update enrollment');
    }
  },
  
  /**
   * Get course metrics
   */
  async getCourseMetrics() {
    try {
      // Get total courses
      const { data: courseCount, error: countError } = await supabase
        .from('hr_courses')
        .select('id', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Get courses by status
      const { data: statusData, error: statusError } = await supabase
        .from('hr_courses')
        .select('status')
        .not('status', 'is', null);
        
      if (statusError) throw statusError;
      
      // Get total enrollments
      const { data: enrollmentCount, error: enrollError } = await supabase
        .from('hr_course_enrollments')
        .select('id', { count: 'exact', head: true });
        
      if (enrollError) throw enrollError;
      
      // Get completed enrollments
      const { data: completedCount, error: completeError } = await supabase
        .from('hr_course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');
        
      if (completeError) throw completeError;
      
      // Calculate metrics
      const totalCourses = courseCount?.count || 0;
      const statusCounts = statusData?.reduce((acc, course) => {
        acc[course.status] = (acc[course.status] || 0) + 1;
        return acc;
      }, {});
      
      const totalEnrollments = enrollmentCount?.count || 0;
      const completedEnrollments = completedCount?.count || 0;
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;
      
      return {
        totalCourses,
        activeCourses: statusCounts?.active || 0,
        draftCourses: statusCounts?.draft || 0,
        archivedCourses: statusCounts?.archived || 0,
        totalEnrollments,
        completedEnrollments,
        completionRate,
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch course metrics');
    }
  }
};

export default hrCourseService; 