import { CoursesAction, Course } from '../types';

/**
 * Set loading state
 */
export const setLoading = (): CoursesAction => ({
  type: 'COURSES_LOADING',
});

/**
 * Set courses success
 */
export const setCoursesSuccess = (courses: Course[]): CoursesAction => ({
  type: 'COURSES_SUCCESS',
  payload: courses,
});

/**
 * Set courses error
 */
export const setCoursesError = (error: Error): CoursesAction => ({
  type: 'COURSES_ERROR',
  error,
});

/**
 * Reset courses state
 */
export const resetCourses = (): CoursesAction => ({
  type: 'COURSES_RESET',
});

/**
 * Select a course
 */
export const selectCourse = (course: Course | null): CoursesAction => ({
  type: 'COURSES_SELECT_COURSE',
  course,
});

/**
 * Update course progress
 */
export const updateCourseProgress = (progress: Record<string, any>): CoursesAction => ({
  type: 'COURSES_UPDATE_PROGRESS',
  progress,
}); 