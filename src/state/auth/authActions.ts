import { AuthAction, UserDetails } from '../types';
import { User, Session } from '@supabase/supabase-js';

/**
 * Set loading state
 */
export const setLoading = (): AuthAction => ({
  type: 'AUTH_LOADING',
});

/**
 * Set user success
 */
export const setAuthSuccess = (user: User): AuthAction => ({
  type: 'AUTH_SUCCESS',
  payload: user,
});

/**
 * Set auth error
 */
export const setAuthError = (error: Error): AuthAction => ({
  type: 'AUTH_ERROR',
  error,
});

/**
 * Reset auth state
 */
export const resetAuth = (): AuthAction => ({
  type: 'AUTH_RESET',
});

/**
 * Set session
 */
export const setSession = (session: Session | null): AuthAction => ({
  type: 'AUTH_SET_SESSION',
  session,
});

/**
 * Set user
 */
export const setUser = (user: User | null): AuthAction => ({
  type: 'AUTH_SET_USER',
  user,
});

/**
 * Set user details
 */
export const setUserDetails = (userDetails: UserDetails | null): AuthAction => ({
  type: 'AUTH_SET_USER_DETAILS',
  userDetails,
});

/**
 * Sign out
 */
export const signOut = (): AuthAction => ({
  type: 'AUTH_SIGN_OUT',
}); 