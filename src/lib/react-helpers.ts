
/**
 * This file provides consistent React imports for the entire application.
 * It helps ensure the same import style is used throughout the codebase.
 */

import React from 'react';

export default React;

// Re-export common hooks and components
export const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  createContext,
  memo,
  forwardRef,
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  useDebugValue,
  useId,
  useDeferredValue,
  useTransition,
  startTransition,
  Children,
  cloneElement,
  createElement,
  isValidElement,
  Fragment
} = React;
