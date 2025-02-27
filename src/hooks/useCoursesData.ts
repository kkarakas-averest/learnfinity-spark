
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { Database } from '@/lib/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'] & { course: Course };

export const useCoursesData = (companyId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all courses for a company
  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['courses', companyId],
    queryFn: async () => {
      let query = supabase.from('courses').select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as Course[];
    },
    enabled: !!companyId,
  });

  // Fetch course details including modules
  const fetchCourseDetails = async (courseId: string) => {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      throw courseError;
    }
    
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('sequence_order', { ascending: true });
    
    if (modulesError) {
      throw modulesError;
    }
    
    return {
      course,
      modules,
    };
  };

  // Use query for a specific course and its modules
  const useCourseDetails = (courseId: string | undefined) => {
    return useQuery({
      queryKey: ['course', courseId],
      queryFn: () => fetchCourseDetails(courseId!),
      enabled: !!courseId,
    });
  };

  // Mutation to create a new course
  const createCourseMutation = useMutation({
    mutationFn: async (newCourse: Omit<Database['public']['Tables']['courses']['Insert'], 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(newCourse)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: 'Course Created',
        description: 'Your course has been successfully created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Create Course',
        description: error.message || 'An error occurred while creating the course.',
        variant: 'destructive',
      });
    },
  });

  return {
    courses,
    coursesLoading,
    coursesError,
    useCourseDetails,
    createCourse: createCourseMutation.mutate,
    isCreatingCourse: createCourseMutation.isPending,
  };
};
