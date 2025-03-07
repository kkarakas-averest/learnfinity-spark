# Error Handling System

## Overview

This error handling system provides a comprehensive approach to handling errors in the application. It includes:

1. **Centralized Error Types and Utilities**: A set of standardized error types and utilities in `src/lib/error.ts`
2. **Error Boundary Component**: A React error boundary component in `src/components/ErrorBoundary.tsx` that catches unhandled errors
3. **Error Handling Hook**: A custom hook in `src/hooks/useErrorHandler.ts` that provides error handling functionality to components

## Key Features

- **Standardized Error Handling**: Consistent approach to error handling across the application
- **User-Friendly Error Messages**: Automatically converts technical errors into user-friendly messages
- **Toast Notifications**: Integration with toast system for error notifications
- **Type Safety**: Full TypeScript support for error types
- **Error Boundary**: Protection against component crashes with fallback UI
- **Async Error Handling**: Utilities for handling asynchronous errors

## How to Use

### Basic Error Handling

Use the `useErrorHandler` hook in your components:

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { error, handleError, clearError, errorMessage } = useErrorHandler();
  
  const doSomethingRisky = () => {
    try {
      // Code that might throw
    } catch (err) {
      handleError(err);
    }
  };
  
  return (
    <div>
      {error && <div className="error">{errorMessage}</div>}
      <button onClick={doSomethingRisky}>Do Something</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}
```

### Handling Async Operations

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyAsyncComponent() {
  const { isLoading, executeWithErrorHandling } = useErrorHandler();
  
  const fetchData = async () => {
    // Async operation that might throw
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  };
  
  const handleFetchClick = () => {
    executeWithErrorHandling(fetchData, {
      onSuccess: (data) => {
        console.log('Data fetched:', data);
      },
      errorMessage: 'Failed to fetch data. Please try again.'
    });
  };
  
  return (
    <div>
      <button onClick={handleFetchClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
    </div>
  );
}
```

### Creating Typed Errors

```tsx
import { createError, ErrorCode } from '@/lib/error';

// Create a validation error
const validationError = createError(
  'Invalid input: Email is required',
  ErrorCode.VALIDATION_ERROR,
  400,
  { field: 'email' }
);

// Create a network error
const networkError = createError(
  'Failed to connect to server',
  ErrorCode.NETWORK_REQUEST_FAILED,
  503
);
```

### Using the Error Boundary

Wrap components with the error boundary to prevent crashes:

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

function MyComponent() {
  // Component code that might throw errors
}

// Wrap the component with the error boundary
export default withErrorBoundary(MyComponent);
```

Or use it directly in JSX:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Advanced Usage

### Custom Error Handling Options

```tsx
const {
  handleError,
  executeWithErrorHandling
} = useErrorHandler({
  showToast: true,               // Show toast notifications for errors
  defaultMessage: 'Custom error message',  // Default error message
  toastTitle: 'Error Occurred'   // Custom toast title
});
```

### Trying Async Operations with Result Handling

```tsx
const { executeAndGetResult } = useErrorHandler();

const handleSubmit = async () => {
  const { data, error } = await executeAndGetResult(submitForm);
  
  if (error) {
    // Handle specific error case
    if (isErrorOfType(error, ErrorCode.VALIDATION_ERROR)) {
      // Handle validation error
    }
    return;
  }
  
  // Handle success case with data
  console.log('Form submitted:', data);
};
```

### Wrapping Async Functions

```tsx
const { wrapAsync } = useErrorHandler();

// Create a wrapped version of an async function
const safeFetchData = wrapAsync(fetchData, {
  errorMessage: 'Failed to fetch data'
});

// Use it like a normal async function
const handleClick = () => {
  safeFetchData().then(data => {
    // This only runs if no error occurred
    console.log('Data:', data);
  });
};
```

## Example Component

An example component that demonstrates various error handling techniques is available at:

```
/error-examples
```

This route shows:
- Basic error handling with try/catch
- Async error handling
- Component crashes caught by ErrorBoundary
- Error display and clearing

## Best Practices

1. **Use Typed Errors**: Create errors with `createError` to provide context and type information
2. **Handle Async Errors**: Use `executeWithErrorHandling` or `wrapAsync` for async operations
3. **Provide Helpful Messages**: Use the `errorMessage` parameter to provide context-specific error messages
4. **Protect Against Crashes**: Wrap components that might crash with `withErrorBoundary`
5. **Clear Errors**: Call `clearError` when appropriate, such as when starting a new operation

## Error Codes

The system includes predefined error codes for common scenarios:

- **Authentication**: `AUTH_INVALID_CREDENTIALS`, `AUTH_USER_NOT_FOUND`, etc.
- **Database**: `DB_CONNECTION_ERROR`, `DB_RECORD_NOT_FOUND`, etc.
- **Network**: `NETWORK_OFFLINE`, `NETWORK_REQUEST_FAILED`, etc.
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`
- **General**: `UNKNOWN_ERROR` 