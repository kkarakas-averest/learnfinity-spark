
// Global type declarations for the application

// React module declarations
declare module 'react' {
  // Re-export everything from React
  export * from 'react';
  
  // Explicitly export hooks and types that are commonly used
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useCallback: any;
  export const useMemo: any;
  export const useContext: any;
  export const createContext: any;
  export type ReactNode = any;
  export const Fragment: any;
  export const Suspense: any;
  export const lazy: any;
  export const forwardRef: any;
  
  // Default export
  const React: any;
  export default React;
}

// Lucide React icon declarations
declare module 'lucide-react' {
  import * as React from 'react';
  
  // Base icon props
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }

  // Export all available icons
  export const BarChart2: React.FC<IconProps>;
  export const ChevronDown: React.FC<IconProps>;
  export const ChevronLeft: React.FC<IconProps>;
  export const ChevronRight: React.FC<IconProps>;
  export const ChevronUp: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const Menu: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
  export const Book: React.FC<IconProps>;
  export const GraduationCap: React.FC<IconProps>;
  export const Settings: React.FC<IconProps>;
  export const Home: React.FC<IconProps>;
  export const User: React.FC<IconProps>;
  export const LogOut: React.FC<IconProps>;
  export const ArrowLeft: React.FC<IconProps>;
  export const Loader2: React.FC<IconProps>;
  export const AlertCircle: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
  export const Check: React.FC<IconProps>;
  export const Users: React.FC<IconProps>;
  export const BookOpen: React.FC<IconProps>;
  export const LayoutDashboard: React.FC<IconProps>;
  export const Library: React.FC<IconProps>;
  export const ArrowRight: React.FC<IconProps>;
  export const Filter: React.FC<IconProps>;
  export const Search: React.FC<IconProps>;
  export const Calendar: React.FC<IconProps>;
  export const CalendarDays: React.FC<IconProps>;
  export const Target: React.FC<IconProps>;
  export const Trophy: React.FC<IconProps>;
  export const Star: React.FC<IconProps>;
  export const Sparkles: React.FC<IconProps>;
  export const FileText: React.FC<IconProps>;
  export const Building: React.FC<IconProps>;
  export const BrainCircuit: React.FC<IconProps>;
  export const FileSpreadsheet: React.FC<IconProps>;
  export const Circle: React.FC<IconProps>;
  export const MessageSquare: React.FC<IconProps>;
  export const Pencil: React.FC<IconProps>;
  export const Save: React.FC<IconProps>;
  export const Shield: React.FC<IconProps>;
  export const Building2: React.FC<IconProps>;
  export const PlayCircle: React.FC<IconProps>;
  export const Dot: React.FC<IconProps>;
  export const MoreHorizontal: React.FC<IconProps>;
  export const PanelLeft: React.FC<IconProps>;
  export const Bot: React.FC<IconProps>;
  export const Edit: React.FC<IconProps>;
  export const FileBadge: React.FC<IconProps>;
}

// React-hook-form declarations
declare module 'react-hook-form' {
  export const useForm: any;
  export const Controller: any;
  export interface ControllerProps {
    name: string;
    control: any;
    defaultValue?: any;
    rules?: any;
    render: (props: any) => React.ReactNode;
  }
  export type FieldValues = Record<string, any>;
  export type FieldPath<T> = string;
  export const FormProvider: any;
  export const useFormContext: any;
}

// Zod declarations
declare module 'zod' {
  export const z: any;
  export function object(schema: any): any;
  export function string(): any;
  export function number(): any;
  export function boolean(): any;
  export function array(schema: any): any;
  export function nativeEnum(values: any): any;
  export function literal(value: any): any;
  export type infer<T> = any;
}

// Clerk declarations
declare module '@clerk/clerk-react' {
  export const useUser: () => {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: any;
  };
}

// Enhanced Badge interface
declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
    className?: string;
  }
  
  export const Badge: React.FC<BadgeProps>;
  export const badgeVariants: (props: { variant?: BadgeProps['variant'], className?: string }) => string;
}
