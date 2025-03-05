
import React from 'react';

declare module 'react' {
  export = React;
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useContext: typeof React.useContext;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useReducer: typeof React.useReducer;
  export const createContext: typeof React.createContext;
  export const memo: typeof React.memo;
  export const forwardRef: typeof React.forwardRef;
  export type FC<P = {}> = React.FC<P>;
  export type ReactNode = React.ReactNode;
  export type ReactElement = React.ReactElement;
  export type RefObject<T> = React.RefObject<T>;
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type HTMLAttributes<T = Element> = React.HTMLAttributes<T>;
  export type CSSProperties = React.CSSProperties;
}
