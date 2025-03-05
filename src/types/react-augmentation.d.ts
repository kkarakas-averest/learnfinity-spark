
import 'react';

// Add any missing React type definitions or augmentations here
declare module 'react' {
  // Ensure useState, useEffect and other hooks are properly recognized
  export const useState: typeof import('react').useState;
  export const useEffect: typeof import('react').useEffect;
  export const useContext: typeof import('react').useContext;
  export const useRef: typeof import('react').useRef;
  export const useMemo: typeof import('react').useMemo;
  export const useCallback: typeof import('react').useCallback;
}
