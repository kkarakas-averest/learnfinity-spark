/**
 * Authentication service that provides direct authentication with Supabase
 * without relying on workarounds or mappings.
 */

import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserRole } from './database.types';

// Define error types for better error handling
export interface AuthError extends Error {
  status?: number;
  code?: string;
}

// User details interface
export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Convert to AuthError for better handling
      const authError = new Error(error.message) as AuthError;
      authError.status = error.status;
      authError.code = error.code;
      authError.name = 'AuthError';
      throw authError;
    }

    // Get user details
    if (data.user) {
      const userDetails = await getUserDetails(data.user.id);
      return { 
        success: true, 
        data,
        userDetails
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown sign in error')
    };
  }
}

/**
 * Sign up with email, password, and user details
 */
export async function signUpWithDetails(
  email: string, 
  password: string, 
  name: string, 
  role: UserRole = 'learner'
) {
  try {
    // Validate inputs
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    // Sign up with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (authError) {
      // Convert to AuthError for better handling
      const error = new Error(authError.message) as AuthError;
      error.status = authError.status;
      error.code = authError.code;
      error.name = 'AuthError';
      throw error;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create user record in the users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role
      }]);

    if (insertError) {
      console.warn('Warning: User auth created but profile insertion failed:', insertError);
      return {
        success: true,
        data: authData,
        warning: 'User created but profile information not saved'
      };
    }

    return { success: true, data: authData };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown sign up error')
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown sign out error')
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    return { 
      success: true, 
      session: data.session,
      user: data.session?.user || null
    };
  } catch (error) {
    console.error('Get session error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown session error'),
      session: null,
      user: null
    };
  }
}

/**
 * Get user details from the database
 */
export async function getUserDetails(userId: string): Promise<UserDetails | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching user details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user details:', error);
    return null;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session, session?.user || null);
  });
  
  return data.subscription;
} 