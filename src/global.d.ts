// React type declarations
declare module 'react' {
  export default React;
  export type ReactNode = React.ReactNode;
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useContext: typeof React.useContext;
  export const createContext: typeof React.createContext;
  export const lazy: typeof React.lazy;
  export const Suspense: typeof React.Suspense;
  export const forwardRef: typeof React.forwardRef;
  export const memo: typeof React.memo;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useReducer: typeof React.useReducer;
  export const useImperativeHandle: typeof React.useImperativeHandle;
  export const useLayoutEffect: typeof React.useLayoutEffect;
  export const useDebugValue: typeof React.useDebugValue;
}

// React Router DOM declarations
declare module 'react-router-dom' {
  export interface LinkProps {
    to: string;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const Link: React.FC<LinkProps>;
  export const useNavigate: () => (path: string | number) => void;
  export const useLocation: () => { pathname: string; search: string; hash: string; state: any };
  export const useParams: () => Record<string, string>;
  export const Navigate: React.FC<{ to: string; replace?: boolean; state?: any }>;
  export const Outlet: React.FC;
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

// Zod declarations
declare module 'zod' {
  export const z: {
    object: (schema: any) => any;
    string: () => any;
    number: () => any;
    boolean: () => any;
    array: (schema: any) => any;
    enum: (values: any) => any;
    nativeEnum: (values: any) => any;
    literal: (value: any) => any;
    infer: <T>(schema: any) => T;
  };
  
  export type infer<T> = T;
}

// React Hook Form declarations
declare module 'react-hook-form' {
  export const useForm: any;
  export const useFormContext: any;
  export const FormProvider: any;
  export const Controller: any;
  export type ControllerProps<T = any> = any;
  export type FieldValues = any;
  export type FieldPath<T> = any;
}

// Lucide React declarations
declare module 'lucide-react' {
  import * as React from 'react';
  
  // Common properties for all icons
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
  }

  // Define all the icons used in the project
  export const AlertCircle: React.FC<IconProps>;
  export const AlertTriangle: React.FC<IconProps>;
  export const ArrowLeft: React.FC<IconProps>;
  export const ArrowRight: React.FC<IconProps>;
  export const Activity: React.FC<IconProps>;
  export const Award: React.FC<IconProps>;
  export const BarChart2: React.FC<IconProps>;
  export const Book: React.FC<IconProps>;
  export const BookOpen: React.FC<IconProps>;
  export const Bookmark: React.FC<IconProps>;
  export const Building: React.FC<IconProps>;
  export const Building2: React.FC<IconProps>;
  export const BrainCircuit: React.FC<IconProps>;
  export const Calendar: React.FC<IconProps>;
  export const CalendarDays: React.FC<IconProps>;
  export const Check: React.FC<IconProps>;
  export const CheckCircle: React.FC<IconProps>;
  export const ChevronDown: React.FC<IconProps>;
  export const ChevronLeft: React.FC<IconProps>;
  export const ChevronRight: React.FC<IconProps>;
  export const ChevronUp: React.FC<IconProps>;
  export const Circle: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const Download: React.FC<IconProps>;
  export const Edit: React.FC<IconProps>;
  export const FileText: React.FC<IconProps>;
  export const FileBadge: React.FC<IconProps>;
  export const FileSpreadsheet: React.FC<IconProps>;
  export const GraduationCap: React.FC<IconProps>;
  export const Home: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
  export const Layers: React.FC<IconProps>;
  export const LayoutDashboard: React.FC<IconProps>;
  export const Library: React.FC<IconProps>;
  export const LogOut: React.FC<IconProps>;
  export const Loader2: React.FC<IconProps>;
  export const Menu: React.FC<IconProps>;
  export const MessageSquare: React.FC<IconProps>;
  export const MoreHorizontal: React.FC<IconProps>;
  export const PanelLeft: React.FC<IconProps>;
  export const Pencil: React.FC<IconProps>;
  export const PlayCircle: React.FC<IconProps>;
  export const Search: React.FC<IconProps>;
  export const Settings: React.FC<IconProps>;
  export const Shield: React.FC<IconProps>;
  export const Star: React.FC<IconProps>;
  export const Sparkles: React.FC<IconProps>;
  export const Target: React.FC<IconProps>;
  export const Trophy: React.FC<IconProps>;
  export const Upload: React.FC<IconProps>;
  export const User: React.FC<IconProps>;
  export const UserPlus: React.FC<IconProps>;
  export const Users: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
  export const Zap: React.FC<IconProps>;
}

// Clerk React declarations
declare module '@clerk/clerk-react' {
  export const useUser: () => {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: any;
  };
}

// Fix BadgeProps interface error
declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
    className?: string;
  }
  
  export const Badge: React.FC<BadgeProps>;
  export const badgeVariants: (props: { variant?: BadgeProps['variant'], className?: string }) => string;
}
