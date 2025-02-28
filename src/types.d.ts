// Type declarations for missing modules and components

// Declare React module
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

// Declare react-router-dom
declare module 'react-router-dom' {
  export interface LinkProps {
    to: string;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const Link: React.FC<LinkProps>;
  export const useNavigate: () => (path: string) => void;
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

// Declare @hookform/resolvers/zod
declare module '@hookform/resolvers/zod' {
  export const zodResolver: any;
}

// Declare react-hook-form
declare module 'react-hook-form' {
  export const useForm: any;
}

// Declare zod
declare module 'zod' {
  export const z: any;
  export function object(schema: any): any;
  export function string(): any;
  export function nativeEnum(values: any): any;
  export function boolean(): any;
  export function literal(value: any, options?: any): any;
}

// Declare lucide-react
declare module 'lucide-react' {
  import * as React from 'react';
  export const Menu: React.FC<React.SVGProps<SVGSVGElement>>;
  export const X: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Book: React.FC<React.SVGProps<SVGSVGElement>>;
  export const GraduationCap: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Settings: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Home: React.FC<React.SVGProps<SVGSVGElement>>;
  export const User: React.FC<React.SVGProps<SVGSVGElement>>;
  export const LogOut: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArrowLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Loader2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const AlertCircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Info: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Check: React.FC<React.SVGProps<SVGSVGElement>>;
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