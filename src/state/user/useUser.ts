import React, { useCallback } from '@/lib/react-helpers';
import { useUserState, useUserDispatch } from '../StateContext';
import { supabase } from '@/lib/supabase';
import { 
  setLoading,
  setUserSuccess,
  setUserError,
  updatePreferences,
  updateProgress,
} from './userActions';
import { UserDetails } from '../types';

/**
 * Custom hook for user state
 * Provides methods for accessing and updating user data
 */
export function useUser() {
  const state = useUserState();
  const dispatch = useUserDispatch();
  
  /**
   * Fetch user profile data
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const userDetails: UserDetails = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
        };
        
        dispatch(setUserSuccess(userDetails));
        return userDetails;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      dispatch(setUserError(error instanceof Error ? error : new Error('Failed to fetch user profile')));
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Fetch user preferences
   */
  const fetchUserPreferences = useCallback(async (userId: string) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      if (data) {
        dispatch(updatePreferences(data.preferences || {}));
        return data.preferences;
      }
      
      // If no preferences exist yet, create default ones
      const defaultPreferences = {
        theme: 'light',
        notifications: true,
        emailNotifications: true,
      };
      
      await saveUserPreferences(userId, defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }, [dispatch]);
  
  /**
   * Save user preferences
   */
  const saveUserPreferences = useCallback(async (userId: string, preferences: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences,
        })
        .select();
      
      if (error) throw error;
      
      dispatch(updatePreferences(preferences));
      return data;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Fetch user progress
   */
  const fetchUserProgress = useCallback(async (userId: string) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transform array of progress items into an object keyed by courseId
        const progressMap = data.reduce((acc, item) => {
          acc[item.course_id] = item.progress;
          return acc;
        }, {} as Record<string, any>);
        
        dispatch(updateProgress(progressMap));
        return progressMap;
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {};
    }
  }, [dispatch]);
  
  /**
   * Update user progress for a specific course
   */
  const updateUserProgress = useCallback(async (
    userId: string, 
    courseId: string, 
    progress: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          progress,
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;
      
      // Update local state
      dispatch(updateProgress({ [courseId]: progress }));
      return data;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Update user profile
   */
  const updateUserProfile = useCallback(async (
    userId: string,
    profileData: Partial<UserDetails>
  ) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const userDetails: UserDetails = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
        };
        
        dispatch(setUserSuccess(userDetails));
        return userDetails;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      dispatch(setUserError(error instanceof Error ? error : new Error('Failed to update user profile')));
      throw error;
    }
  }, [dispatch]);
  
  return {
    // State
    userDetails: state.data,
    preferences: state.preferences,
    progress: state.progress,
    isLoading: state.loading,
    error: state.error,
    
    // Methods
    fetchUserProfile,
    fetchUserPreferences,
    saveUserPreferences,
    fetchUserProgress,
    updateUserProgress,
    updateUserProfile,
  };
} 