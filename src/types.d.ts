
// Type declarations for missing modules and components

// Declare React module with correct exports
declare module 'react' {
  export const useState: <T>(initialState: T | (() => T)) => [T, (newState: T | ((prevState: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: readonly any[]) => void;
  export const useContext: <T>(context: React.Context<T>) => T;
  export const createContext: <T>(defaultValue: T) => React.Context<T>;
  export const lazy: <T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) => T;
  export const Suspense: React.FC<{ fallback: React.ReactNode, children: React.ReactNode }>;
  export type ReactNode = React.ReactNode;
  export type FC<P = {}> = React.FC<P>;
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type ComponentPropsWithoutRef<T> = React.ComponentPropsWithoutRef<T>;
  export type ElementRef<T> = React.ElementRef<T>;
  export type HTMLAttributes<T = Element> = React.HTMLAttributes<T>;
  export type SVGProps<T = SVGSVGElement> = React.SVGProps<T>;
  export type ForwardRefExoticComponent<P> = React.ForwardRefExoticComponent<P>;
  export type RefAttributes<T> = React.RefAttributes<T>;
  export interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
    displayName?: string;
  }
  export interface Provider<T> {
    (props: { value: T; children?: React.ReactNode }): React.ReactElement;
  }
  export interface Consumer<T> {
    (props: { children: (value: T) => React.ReactNode }): React.ReactElement;
  }
  export * from 'react';
}

// Declare react-router-dom with needed exports
declare module 'react-router-dom' {
  export interface LinkProps {
    to: string;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const Link: React.FC<LinkProps>;
  export const useNavigate: () => (path: string) => void;
  export const useLocation: () => { pathname: string; search: string; hash: string; state: any };
  export const useParams: <T extends Record<string, string | undefined>>() => T;
  export const Navigate: React.FC<{ to: string; replace?: boolean }>;
  export const Route: React.FC<{
    path: string;
    element: React.ReactNode;
  }>;
  export const Routes: React.FC<{
    children: React.ReactNode;
  }>;
  export const BrowserRouter: React.FC<{
    children: React.ReactNode;
  }>;
}

// Declare lucide-react with needed icons
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
}

// Declare @hookform/resolvers/zod
declare module '@hookform/resolvers/zod' {
  export const zodResolver: any;
}

// Declare react-hook-form
declare module 'react-hook-form' {
  export const useForm: any;
  export const Controller: React.FC<any>;
  export type FieldPath<T> = string;
  export type FieldValues = Record<string, any>;
  export type ControllerProps<T extends FieldValues = FieldValues, U extends FieldPath<T> = FieldPath<T>> = {
    name: U;
    control?: any;
    defaultValue?: any;
    disabled?: boolean;
    rules?: any;
    render: (props: { field: any; fieldState: any; formState: any }) => React.ReactElement;
  };
}

// Declare zod
declare module 'zod' {
  export const z: {
    object: (schema: any) => any;
    string: () => any;
    nativeEnum: (values: any) => any;
    boolean: () => any;
    literal: (value: any, options?: any) => any;
    infer: <T>(schema: T) => any;
  };
  export function object(schema: any): any;
  export function string(): any;
  export function nativeEnum(values: any): any;
  export function boolean(): any;
  export function literal(value: any, options?: any): any;
}

// Fix Badge component type issues
declare module '@/components/ui/badge' {
  export interface BadgeProps {
    className?: string;
    variant?: string;
    children?: React.ReactNode;
  }
  
  export const Badge: React.FC<BadgeProps>;
}

// Fix ProtectedRoute component type issues
declare module '@/components/ProtectedRoute' {
  export interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
  }
  
  export default function ProtectedRoute(props: ProtectedRouteProps): JSX.Element;
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
