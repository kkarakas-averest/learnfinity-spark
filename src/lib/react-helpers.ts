/**
 * This file provides consistent React imports for the entire application.
 * It centralizes React imports and re-exports them to prevent inconsistency issues.
 */

import React from 'react';

// Export the JSX runtime for Vite/SWC - using named imports to avoid name conflicts
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';

export const jsx = jsxRuntime.jsx;
export const jsxs = jsxRuntime.jsxs;
export const Fragment = jsxRuntime.Fragment;

// Export the dev runtime
export const jsxDEV = jsxDevRuntime.jsxDEV;
// jsxsDEV doesn't exist in React's JSX dev runtime, so we're removing it

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
  isValidElement
} = React;

// Add custom types/extensions here if needed
export type WithChildren<T = unknown> = T & { children?: React.ReactNode };

// Define React types directly to avoid import issues
export type ElementRef<T extends React.ElementType = HTMLElement> = React.RefObject<React.ElementRef<T>>;
export type ComponentPropsWithoutRef<T extends React.ElementType> = Omit<React.ComponentProps<T>, 'ref'>;
export type HTMLAttributes<T extends HTMLElement = HTMLElement> = React.HTMLAttributes<T>;
export type ReactNode = React.ReactNode;
export type ReactElement<P = object, T extends React.ElementType = React.ElementType> = React.ReactElement<P, T>;
export type FC<T = Record<string, unknown>> = React.FC<T>;
export type ChangeEvent<T extends Element = Element> = React.ChangeEvent<T>;
export type FormEvent<T extends Element = Element> = React.FormEvent<T>;
export type MouseEvent<T extends Element = Element> = React.MouseEvent<T>;
export type KeyboardEvent<T extends Element = Element> = React.KeyboardEvent<T>;

export default React;
