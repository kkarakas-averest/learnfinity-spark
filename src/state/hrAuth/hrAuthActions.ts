import { HRAuthAction, HRUser } from '../types';

/**
 * Set loading state
 */
export const setLoading = (): HRAuthAction => ({
  type: 'HR_AUTH_LOADING',
});

/**
 * Set HR auth success
 */
export const setHRAuthSuccess = (user: HRUser): HRAuthAction => ({
  type: 'HR_AUTH_SUCCESS',
  payload: user,
});

/**
 * Set HR auth error
 */
export const setHRAuthError = (error: Error): HRAuthAction => ({
  type: 'HR_AUTH_ERROR',
  error,
});

/**
 * Reset HR auth state
 */
export const resetHRAuth = (): HRAuthAction => ({
  type: 'HR_AUTH_RESET',
});

/**
 * HR Sign out
 */
export const hrSignOut = (): HRAuthAction => ({
  type: 'HR_AUTH_SIGN_OUT',
}); 