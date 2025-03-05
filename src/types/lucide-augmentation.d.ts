/**
 * Lucide-React module augmentations to fix icon import errors
 */

declare module 'lucide-react' {
  import * as React from 'react';
  export type Icon = React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  
  // Add the missing icons that were causing errors
  export const UserCircle: Icon;
  export const Phone: Icon;
  export const Mail: Icon;
  export const Key: Icon;
  export const ShieldCheck: Icon;
  
  // Keep the existing icons
  export const Users: Icon;
  export const BookOpen: Icon;
  export const BarChart2: Icon;
  export const LogOut: Icon;
  export const AlertCircle: Icon;
  export const Clock: Icon;
  export const UserPlus: Icon;
  export const FileText: Icon;
  export const Activity: Icon;
  export const AlertTriangle: Icon;
  export const Award: Icon;
  export const CheckCircle: Icon;
  export const MessageSquare: Icon;
}
