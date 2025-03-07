import React, { useCallback, useEffect } from '@/lib/react-helpers';
import { useUIState, useUIDispatch } from '../StateContext';
import { 
  addToast as addToastAction, 
  removeToast as removeToastAction,
  openModal as openModalAction,
  closeModal as closeModalAction,
  setTheme as setThemeAction,
  setMobile as setMobileAction
} from './uiActions';
import { Toast } from '../types';

/**
 * Custom hook for UI state management
 * Provides convenient methods for toasts, modals, theme, etc.
 */
export function useUI() {
  const state = useUIState();
  const dispatch = useUIDispatch();
  
  /**
   * Toasts
   */
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    dispatch(addToastAction(toast));
  }, [dispatch]);
  
  const removeToast = useCallback((id: string) => {
    dispatch(removeToastAction(id));
  }, [dispatch]);
  
  const toasts = state.toasts;
  
  /**
   * Success toast shorthand
   */
  const toast = useCallback((
    title: string, 
    description?: string,
    type: Toast['type'] = 'default'
  ) => {
    addToast({ title, description, type });
  }, [addToast]);
  
  /**
   * Success toast shorthand
   */
  const toastSuccess = useCallback((
    title: string, 
    description?: string
  ) => {
    addToast({ title, description, type: 'success' });
  }, [addToast]);
  
  /**
   * Error toast shorthand
   */
  const toastError = useCallback((
    title: string, 
    description?: string
  ) => {
    addToast({ title, description, type: 'error' });
  }, [addToast]);
  
  /**
   * Modals
   */
  const openModal = useCallback((id: string, data?: any) => {
    dispatch(openModalAction(id, data));
  }, [dispatch]);
  
  const closeModal = useCallback((id: string) => {
    dispatch(closeModalAction(id));
  }, [dispatch]);
  
  const getModalState = useCallback((id: string) => {
    return state.modals[id] || { id, isOpen: false };
  }, [state.modals]);
  
  /**
   * Theme
   */
  const theme = state.theme;
  
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch(setThemeAction(theme));
  }, [dispatch]);
  
  /**
   * Mobile detection
   */
  const isMobile = state.isMobile;
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      if (isMobileDevice !== state.isMobile) {
        dispatch(setMobileAction(isMobileDevice));
      }
    };
    
    // Check on initial render
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [dispatch, state.isMobile]);
  
  return {
    // Toast methods
    toast,
    toastSuccess,
    toastError,
    addToast,
    removeToast,
    toasts,
    
    // Modal methods
    openModal,
    closeModal,
    getModalState,
    
    // Theme
    theme,
    setTheme,
    
    // Mobile
    isMobile,
  };
} 