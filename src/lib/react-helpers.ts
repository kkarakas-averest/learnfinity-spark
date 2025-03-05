
/**
 * This file provides consistent React imports for the entire application.
 * It helps ensure the same import style is used throughout the codebase.
 */

import React from 'react';

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

// Define React types directly to avoid import issues
export type ElementRef<T = any> = React.RefObject<T>;
export type ComponentPropsWithoutRef<T = any> = Omit<React.ComponentProps<T>, 'ref'>;
export type HTMLAttributes<T = any> = React.HTMLAttributes<T>;
export type ReactNode = React.ReactNode;
export type ReactElement<T = any> = React.ReactElement<T>;
export type FC<T = {}> = React.FC<T>;
export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
export type FormEvent<T = Element> = React.FormEvent<T>;
export type MouseEvent<T = Element> = React.MouseEvent<T>;
export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;

export default React;
