/**
 * Common types for the state management system
 */

import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/lib/database.types';

/**
 * Common state shape for all domains with loading, error, and data
 */
export interface BaseState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Auth state
 */
export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState extends BaseState<User> {
  session: Session | null;
  userDetails: UserDetails | null;
  isAuthenticated: boolean;
}

export type AuthAction = 
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'AUTH_RESET' }
  | { type: 'AUTH_SET_SESSION'; session: Session | null }
  | { type: 'AUTH_SET_USER'; user: User | null }
  | { type: 'AUTH_SET_USER_DETAILS'; userDetails: UserDetails | null }
  | { type: 'AUTH_SIGN_OUT' };

/**
 * HR auth state
 */
export interface HRUser {
  username: string;
  role: 'hr';
}

export interface HRAuthState extends BaseState<HRUser> {
  isAuthenticated: boolean;
}

export type HRAuthAction =
  | { type: 'HR_AUTH_LOADING' }
  | { type: 'HR_AUTH_SUCCESS'; payload: HRUser }
  | { type: 'HR_AUTH_ERROR'; error: Error }
  | { type: 'HR_AUTH_RESET' }
  | { type: 'HR_AUTH_SIGN_OUT' };

/**
 * User state for profile, preferences, etc.
 */
export interface UserState extends BaseState<UserDetails> {
  preferences: Record<string, any> | null;
  progress: Record<string, any> | null;
}

export type UserAction =
  | { type: 'USER_LOADING' }
  | { type: 'USER_SUCCESS'; payload: UserDetails }
  | { type: 'USER_ERROR'; error: Error }
  | { type: 'USER_RESET' }
  | { type: 'USER_UPDATE_PREFERENCES'; preferences: Record<string, any> }
  | { type: 'USER_UPDATE_PROGRESS'; progress: Record<string, any> };

/**
 * Course types
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  image?: string;
  modules: Module[];
  [key: string]: any;
}

export interface Module {
  id: string;
  title: string;
  content: any;
  [key: string]: any;
}

export interface CoursesState extends BaseState<Course[]> {
  selectedCourse: Course | null;
  userProgress: Record<string, any> | null;
}

export type CoursesAction =
  | { type: 'COURSES_LOADING' }
  | { type: 'COURSES_SUCCESS'; payload: Course[] }
  | { type: 'COURSES_ERROR'; error: Error }
  | { type: 'COURSES_RESET' }
  | { type: 'COURSES_SELECT_COURSE'; course: Course | null }
  | { type: 'COURSES_UPDATE_PROGRESS'; progress: Record<string, any> };

/**
 * UI state for global UI elements
 */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

export interface UIState {
  toasts: Toast[];
  modals: Record<string, Modal>;
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;
}

export type UIAction =
  | { type: 'UI_ADD_TOAST'; toast: Toast }
  | { type: 'UI_REMOVE_TOAST'; id: string }
  | { type: 'UI_OPEN_MODAL'; id: string; data?: any }
  | { type: 'UI_CLOSE_MODAL'; id: string }
  | { type: 'UI_SET_THEME'; theme: 'light' | 'dark' | 'system' }
  | { type: 'UI_SET_MOBILE'; isMobile: boolean };

/**
 * Combined app state
 */
export interface AppState {
  auth: AuthState;
  hrAuth: HRAuthState;
  user: UserState;
  courses: CoursesState;
  ui: UIState;
}

/**
 * Combined dispatch type using React's Dispatch function type
 */
export interface AppDispatch {
  auth: React.Dispatch<AuthAction>;
  hrAuth: React.Dispatch<HRAuthAction>;
  user: React.Dispatch<UserAction>;
  courses: React.Dispatch<CoursesAction>;
  ui: React.Dispatch<UIAction>;
}

/**
 * State context type
 */
export interface StateContextType {
  state: AppState;
  dispatch: AppDispatch;
} 