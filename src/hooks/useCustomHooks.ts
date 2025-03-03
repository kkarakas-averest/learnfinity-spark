import React from 'react';
import { toast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';

// Create local constants for React hooks
const { useState, useEffect, useRef, useCallback } = React;

/**
 * Hook for managing asynchronous operations with loading and error states
 */
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  const execute = useCallback(() => {
    setStatus('pending');
    setValue(null);
    setError(null);

    return asyncFunction()
      .then((response) => {
        setValue(response);
        setStatus('success');
        return response;
      })
      .catch((error) => {
        setError(error);
        setStatus('error');
        throw error;
      });
  }, [asyncFunction]);

  // Call execute if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error, isLoading: status === 'pending' };
}

/**
 * Hook to manage form state with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const handleSubmit = (onSubmit: (values: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
        
        const hasErrors = Object.keys(validationErrors).length > 0;
        if (hasErrors) {
          // Mark all fields as touched to show errors
          const allTouched = Object.keys(values).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {}
          );
          setTouched(allTouched as Partial<Record<keyof T, boolean>>);
          return;
        }
      }
      
      setIsSubmitting(true);
      onSubmit(values);
      setIsSubmitting(false);
    };
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
  };
}

/**
 * Hook for basic pagination
 */
export function useSimplePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination values
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  
  // Handle page changes
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Hook for managing a modal dialog
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  
  const open = useCallback((data?: any) => {
    setIsOpen(true);
    if (data) setModalData(data);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setModalData(null);
  }, []);
  
  return { isOpen, modalData, open, close };
}

/**
 * Hook for local storage state
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
        
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue] as const;
}

/**
 * Hook for debounced search input
 */
export function useSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<T[]>(items);
  
  // Use the debounce utility function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, delay)
  ).current;
  
  // Effect for handling the debounced input
  useEffect(() => {
    debouncedSearch(query);
    
    // Cleanup on unmount
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [query, debouncedSearch]);
  
  // Filter items based on the debounced query
  useEffect(() => {
    const filtered = debouncedQuery
      ? items.filter(item => searchFn(item, debouncedQuery))
      : items;
    setResults(filtered);
  }, [debouncedQuery, items, searchFn]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  return {
    query,
    results,
    handleInputChange,
    setQuery,
  };
}

/**
 * Hook for toast notifications with automatic error handling
 */
export function useToastNotification() {
  const showToast = useCallback(
    (
      title: string,
      description?: string,
      variant: 'default' | 'destructive' | 'success' = 'default'
    ) => {
      toast({
        title,
        description,
        variant,
      });
    },
    []
  );
  
  const showSuccessToast = useCallback(
    (title: string, description?: string) => {
      showToast(title, description, 'success');
    },
    [showToast]
  );
  
  const showErrorToast = useCallback(
    (error: unknown) => {
      let title = 'An error occurred';
      let description = 'Please try again later.';
      
      if (error instanceof Error) {
        title = error.name;
        description = error.message;
      } else if (typeof error === 'string') {
        description = error;
      }
      
      showToast(title, description, 'destructive');
    },
    [showToast]
  );
  
  return {
    showToast,
    showSuccessToast,
    showErrorToast,
  };
}

/**
 * Hook for tracking window size
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
} 