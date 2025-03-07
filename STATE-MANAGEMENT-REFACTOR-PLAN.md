# State Management Refactoring Plan

## Current State

After analyzing the codebase, I've identified the following current state management approaches:

1. **Context-based state management**
   - AuthContext.tsx - Manages authentication state
   - HRAuthContext.tsx - Manages HR authentication state
   - ThemeProvider.tsx - Manages theme preferences

2. **Component-level state management**
   - Local useState hooks in many components
   - Duplicated state logic across multiple components
   - Inconsistent patterns for loading, error, and data states

3. **Issues with current approach**
   - Scattered state management across the application
   - Inconsistent error handling
   - Duplicate loading states
   - No centralized way to access and update state
   - Potential performance issues with context re-renders

## Proposed Refactoring

I propose implementing a more structured state management approach with the following components:

### 1. Create a Core State Management System

Create a centralized state management system using React Context + useReducer pattern, organized by domains:

```
src/
  state/
    index.ts               # Export all state hooks and providers
    StateProvider.tsx      # Main state provider that combines all domains
    types.ts               # Common types for state management
    
    auth/                  # Authentication state
      authReducer.ts       # Authentication reducer
      authActions.ts       # Authentication actions
      authSelectors.ts     # Authentication selectors
      useAuth.ts           # Authentication hook
      
    user/                  # User state
      userReducer.ts       # User reducer
      userActions.ts       # User actions
      userSelectors.ts     # User selectors
      useUser.ts           # User hook
      
    courses/               # Courses state
      coursesReducer.ts    # Courses reducer
      coursesActions.ts    # Courses actions
      coursesSelectors.ts  # Courses selectors
      useCourses.ts        # Courses hook
      
    ui/                    # UI state (loading, errors, modal states, etc.)
      uiReducer.ts         # UI reducer
      uiActions.ts         # UI actions
      uiSelectors.ts       # UI selectors
      useUI.ts             # UI hook
```

### 2. Implement Common Patterns for State Management

For each domain:

1. **State Shape**:
   ```typescript
   interface DomainState {
     data: DataType | null;
     loading: boolean;
     error: Error | null;
     // domain-specific state
   }
   ```

2. **Actions**:
   ```typescript
   type DomainAction = 
     | { type: 'FETCH_START' }
     | { type: 'FETCH_SUCCESS', payload: DataType }
     | { type: 'FETCH_ERROR', payload: Error }
     | { type: 'RESET' }
     | { /* domain-specific actions */ };
   ```

3. **Reducer**:
   ```typescript
   function domainReducer(state: DomainState, action: DomainAction): DomainState {
     switch (action.type) {
       case 'FETCH_START':
         return { ...state, loading: true, error: null };
       case 'FETCH_SUCCESS':
         return { ...state, loading: false, data: action.payload, error: null };
       case 'FETCH_ERROR':
         return { ...state, loading: false, error: action.payload };
       case 'RESET':
         return initialState;
       // domain-specific cases
       default:
         return state;
     }
   }
   ```

4. **Custom Hook**:
   ```typescript
   function useDomain() {
     const { state, dispatch } = useContext(StateContext);
     
     const fetchData = useCallback(async () => {
       dispatch({ type: 'FETCH_START' });
       try {
         const data = await apiCall();
         dispatch({ type: 'FETCH_SUCCESS', payload: data });
         return data;
       } catch (error) {
         dispatch({ type: 'FETCH_ERROR', payload: error });
         throw error;
       }
     }, [dispatch]);
     
     return {
       data: state.domain.data,
       loading: state.domain.loading,
       error: state.domain.error,
       fetchData,
       // other domain-specific functions
     };
   }
   ```

### 3. Create Combined State Provider

```typescript
export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  const [coursesState, coursesDispatch] = useReducer(coursesReducer, initialCoursesState);
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);
  
  const state = {
    auth: authState,
    user: userState,
    courses: coursesState,
    ui: uiState
  };
  
  const dispatch = {
    auth: authDispatch,
    user: userDispatch,
    courses: coursesDispatch,
    ui: uiDispatch
  };
  
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};
```

### 4. Implement API Integration Layer

Create a consistent API layer that integrates with the state management:

```typescript
// src/api/courses.ts
export const fetchCourses = async (): Promise<Course[]> => {
  const response = await supabase.from('courses').select('*');
  if (response.error) throw response.error;
  return response.data;
};

// src/state/courses/coursesActions.ts
export const fetchCourses = () => async (dispatch: Dispatch<CoursesAction>) => {
  dispatch({ type: 'FETCH_COURSES_START' });
  try {
    const courses = await api.courses.fetchCourses();
    dispatch({ type: 'FETCH_COURSES_SUCCESS', payload: courses });
    return courses;
  } catch (error) {
    dispatch({ type: 'FETCH_COURSES_ERROR', payload: error });
    throw error;
  }
};
```

## Migration Strategy

### Phase 1: Create Core Infrastructure

1. Create the basic state management infrastructure:
   - Create state folder structure
   - Implement base types and utilities
   - Create state context and provider

2. Implement UI state management:
   - Loading states
   - Error states
   - Modal/dialog states
   - Notification states

### Phase 2: Migrate Authentication State

1. Refactor AuthContext to use the new state management:
   - Implement auth reducer and actions
   - Create useAuth hook that exposes the same API as the current context
   - Update components to use the new hook

2. Refactor HRAuthContext to use the new state management:
   - Implement HR-specific actions and state
   - Create useHRAuth hook with the same API

### Phase 3: Migrate User and Courses State

1. Implement user state management:
   - User profile data
   - User preferences
   - User progress data

2. Implement courses state management:
   - Course listings
   - Course details
   - Course progress

### Phase 4: Component Updates

1. Update components to use the new state management hooks:
   - Replace direct useState calls with domain-specific hooks
   - Standardize loading and error handling
   - Add selectors for derived state

### Phase 5: Performance Optimization

1. Implement memoization for components that use state
2. Add selector optimization to prevent unnecessary re-renders
3. Add React.memo for components that don't need to re-render

## Expected Benefits

1. **Centralized State Management**: All state management logic in one place
2. **Consistent Patterns**: Standardized approach to loading, error, and data states
3. **Improved Type Safety**: Well-typed state and actions
4. **Better Testability**: Isolated state logic that can be tested separately
5. **Reduced Prop Drilling**: Components can access state directly via hooks
6. **Performance Improvements**: Optimized renders by using selectors
7. **Easier Debugging**: Clear action flow and predictable state updates

## Implementation Timeline

1. **Phase 1**: 1-2 days
2. **Phase 2**: 1-2 days
3. **Phase 3**: 2-3 days
4. **Phase 4**: 2-3 days
5. **Phase 5**: 1-2 days

Total estimated time: 7-12 days 