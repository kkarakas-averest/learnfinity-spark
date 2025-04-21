
/**
 * This file provides consistent React imports for the entire application.
 * It centralizes React imports and re-exports them to prevent inconsistency issues.
 * 
 * DEPRECATED: This approach is being phased out. Please import directly from 'react'.
 * Example: import React, { useState, useEffect } from 'react';
 */

import React from 'react';

// Add deprecation warning in development mode
if (import.meta.env.DEV) {
  console.warn(
    'Warning: @/lib/react-helpers is deprecated. ' +
    'Please import React directly from "react" instead. ' +
    'Example: import React, { useState, useEffect } from "react";'
  );
}

// Re-export the JSX runtime for Vite/SWC - using named imports to avoid name conflicts
export { jsx, jsxs, Fragment } from './react-helpers/jsx-runtime';
export { jsxDEV } from './react-helpers/jsx-dev-runtime';

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
