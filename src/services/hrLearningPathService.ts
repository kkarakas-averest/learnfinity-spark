import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { LearningPath } from '@/types/hr.types';

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

// HR Learning Path service with specialized functions for learning path operations
const hrLearningPathService = {
  /**
   * Get all learning paths
   */
  async getAllLearningPaths() {
    try {
      const { data, error } = await supabase
        .from('hr_learning_paths')
        .select('*')
        .order('title');
        
      if (error) throw error;
      
      // Format the learning path data to match our frontend LearningPath type
      const learningPaths: LearningPath[] = await Promise.all(data.map(async path => {
        // Get courses for this learning path
        const { data: pathCourses, error: coursesError } = await supabase
          .from('hr_learning_path_courses')
          .select(`
            course_id,
            course:hr_courses(id, title)
          `)
          .eq('learning_path_id', path.id)
          .order('sequence_order');
          
        if (coursesError) throw coursesError;
        
        // Get enrollment count
        const { count: enrolledCount, error: countError } = await supabase
          .from('hr_learning_path_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('learning_path_id', path.id);
          
        if (countError) throw countError;
        
        // Calculate total duration from courses
        let totalDuration = 0;
        if (pathCourses?.length > 0) {
          const courseIds = pathCourses.map(pc => pc.course_id);
          const { data: coursesData, error: durationError } = await supabase
            .from('hr_courses')
            .select('duration')
            .in('id', courseIds);
            
          if (durationError) throw durationError;
          
          totalDuration = coursesData?.reduce((sum, course) => sum + (course.duration || 0), 0) || 0;
        }
        
        return {
          id: path.id,
          title: path.title,
          description: path.description || '',
          courses: pathCourses?.map(pc => pc.course?.title || '') || [],
          enrolledCount: enrolledCount || 0,
          skillLevel: path.skill_level || 'beginner',
          duration: `${totalDuration} mins`,
        };
      }));
      
      return learningPaths;
    } catch (error) {
      return handleError(error, 'Failed to fetch learning paths');
    }
  },
  
  /**
   * Get a learning path by ID with all related information
   */
  async getLearningPathById(id: string) {
    try {
      const { data, error } = await supabase
        .from('hr_learning_paths')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      // Get courses for this learning path with their full details
      const { data: pathCourses, error: coursesError } = await supabase
        .from('hr_learning_path_courses')
        .select(`
          sequence_order,
          course:hr_courses(*)
        `)
        .eq('learning_path_id', id)
        .order('sequence_order');
        
      if (coursesError) throw coursesError;
      
      // Get enrollments for this learning path
      const { data: enrollments, error: enrollError } = await supabase
        .from('hr_learning_path_enrollments')
        .select(`
          *,
          employee:hr_employees(id, name, email)
        `)
        .eq('learning_path_id', id);
        
      if (enrollError) throw enrollError;
      
      // Calculate completion metrics
      const totalEnrollments = enrollments?.length || 0;
      const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
      const inProgress = enrollments?.filter(e => e.status === 'in_progress').length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;
      
      // Format courses
      const courses = pathCourses?.map(pc => ({
        id: pc.course.id,
        title: pc.course.title,
        description: pc.course.description,
        duration: pc.course.duration || 0,
        sequenceOrder: pc.sequence_order,
      })) || [];
      
      // Calculate total duration
      const totalDuration = courses.reduce((sum, course) => sum + course.duration, 0);
      
      return {
        ...data,
        courses,
        enrollments: enrollments || [],
        totalEnrollments,
        completed,
        inProgress,
        completionRate,
        totalDuration: `${totalDuration} mins`,
      };
    } catch (error) {
      return handleError(error, `Failed to fetch learning path with ID ${id}`);
    }
  },
  
  /**
   * Create a new learning path
   */
  async createLearningPath(pathData: Partial<LearningPath>, courseIds: string[]) {
    try {
      // Validate required fields
      if (!pathData.title) {
        throw new Error('Learning path title is required');
      }
      
      // Create the learning path
      const { data, error } = await supabase
        .from('hr_learning_paths')
        .insert({
          title: pathData.title,
          description: pathData.description || '',
          skill_level: pathData.skillLevel || 'beginner',
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Add courses to the learning path
      if (courseIds.length > 0) {
        const courseMappings = courseIds.map((courseId, index) => ({
          learning_path_id: data.id,
          course_id: courseId,
          sequence_order: index + 1,
        }));
        
        const { error: mappingError } = await supabase
          .from('hr_learning_path_courses')
          .insert(courseMappings);
          
        if (mappingError) throw mappingError;
      }
      
      toast({
        title: 'Success',
        description: `Learning path "${data.title}" created successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to create learning path');
    }
  },
  
  /**
   * Update an existing learning path
   */
  async updateLearningPath(id: string, pathData: Partial<LearningPath>, courseIds?: string[]) {
    try {
      // Update the learning path
      const updateData: any = {
        title: pathData.title,
        description: pathData.description,
        skill_level: pathData.skillLevel,
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      const { data, error } = await supabase
        .from('hr_learning_paths')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update courses if provided
      if (courseIds) {
        // First delete existing mappings
        const { error: deleteError } = await supabase
          .from('hr_learning_path_courses')
          .delete()
          .eq('learning_path_id', id);
          
        if (deleteError) throw deleteError;
        
        // Then add new mappings
        if (courseIds.length > 0) {
          const courseMappings = courseIds.map((courseId, index) => ({
            learning_path_id: id,
            course_id: courseId,
            sequence_order: index + 1,
          }));
          
          const { error: mappingError } = await supabase
            .from('hr_learning_path_courses')
            .insert(courseMappings);
            
          if (mappingError) throw mappingError;
        }
      }
      
      toast({
        title: 'Success',
        description: `Learning path "${data.title}" updated successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to update learning path');
    }
  },
  
  /**
   * Delete a learning path
   */
  async deleteLearningPath(id: string) {
    try {
      // Get learning path title first for the success message
      const { data: path } = await supabase
        .from('hr_learning_paths')
        .select('title')
        .eq('id', id)
        .single();
      
      // Delete the learning path
      const { error } = await supabase
        .from('hr_learning_paths')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Learning path "${path?.title || ''}" deleted successfully`,
      });
      
      return true;
    } catch (error) {
      return handleError(error, 'Failed to delete learning path');
    }
  },
  
  /**
   * Enroll employees in a learning path
   */
  async enrollEmployees(pathId: string, employeeIds: string[]) {
    try {
      // Prepare the enrollment data
      const enrollments = employeeIds.map(employeeId => ({
        learning_path_id: pathId,
        employee_id: employeeId,
        status: 'in_progress',
        progress: 0,
      }));
      
      const { data, error } = await supabase
        .from('hr_learning_path_enrollments')
        .insert(enrollments)
        .select();
        
      if (error) throw error;
      
      // Log the enrollment activity for each employee
      for (const enrollment of data) {
        await supabase.from('hr_employee_activities').insert({
          employee_id: enrollment.employee_id,
          activity_type: 'enrollment',
          description: 'Enrolled in learning path',
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
  async updateEnrollmentStatus(enrollmentId: string, status: string, progress: number) {
    try {
      const updateData: any = {
        status,
        progress,
      };
      
      // Add completion date if completed
      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('hr_learning_path_enrollments')
        .update(updateData)
        .eq('id', enrollmentId)
        .select(`*, employee:hr_employees(id, name), learning_path:hr_learning_paths(id, title)`)
        .single();
        
      if (error) throw error;
      
      // Log activity if completed
      if (status === 'completed') {
        await supabase.from('hr_employee_activities').insert({
          employee_id: data.employee.id,
          activity_type: 'completion',
          description: `Completed learning path: ${data.learning_path.title}`,
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
   * Get learning path metrics
   */
  async getLearningPathMetrics() {
    try {
      // Get total learning paths
      const { data: pathCount, error: countError } = await supabase
        .from('hr_learning_paths')
        .select('id', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Get total enrollments
      const { data: enrollmentCount, error: enrollError } = await supabase
        .from('hr_learning_path_enrollments')
        .select('id', { count: 'exact', head: true });
        
      if (enrollError) throw enrollError;
      
      // Get completed enrollments
      const { data: completedCount, error: completeError } = await supabase
        .from('hr_learning_path_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');
        
      if (completeError) throw completeError;
      
      // Calculate metrics
      const totalPaths = pathCount?.count || 0;
      const totalEnrollments = enrollmentCount?.count || 0;
      const completedEnrollments = completedCount?.count || 0;
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;
      
      return {
        totalPaths,
        totalEnrollments,
        completedEnrollments,
        completionRate,
        averageEnrollmentsPerPath: totalPaths > 0 
          ? Math.round(totalEnrollments / totalPaths) 
          : 0,
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch learning path metrics');
    }
  }
};

export default hrLearningPathService; 