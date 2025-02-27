
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/lib/database.types';

type LearningPath = Database['public']['Tables']['learning_paths']['Row'];
type CourseWithModules = {
  course: Database['public']['Tables']['courses']['Row'];
  modules: Database['public']['Tables']['modules']['Row'][];
  progress: Database['public']['Tables']['progress_tracking']['Row'][];
};

export const useLearningData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userDetails } = useAuth();

  // Fetch learning paths for the current user
  const { data: learningPaths, isLoading: pathsLoading, error: pathsError } = useQuery({
    queryKey: ['learningPaths', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('learning_paths')
        .select('*, courses(*)')
        .eq('learner_id', user.id);
      
      if (error) {
        throw error;
      }
      
      return data as (LearningPath & { courses: Database['public']['Tables']['courses']['Row'] })[];
    },
    enabled: !!user,
  });

  // Fetch course progress for the current user
  const { data: learnerCourses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['learnerCourses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's company
      const { data: learner, error: learnerError } = await supabase
        .from('learners')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (learnerError) {
        throw learnerError;
      }

      // Get courses for user's company
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', learner.company_id);
      
      if (coursesError) {
        throw coursesError;
      }

      // For each course, get modules and progress
      const coursesWithModules: CourseWithModules[] = await Promise.all(
        courses.map(async (course) => {
          // Get modules
          const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', course.id)
            .order('sequence_order', { ascending: true });
          
          if (modulesError) {
            throw modulesError;
          }

          // Get progress for this learner and course modules
          const { data: progress, error: progressError } = await supabase
            .from('progress_tracking')
            .select('*')
            .eq('learner_id', user.id)
            .in('module_id', modules.map(m => m.id));
          
          if (progressError) {
            throw progressError;
          }

          return {
            course,
            modules,
            progress: progress || [],
          };
        })
      );

      return coursesWithModules;
    },
    enabled: !!user,
  });

  // Calculate overall progress for a course
  const calculateCourseProgress = (courseWithModules: CourseWithModules) => {
    if (!courseWithModules.modules.length) return 0;
    
    const completedModules = courseWithModules.progress.filter(
      p => p.rag_status === 'green'
    ).length;
    
    return Math.round((completedModules / courseWithModules.modules.length) * 100);
  };

  // Get course data in the format expected by CourseCard
  const getActiveCourses = () => {
    if (!learnerCourses) return [];
    
    return learnerCourses.map(courseWithModules => {
      const progress = calculateCourseProgress(courseWithModules);
      
      return {
        id: courseWithModules.course.id,
        title: courseWithModules.course.title,
        description: courseWithModules.course.description || '',
        category: courseWithModules.course.ai_generated ? 'AI-Generated' : 'Standard',
        duration: `${courseWithModules.modules.length} modules`,
        level: 'Beginner' as const, // This would come from the course data in a real app
        enrolled: 0, // This would come from a count query in a real app
        image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop',
        progress,
      };
    });
  };

  // Get learning paths data in the format expected by LearningPathCard
  const getLearningPaths = () => {
    if (!learningPaths) return [];
    
    return learningPaths.map(path => {
      return {
        id: path.id,
        title: path.courses.title,
        description: path.courses.description || '',
        courseCount: 1, // This would be calculated in a real app
        estimatedTime: '8 hours', // This would be calculated in a real app
        progress: 0, // This would be calculated based on module progress
        recommended: true,
        tags: ['AI-Recommended'], // These would come from the course data
      };
    });
  };

  // Update module progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ 
      moduleId, 
      status 
    }: { 
      moduleId: string; 
      status: Database['public']['Tables']['progress_tracking']['Row']['rag_status'] 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('progress_tracking')
        .upsert({
          learner_id: user.id,
          module_id: moduleId,
          rag_status: status,
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learnerCourses'] });
      toast({
        title: 'Progress Updated',
        description: 'Your learning progress has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Update Progress',
        description: error.message || 'An error occurred while updating your progress.',
        variant: 'destructive',
      });
    },
  });

  return {
    learningPaths,
    pathsLoading,
    pathsError,
    learnerCourses,
    coursesLoading,
    coursesError,
    getActiveCourses,
    getLearningPaths,
    updateProgress: updateProgressMutation.mutate,
    isUpdatingProgress: updateProgressMutation.isPending,
    calculateCourseProgress,
  };
};
