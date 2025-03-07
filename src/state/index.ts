/**
 * State Management System
 * 
 * This file exports the main state provider and hooks for accessing
 * global application state.
 */

// Export types
export * from './types';

// Export main context and provider
export { 
  StateProvider,
  StateContext,
  useAppState,
  useAuthState,
  useAuthDispatch,
  useHRAuthState,
  useHRAuthDispatch,
  useUserState,
  useUserDispatch,
  useCoursesState,
  useCoursesDispatch,
  useUIState,
  useUIDispatch,
} from './StateContext';

// Export domain-specific hooks
export { useAuth } from './auth/useAuth';
export { useHRAuth } from './hrAuth/useHRAuth';
export { useUser } from './user/useUser';
export { useCourses } from './courses/useCourses';
export { useUI } from './ui/useUI';

// Export actions
export * as authActions from './auth/authActions';
export * as hrAuthActions from './hrAuth/hrAuthActions';
export * as userActions from './user/userActions';
export * as coursesActions from './courses/coursesActions';
export * as uiActions from './ui/uiActions'; 