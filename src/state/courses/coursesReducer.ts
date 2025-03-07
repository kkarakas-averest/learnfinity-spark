import { CoursesState, CoursesAction } from '../types';

// Initial courses state
export const initialCoursesState: CoursesState = {
  data: null,
  loading: false,
  error: null,
  selectedCourse: null,
  userProgress: null,
};

/**
 * Courses Reducer
 * Manages courses data, selected course, and user progress
 */
export function coursesReducer(state: CoursesState, action: CoursesAction): CoursesState {
  switch (action.type) {
    case 'COURSES_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'COURSES_SUCCESS':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
      };
    
    case 'COURSES_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    
    case 'COURSES_RESET':
      return initialCoursesState;
    
    case 'COURSES_SELECT_COURSE':
      return {
        ...state,
        selectedCourse: action.course,
      };
    
    case 'COURSES_UPDATE_PROGRESS':
      return {
        ...state,
        userProgress: {
          ...state.userProgress,
          ...action.progress,
        },
      };
    
    default:
      return state;
  }
} 