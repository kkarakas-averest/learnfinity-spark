import { AuthState, AuthAction } from '../types';
import { User, Session } from '@supabase/supabase-js';

// Initial authentication state
export const initialAuthState: AuthState = {
  data: null,
  loading: true,
  error: null,
  session: null,
  userDetails: null,
  isAuthenticated: false,
};

/**
 * Authentication Reducer
 * Manages user authentication state including the current user, session, and loading state
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
        isAuthenticated: !!action.payload,
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    
    case 'AUTH_RESET':
      return initialAuthState;
    
    case 'AUTH_SET_SESSION':
      return {
        ...state,
        session: action.session,
        isAuthenticated: !!action.session,
      };
    
    case 'AUTH_SET_USER':
      return {
        ...state,
        data: action.user,
        isAuthenticated: !!action.user,
      };
    
    case 'AUTH_SET_USER_DETAILS':
      return {
        ...state,
        userDetails: action.userDetails,
      };
    
    case 'AUTH_SIGN_OUT':
      return {
        ...initialAuthState,
        loading: false,
      };
    
    default:
      return state;
  }
} 