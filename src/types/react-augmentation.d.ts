
/**
 * React module augmentations to fix TypeScript import errors
 */

// This fixes the import issue with React hooks and components
declare module 'react' {
  // Re-export everything from React
  export = React;
  export as namespace React;
  
  // Explicitly declare the hooks that are giving errors
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useRef<T = undefined>(initialValue: T): React.MutableRefObject<T>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList): T;
}
