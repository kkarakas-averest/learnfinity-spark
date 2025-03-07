import { UIAction, Toast } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a toast notification
 */
export const addToast = (toast: Omit<Toast, 'id'>): UIAction => ({
  type: 'UI_ADD_TOAST',
  toast: {
    ...toast,
    id: uuidv4(),
  },
});

/**
 * Remove a toast notification
 */
export const removeToast = (id: string): UIAction => ({
  type: 'UI_REMOVE_TOAST',
  id,
});

/**
 * Open a modal
 */
export const openModal = (id: string, data?: any): UIAction => ({
  type: 'UI_OPEN_MODAL',
  id,
  data,
});

/**
 * Close a modal
 */
export const closeModal = (id: string): UIAction => ({
  type: 'UI_CLOSE_MODAL',
  id,
});

/**
 * Set the theme
 */
export const setTheme = (theme: 'light' | 'dark' | 'system'): UIAction => ({
  type: 'UI_SET_THEME',
  theme,
});

/**
 * Set mobile state
 */
export const setMobile = (isMobile: boolean): UIAction => ({
  type: 'UI_SET_MOBILE',
  isMobile,
}); 