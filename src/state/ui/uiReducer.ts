import { UIState, UIAction, Toast, Modal } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Initial state for UI
export const initialUIState: UIState = {
  toasts: [],
  modals: {} as Record<string, Modal>,
  theme: 'light',
  isMobile: false,
};

/**
 * UI Reducer
 * Manages global UI state including toasts, modals, theme, and device type
 */
export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'UI_ADD_TOAST': {
      const toast: Toast = {
        id: action.toast.id || uuidv4(),
        title: action.toast.title,
        description: action.toast.description,
        type: action.toast.type || 'default',
      };
      
      return {
        ...state,
        toasts: [...state.toasts, toast],
      };
    }
    
    case 'UI_REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id),
      };
    }
    
    case 'UI_OPEN_MODAL': {
      const modal: Modal = {
        id: action.id,
        isOpen: true,
        data: action.data,
      };
      
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.id]: modal,
        },
      };
    }
    
    case 'UI_CLOSE_MODAL': {
      const modals = { ...state.modals };
      
      if (modals[action.id]) {
        modals[action.id] = {
          ...modals[action.id],
          isOpen: false,
        };
      }
      
      return {
        ...state,
        modals,
      };
    }
    
    case 'UI_SET_THEME': {
      // Save theme to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ui-theme', action.theme);
      }
      
      return {
        ...state,
        theme: action.theme,
      };
    }
    
    case 'UI_SET_MOBILE': {
      return {
        ...state,
        isMobile: action.isMobile,
      };
    }
    
    default:
      return state;
  }
} 