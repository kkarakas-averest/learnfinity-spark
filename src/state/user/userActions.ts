import { UserAction, UserDetails } from '../types';

/**
 * Set loading state
 */
export const setLoading = (): UserAction => ({
  type: 'USER_LOADING',
});

/**
 * Set user success
 */
export const setUserSuccess = (user: UserDetails): UserAction => ({
  type: 'USER_SUCCESS',
  payload: user,
});

/**
 * Set user error
 */
export const setUserError = (error: Error): UserAction => ({
  type: 'USER_ERROR',
  error,
});

/**
 * Reset user state
 */
export const resetUser = (): UserAction => ({
  type: 'USER_RESET',
});

/**
 * Update user preferences
 * @param preferences User preferences to update
 */
export const updatePreferences = (preferences: Record<string, any>): UserAction => ({
  type: 'USER_UPDATE_PREFERENCES',
  preferences,
});

/**
 * Update user progress
 * @param progress User progress to update
 */
export const updateProgress = (progress: Record<string, any>): UserAction => ({
  type: 'USER_UPDATE_PROGRESS',
  progress,
}); 