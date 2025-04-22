/**
 * This file provides standardized React imports for the entire application.
 * It helps ensure consistent React usage and avoids JSX runtime issues.
 */

// Import the default React namespace
import React from 'react';

// Re-export React's properties that we want to use
const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  createContext,
  useReducer,
  useLayoutEffect,
  Fragment,
  forwardRef,
} = React;

// Export default React
export default React;

// Named exports for commonly used hooks and components
export {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  createContext,
  useReducer,
  useLayoutEffect,
  Fragment,
  forwardRef,
};

// Additional utility functions can be added here

// Log that this module has been loaded - helps with debugging
if (import.meta.env.DEV) {
  console.log('🔄 React import helper loaded');
} 