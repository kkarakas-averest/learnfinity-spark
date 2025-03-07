import React, { useCallback } from '@/lib/react-helpers';
import { useCoursesState, useCoursesDispatch } from '../StateContext';
import { supabase } from '@/lib/supabase';
import {
  setLoading,
  setCoursesSuccess,
  setCoursesError,
  selectCourse,
  updateCourseProgress,
} from './coursesActions';
import { Course, Module } from '../types';

/**
 * Custom hook for courses state
 * Provides methods for accessing and managing courses data
 */
export function useCourses() {
  const state = useCoursesState();
  const dispatch = useCoursesDispatch();

  /**
   * Fetch all courses
   */
  const fetchCourses = useCallback(async (options?: { 
    filter?: string;
    category?: string;
    limit?: number;
  }) => {
    try {
      dispatch(setLoading());

      let query = supabase.from('courses').select('*');
      
      // Apply filters if provided
      if (options?.filter) {
        query = query.ilike('title', `%${options.filter}%`);
      }
      
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const courses: Course[] = data.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          image: course.image,
          modules: course.modules || [],
          // Include other fields as needed
        }));

        dispatch(setCoursesSuccess(courses));
        return courses;
      }

      return [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      dispatch(setCoursesError(error instanceof Error ? error : new Error('Failed to fetch courses')));
      throw error;
    }
  }, [dispatch]);

  /**
   * Fetch a single course by ID
   */
  const fetchCourse = useCallback(async (courseId: string) => {
    try {
      dispatch(setLoading());

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (data) {
        const course: Course = {
          id: data.id,
          title: data.title,
          description: data.description,
          image: data.image,
          modules: data.modules || [],
          // Include other fields as needed
        };

        dispatch(selectCourse(course));
        return course;
      }

      return null;
    } catch (error) {
      console.error('Error fetching course:', error);
      dispatch(setCoursesError(error instanceof Error ? error : new Error('Failed to fetch course')));
      throw error;
    }
  }, [dispatch]);

  /**
   * Fetch course modules
   */
  const fetchCourseModules = useCallback(async (courseId: string) => {
    try {
      dispatch(setLoading());

      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (error) throw error;

      if (data) {
        const modules: Module[] = data.map(module => ({
          id: module.id,
          title: module.title,
          content: module.content,
          // Include other fields as needed
        }));

        // If a course is already selected, update its modules
        if (state.selectedCourse && state.selectedCourse.id === courseId) {
          const updatedCourse = {
            ...state.selectedCourse,
            modules,
          };
          dispatch(selectCourse(updatedCourse));
        }

        return modules;
      }

      return [];
    } catch (error) {
      console.error('Error fetching course modules:', error);
      dispatch(setCoursesError(error instanceof Error ? error : new Error('Failed to fetch course modules')));
      throw error;
    }
  }, [dispatch, state.selectedCourse]);

  /**
   * Update course progress
   */
  const saveCourseProgress = useCallback(async (
    userId: string,
    courseId: string,
    progress: Record<string, any>
  ) => {
    try {
      // First, update the progress in the database
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          progress,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Then, update the state
      dispatch(updateCourseProgress({ [courseId]: progress }));
      return data;
    } catch (error) {
      console.error('Error saving course progress:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    // State
    courses: state.data,
    selectedCourse: state.selectedCourse,
    userProgress: state.userProgress,
    isLoading: state.loading,
    error: state.error,

    // Methods
    fetchCourses,
    fetchCourse,
    fetchCourseModules,
    selectCourse: (course: Course | null) => dispatch(selectCourse(course)),
    saveCourseProgress,
  };
} 