# State Management Migration Guide

This guide provides step-by-step instructions for migrating components from the old state management approach to the new centralized state management system.

## Overview

We've implemented a new state management system using React Context + useReducer, organized by domains. This approach provides several benefits:

1. Centralized state management
2. Consistent patterns for loading, error, and data states
3. Improved type safety
4. Better testability
5. Reduced prop drilling
6. Performance improvements
7. Easier debugging

## Migration Steps

### Step 1: Update the Main App Component

First, wrap your application with the new `StateProvider`:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { StateProvider } from '@/state'; // Import the new StateProvider
import App from './App';
import './index.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <StateProvider> {/* Replace AuthProvider with StateProvider */}
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <App />
            <Toaster />
          </ThemeProvider>
        </StateProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### Step 2: Replace Authentication Context Usage

Replace any instances of `useAuth` from the old context with the new `useAuth` hook:

#### Before:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  // Component logic
}
```

#### After:

```tsx
import { useAuth } from '@/state';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  // Component logic (no changes needed)
}
```

### Step 3: Replace HR Authentication Context Usage

Replace any instances of `useHRAuth` from the old context with the new state management:

#### Before:

```tsx
import { useHRAuth } from '@/contexts/HRAuthContext';

function MyComponent() {
  const { hrUser, isAuthenticated, login, logout } = useHRAuth();
  
  // Component logic
}
```

#### After:

```tsx
import { useHRAuth } from '@/state/hrAuth/useHRAuth';

function MyComponent() {
  const { hrUser, isAuthenticated, login, logout } = useHRAuth();
  
  // Component logic (no changes needed)
}
```

### Step 4: Replace Local Component State

For components that use local state for data fetching or UI state, replace with domain-specific hooks:

#### Before:

```tsx
import { useState, useEffect } from '@/lib/react-helpers';

function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data = await apiCall();
        setCourses(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Component render logic
}
```

#### After:

```tsx
import { useCourses } from '@/state/courses/useCourses';

function CoursesList() {
  const { courses, loading, error, fetchCourses } = useCourses();
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  
  // Component render logic
}
```

### Step 5: Replace Toast Notifications

Replace any instances of the `useToast` hook with the new `useUI` hook:

#### Before:

```tsx
import { useToast } from '@/components/ui/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: 'Success!',
      description: 'Operation completed successfully.',
    });
  };
  
  // Component logic
}
```

#### After:

```tsx
import { useUI } from '@/state';

function MyComponent() {
  const { toast, toastSuccess, toastError } = useUI();
  
  const handleClick = () => {
    toastSuccess('Success!', 'Operation completed successfully.');
    // or
    toast('Success!', 'Operation completed successfully.', 'success');
  };
  
  // Component logic
}
```

### Step 6: Add Error Handling

Take advantage of the built-in error handling in the new state hooks:

```tsx
import { useCourses } from '@/state/courses/useCourses';
import { useUI } from '@/state';

function CoursesList() {
  const { courses, loading, error, fetchCourses } = useCourses();
  const { toastError } = useUI();
  
  useEffect(() => {
    fetchCourses().catch(err => {
      toastError('Failed to load courses', err.message);
    });
  }, [fetchCourses, toastError]);
  
  // Error display can now be consistent across components
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Component render logic
}
```

### Step 7: Test the Migration

After migrating a component:

1. Test basic functionality
2. Test loading states
3. Test error handling
4. Test UI interactions
5. Test responsiveness (if using the UI state for mobile detection)

## Common Issues

### Authentication Issues

If authentication doesn't work after migration, check:

1. Make sure the StateProvider is wrapping the entire application
2. Verify that you're using the new useAuth hook
3. Check the browser console for errors

### Performance Issues

If you notice performance issues:

1. Make sure you're using useCallback for functions passed to child components
2. Verify that you're using memoization for expensive calculations
3. Check for unnecessary re-renders

### TypeScript Errors

If you encounter TypeScript errors:

1. Import the correct types from the new state system
2. Make sure you're using the correct hooks
3. Check that you're providing the correct parameters to actions

## Advanced Usage

### Combining Multiple State Domains

To access multiple domains in a single component:

```tsx
import { useAuth } from '@/state';
import { useCourses } from '@/state/courses/useCourses';
import { useUI } from '@/state';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { courses, fetchCourses } = useCourses();
  const { isMobile, openModal } = useUI();
  
  // Component logic
}
```

### Creating Custom Selectors

For derived state calculations:

```tsx
import { useUserState } from '@/state';
import { useMemo } from '@/lib/react-helpers';

function UserProgress() {
  const userState = useUserState();
  
  const completedCourses = useMemo(() => {
    if (!userState.progress) return [];
    return Object.entries(userState.progress)
      .filter(([_, progress]) => progress.completed)
      .map(([courseId]) => courseId);
  }, [userState.progress]);
  
  // Component logic
}
```

## Next Steps

After completing the migration:

1. Remove the old context files
2. Implement the remaining domain-specific reducers and hooks
3. Add more features to the state management system
4. Optimize performance
5. Add tests for the state management logic 