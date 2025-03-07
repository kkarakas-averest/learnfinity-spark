import { HRAuthState, HRAuthAction } from '../types';

// Initial HR auth state
export const initialHRAuthState: HRAuthState = {
  data: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

/**
 * HR Authentication Reducer
 * Manages HR user authentication state
 */
export function hrAuthReducer(state: HRAuthState, action: HRAuthAction): HRAuthState {
  switch (action.type) {
    case 'HR_AUTH_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'HR_AUTH_SUCCESS':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    
    case 'HR_AUTH_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    
    case 'HR_AUTH_RESET':
      return initialHRAuthState;
    
    case 'HR_AUTH_SIGN_OUT':
      return {
        ...initialHRAuthState,
        loading: false,
      };
    
    default:
      return state;
  }
} 