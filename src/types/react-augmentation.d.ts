
// This file provides augmentations to React's type definitions
import React from 'react';

// Re-export React components and hooks
declare global {
  const useState: typeof React.useState;
  const useEffect: typeof React.useEffect;
  const useRef: typeof React.useRef;
  const useCallback: typeof React.useCallback;
  const useMemo: typeof React.useMemo;
  const useContext: typeof React.useContext;
  const useReducer: typeof React.useReducer;
  const useLayoutEffect: typeof React.useLayoutEffect;
  const useImperativeHandle: typeof React.useImperativeHandle;
  const useDebugValue: typeof React.useDebugValue;
}
