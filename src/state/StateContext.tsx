import React, { createContext, useReducer, useContext } from '@/lib/react-helpers';
import { 
  StateContextType, 
  AppState, 
  AppDispatch,
} from './types';

// Import reducers
import { authReducer, initialAuthState } from './auth/authReducer';
import { hrAuthReducer, initialHRAuthState } from './hrAuth/hrAuthReducer';
import { userReducer, initialUserState } from './user/userReducer';
import { coursesReducer, initialCoursesState } from './courses/coursesReducer';
import { uiReducer, initialUIState } from './ui/uiReducer';

// Create the context with a default value
export const StateContext = createContext<StateContextType | undefined>(undefined);

// Create the provider component
export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // Set up reducers with initial state
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [hrAuthState, hrAuthDispatch] = useReducer(hrAuthReducer, initialHRAuthState);
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  const [coursesState, coursesDispatch] = useReducer(coursesReducer, initialCoursesState);
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);
  
  // Combine all state
  const state: AppState = {
    auth: authState,
    hrAuth: hrAuthState,
    user: userState,
    courses: coursesState,
    ui: uiState
  };
  
  // Combine all dispatchers
  const dispatch: AppDispatch = {
    auth: authDispatch,
    hrAuth: hrAuthDispatch,
    user: userDispatch,
    courses: coursesDispatch,
    ui: uiDispatch
  };
  
  // Provide the combined state and dispatch to the app
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

// Custom hook for accessing the state context
export const useAppState = (): StateContextType => {
  const context = useContext(StateContext);
  
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  
  return context;
};

// Export specific state hooks for convenience
export const useAuthState = () => {
  const { state } = useAppState();
  return state.auth;
};

export const useAuthDispatch = () => {
  const { dispatch } = useAppState();
  return dispatch.auth;
};

export const useHRAuthState = () => {
  const { state } = useAppState();
  return state.hrAuth;
};

export const useHRAuthDispatch = () => {
  const { dispatch } = useAppState();
  return dispatch.hrAuth;
};

export const useUserState = () => {
  const { state } = useAppState();
  return state.user;
};

export const useUserDispatch = () => {
  const { dispatch } = useAppState();
  return dispatch.user;
};

export const useCoursesState = () => {
  const { state } = useAppState();
  return state.courses;
};

export const useCoursesDispatch = () => {
  const { dispatch } = useAppState();
  return dispatch.courses;
};

export const useUIState = () => {
  const { state } = useAppState();
  return state.ui;
};

export const useUIDispatch = () => {
  const { dispatch } = useAppState();
  return dispatch.ui;
}; 