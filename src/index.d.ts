// Global type declarations to fix import issues

// Fix React import issues
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
  
  // Export specific hooks that are commonly used
  export const useState: typeof React.useState;
  export const useEffect: typeof React.useEffect;
  export const useContext: typeof React.useContext;
  export const useRef: typeof React.useRef;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useReducer: typeof React.useReducer;
}

// Fix Lucide-React icon imports
declare module 'lucide-react' {
  import * as React from 'react';
  
  // Add missing icon exports
  export const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronDown: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronUp: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Circle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const BarChart2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const RefreshCw: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Calendar: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FileText: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Star: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Sparkles: React.FC<React.SVGProps<SVGSVGElement>>;
  export const MoreHorizontal: React.FC<React.SVGProps<SVGSVGElement>>;
  export const MessageSquare: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Building: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Building2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const BrainCircuit: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FileSpreadsheet: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FileBadge: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Library: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Bot: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Edit: React.FC<React.SVGProps<SVGSVGElement>>;
  export const PanelLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Dot: React.FC<React.SVGProps<SVGSVGElement>>;
  export const PlayCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Target: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Trophy: React.FC<React.SVGProps<SVGSVGElement>>;
  export const CalendarDays: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Pencil: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Save: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Shield: React.FC<React.SVGProps<SVGSVGElement>>;
  export const GripVertical: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArrowRight: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArrowUpRight: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Upload: React.FC<React.SVGProps<SVGSVGElement>>;
  export const CheckCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const AlertCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Trash2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const LifeBuoy: React.FC<React.SVGProps<SVGSVGElement>>;
  export const LogOut: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Users: React.FC<React.SVGProps<SVGSVGElement>>;
  export const BookOpen: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Activity: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Fix react-hook-form module
declare module 'react-hook-form' {
  export const useForm: any;
  export const Controller: any;
  export type ControllerProps = any;
  export type FieldPath = any;
  export type FieldValues = any;
  export const FormProvider: any;
  export const useFormContext: any;
}

// Fix zod module
declare module 'zod' {
  export const z: any;
  export namespace z {
    export function string(): any;
    export function object(schema: any): any;
    export function infer(schema: any): any;
    export function union(schemas: any[]): any;
    export function discriminatedUnion(discriminator: string, schemas: any[]): any;
  }
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

// Fix @clerk/clerk-react declaration
declare module '@clerk/clerk-react' {
  export const useUser: () => {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: {
      id: string;
      fullName: string;
      imageUrl: string;
      firstName: string;
      lastName: string;
    } | null;
  };
}
