import { UserState, UserAction } from '../types';

// Initial user state
export const initialUserState: UserState = {
  data: null,
  loading: false,
  error: null,
  preferences: null,
  progress: null,
};

/**
 * User Reducer
 * Manages user profile data, preferences, and progress state
 */
export function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'USER_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'USER_SUCCESS':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
      };
    
    case 'USER_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    
    case 'USER_RESET':
      return initialUserState;
    
    case 'USER_UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.preferences,
        },
      };
    
    case 'USER_UPDATE_PROGRESS':
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.progress,
        },
      };
    
    default:
      return state;
  }
} 