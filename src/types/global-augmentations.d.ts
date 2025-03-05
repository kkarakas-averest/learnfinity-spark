
/**
 * Global type augmentations
 */

// For modules that might be missing default exports
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Fix for duplicate identifiers by declaring the interfaces once
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: import('@/lib/database.types').UserRole[];
}

// Fix for zod namespace not found
declare namespace z {
  function object(schema: any): any;
  function string(): any;
  function email(message?: string): any;
  function min(min: number, message?: string): any;
  const ZodIssueCode: any;
}
