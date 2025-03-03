
/// <reference types="vite/client" />

// Ensure lucide-react icons are available
declare module 'lucide-react' {
  import * as React from 'react';
  export type Icon = React.FC<React.SVGProps<SVGSVGElement>>;
  
  export const Menu: Icon;
  export const X: Icon;
  export const Book: Icon;
  export const GraduationCap: Icon;
  export const Settings: Icon;
  export const Home: Icon;
  export const User: Icon;
  export const UserPlus: Icon;
  export const LogOut: Icon;
  export const ArrowLeft: Icon;
  export const Loader2: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const CheckCircle: Icon;
  export const Info: Icon;
  export const Check: Icon;
  export const BarChart2: Icon;
  export const Users: Icon;
  export const Building: Icon;
  export const BrainCircuit: Icon;
  export const FileSpreadsheet: Icon;
  export const Clock: Icon;
  export const Copy: Icon;
  export const Wrench: Icon;
  export const Filter: Icon;
  export const Activity: Icon;
  export const Award: Icon;
  export const Upload: Icon;
  export const Download: Icon;
  export const Layers: Icon;
  export const Bookmark: Icon;
  export const Zap: Icon;
  export const ChevronRight: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ChevronLeft: Icon;
  export const Circle: Icon;
  export const RefreshCw: Icon;
  export const Calendar: Icon;
  export const FileText: Icon;
  export const Star: Icon;
  export const Sparkles: Icon;
  export const MoreHorizontal: Icon;
  export const MessageSquare: Icon;
  export const Building2: Icon;
  export const FileBadge: Icon;
  export const Library: Icon;
  export const Bot: Icon;
  export const Edit: Icon;
  export const PanelLeft: Icon;
  export const Dot: Icon;
  export const PlayCircle: Icon;
  export const Target: Icon;
  export const Trophy: Icon;
  export const CalendarDays: Icon;
  export const Pencil: Icon;
  export const Save: Icon;
  export const Shield: Icon;
  export const GripVertical: Icon;
  export const ArrowRight: Icon;
  export const ArrowUpRight: Icon;
  export const Search: Icon;
  export const LayoutDashboard: Icon;
}

// Fix React imports by making React module correctly typed
declare module 'react' {
  import React from 'react';
  
  export = React;
  export as namespace React;
  
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  export type ReactNode = 
    | ReactElement
    | ReactFragment
    | ReactPortal
    | boolean
    | null
    | undefined;
    
  export interface ReactFragment {}
  export interface ReactPortal extends ReactElement {}
  export type Key = string | number;
  export type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);
  
  export type SyntheticEvent<T = Element, E = Event> = {}
  export type MouseEvent<T = Element> = SyntheticEvent<T, MouseEvent>;
  export type ChangeEvent<T = Element> = SyntheticEvent<T>;
  export type FormEvent<T = Element> = SyntheticEvent<T>;
  
  export type RefCallback<T> = (instance: T | null) => void;
  export type RefObject<T> = { current: T | null };
  export type Ref<T> = RefCallback<T> | RefObject<T> | null;

  export type ComponentState = any;
  export type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
  export type ComponentClass<P = {}, S = ComponentState> = new (props: P) => Component<P, S>;
  export type FunctionComponent<P = {}> = (props: P) => ReactElement<any, any> | null;
  export type FC<P = {}> = FunctionComponent<P>;
  export type HTMLAttributes<T> = {};
  export type SVGProps<T> = {};
  export type CSSProperties = {};
  export type ForwardRefExoticComponent<P> = {};
  export type RefAttributes<T> = {};
  export type PropsWithRef<P> = {};
  export type PropsWithChildren<P = {}> = P & { children?: ReactNode };
  export type ClassAttributes<T> = {};
  export type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = {};
  export type PropsWithoutRef<P> = {};
  export type ElementRef<C> = {};

  export interface Component<P = {}, S = {}, SS = any> {}
  export abstract class Component<P, S> {}
  export class PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> {}

  // React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((oldState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void | undefined), deps?: ReadonlyArray<any>): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>, I>(
    reducer: R,
    initializerArg: I & React.ReducerState<R>,
    initializer: (arg: I & React.ReducerState<R>) => React.ReducerState<R>
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any> | undefined): T;
  export function useRef<T = undefined>(initialValue: T): React.MutableRefObject<T>;
  export function useImperativeHandle<T, R extends T>(ref: React.Ref<T>, init: () => R, deps?: ReadonlyArray<any>): void;
  export function useLayoutEffect(effect: React.EffectCallback, deps?: ReadonlyArray<any>): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  export function useId(): string;

  // Context API
  export interface ProviderProps<T> {
    value: T;
    children?: ReactNode;
  }
  export interface ConsumerProps<T> {
    children: (value: T) => ReactNode;
    unstable_observedBits?: number;
  }
  export interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
    displayName?: string;
  }
  export interface Provider<T> {
    (props: ProviderProps<T>): ReactElement<any> | null;
  }
  export interface Consumer<T> {
    (props: ConsumerProps<T>): ReactElement<any> | null;
  }
  export function createContext<T>(defaultValue: T): Context<T>;
  
  // Lazy loading
  export function lazy<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
  ): T;
  
  export interface SuspenseProps {
    children?: ReactNode;
    fallback: ReactNode;
  }
  export const Suspense: React.FC<SuspenseProps>;
  
  export type Reducer<S, A> = (prevState: S, action: A) => S;
  export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
  export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;
  export interface MutableRefObject<T> {
    current: T;
  }
  export type EffectCallback = () => (void | (() => void | undefined));
}

// Add additional TypeScript declarations as needed
declare module 'react' {
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    // more env variables...
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Declare global process variable for NODE_ENV
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  var process: {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  };
}
