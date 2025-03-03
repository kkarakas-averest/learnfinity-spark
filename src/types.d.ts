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
  export const Outlet: React.FC;
}

// Fix Badge component type issues
declare module '@/components/ui/badge' {
  export interface BadgeProps {
    className?: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
    children?: React.ReactNode;
  }
  
  export const Badge: React.FC<BadgeProps>;
  export const badgeVariants: (props: { variant?: BadgeProps['variant'], className?: string }) => string;
}

// Fix ProtectedRoute component type issues
declare module '@/components/ProtectedRoute' {
  export interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
  }
  
  export default function ProtectedRoute(props: ProtectedRouteProps): JSX.Element;
}

// Declare Sheet component types
declare module '@/components/ui/sheet' {
  export interface SheetProps {
    side?: "top" | "right" | "bottom" | "left";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }
  
  export const Sheet: React.FC<SheetProps>;
  export const SheetTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>;
  export const SheetContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { side?: SheetProps['side'] }>;
  export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const SheetClose: React.FC<React.HTMLAttributes<HTMLButtonElement>>;
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
    enumValues: (values: any) => any; // Changed from enum to enumValues
  };
  export function object(schema: any): any;
  export function string(): any;
  export function nativeEnum(values: any): any;
  export function boolean(): any;
  export function literal(value: any, options?: any): any;
  export function enumValues(values: any): any; // Changed from enum to enumValues
  
  export namespace z {
    export function string(): any;
    export function number(): any;
    export function boolean(): any;
    export function object(schema: any): any;
    export function array(schema: any): any;
    export function enumValues(values: any): any; // Changed from enum to enumValues
  }
}

// Fix HR Dashboard Overview types
declare module '/dev-server/src/services/hrEmployeeService' {
  export const hrEmployeeService: {
    getDashboardMetrics: () => Promise<{
      success: boolean;
      metrics: {
        totalEmployees: any;
        activeEmployees: any;
        inactiveEmployees: any;
        totalDepartments: any;
        recentHires: any;
        newEmployees: any;
        completionRate: any;
        completionRateChange: any;
        skillGaps: any;
        skillGapsChange: any;
        learningHours: any;
        learningHoursChange: any;
      };
      error?: string;
    } | {
      success: boolean;
      error: string;
      metrics?: undefined;
    }>;
    getRecentActivities: () => Promise<{
      success: boolean;
      activities: any[];
      error?: string;
    } | {
      success: boolean;
      error: string;
      activities?: undefined;
    }>;
  };
  
  export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    department: string;
    hire_date: string;
    location: string;
    manager?: string;
    skills?: string[];
  }
}

// Define DashboardTabs type
export interface Metadata {
  title: string;
  description: string;
}

// Fix Button type for asChild prop
declare module '@/components/ui/button' {
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
    children?: React.ReactNode;
  }
  
  export const Button: React.FC<ButtonProps>;
  export const buttonVariants: (props: { variant?: ButtonProps['variant'], size?: ButtonProps['size'], className?: string }) => string;
}

// Fix Alert type for success variant
declare module '@/components/ui/alert' {
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "success";
  }
  
  export const Alert: React.FC<AlertProps>;
  export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}
