
/**
 * This file provides consistent React imports for the entire application.
 * It helps ensure the same import style is used throughout the codebase.
 */

import React, { 
  ElementRef as ReactElementRef,
  ComponentPropsWithoutRef as ReactComponentPropsWithoutRef,
  HTMLAttributes as ReactHTMLAttributes,
  ReactNode as ReactNodeType,
  ReactElement as ReactElementType,
  FC as ReactFC,
  ChangeEvent as ReactChangeEvent,
  FormEvent as ReactFormEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent
} from 'react';

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

// Re-export types using named aliases to avoid TypeScript errors
export type ElementRef<T = any> = ReactElementRef<T>;
export type ComponentPropsWithoutRef<T = any> = ReactComponentPropsWithoutRef<T>;
export type HTMLAttributes<T = any> = ReactHTMLAttributes<T>;
export type ReactNode = ReactNodeType;
export type ReactElement<T = any> = ReactElementType<T>;
export type FC<T = {}> = ReactFC<T>;
export type ChangeEvent<T = Element> = ReactChangeEvent<T>;
export type FormEvent<T = Element> = ReactFormEvent<T>;
export type MouseEvent<T = Element> = ReactMouseEvent<T>;
export type KeyboardEvent<T = Element> = ReactKeyboardEvent<T>;
