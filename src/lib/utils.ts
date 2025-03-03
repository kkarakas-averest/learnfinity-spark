import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Global error tracking variable that can be checked by debugging tools
declare global {
  interface Window {
    __DEBUG_HAS_TYPE_ERROR: boolean;
    __DEBUG_TYPE_ERROR_INFO: any;
  }
}

export function cn(...inputs: ClassValue[]): string {
  try {
    console.log('cn function called with inputs:', JSON.stringify(inputs));
    
    // Ensure each input is properly handled
    const validInputs = inputs.filter((input): input is NonNullable<typeof input> => {
      if (input === null || input === undefined) {
        console.log('Filtering out null/undefined input');
        return false;
      }
      
      // Check for array-like objects that might cause includes() errors
      if (input !== null && typeof input === 'object') {
        // Special check for array-like objects that don't have includes method
        if (Array.isArray(input) && !('includes' in input)) {
          console.error('Array without includes method detected:', input);
          if (typeof window !== 'undefined') {
            window.__DEBUG_HAS_TYPE_ERROR = true;
            window.__DEBUG_TYPE_ERROR_INFO = { type: 'array-without-includes', value: JSON.stringify(input) };
          }
          return false;
        }
      }
      
      if (typeof input === 'string') return true;
      if (typeof input === 'object') return true;
      
      console.log('Filtering out invalid input of type:', typeof input);
      return false;
    });

    console.log('Valid inputs after filtering:', JSON.stringify(validInputs));

    // Convert any non-string objects to strings
    const processedInputs = validInputs.map(input => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object') {
        // Handle cases where object might be something unexpected
        try {
          // Handle string or array-like objects that might cause errors with clsx
          if (typeof input.toString === 'function' && input.toString() !== '[object Object]') {
            console.log('Converting to string via toString():', input.toString());
            return input.toString();
          }
          
          // Normal object processing
          return Object.entries(input)
            .filter(([_, value]) => {
              // Special check for value to avoid TypeError
              if (value === null || value === undefined) return false;
              return Boolean(value);
            })
            .map(([key]) => key)
            .join(' ');
        } catch (err) {
          console.error('Error processing object in cn:', err);
          if (typeof window !== 'undefined') {
            window.__DEBUG_HAS_TYPE_ERROR = true;
            window.__DEBUG_TYPE_ERROR_INFO = { type: 'object-processing-error', error: String(err) };
          }
          return '';
        }
      }
      return '';
    });

    console.log('Processed inputs:', JSON.stringify(processedInputs));
    
    // Check processedInputs for any values that might cause issues with clsx or twMerge
    const safeInputs = processedInputs.filter(input => {
      // Explicitly check that the input won't cause problems
      return typeof input === 'string';
    });
    
    const result = twMerge(clsx(safeInputs));
    console.log('Final cn result:', result);
    return result;
  } catch (error) {
    console.error('Error in cn function:', error);
    if (typeof window !== 'undefined') {
      window.__DEBUG_HAS_TYPE_ERROR = true;
      window.__DEBUG_TYPE_ERROR_INFO = { type: 'cn-function-error', error: String(error) };
    }
    // Return empty string as fallback to prevent UI crashes
    return '';
  }
}
