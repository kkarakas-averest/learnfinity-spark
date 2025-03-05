
// This file provides type augmentations for Lucide-React components
import type { LucideIcon } from 'lucide-react';

// Augment JSX namespace to allow Lucide icons as JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Add Lucide icons as valid JSX elements
      'lucide-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// Declare Lucide icons as valid JSX elements
declare module 'lucide-react' {
  // Ensure LucideIcon is properly usable in JSX context
  export interface LucideProps extends React.SVGAttributes<SVGElement> {
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  type LucideIconComponent = React.FC<LucideProps>;
  
  // Retype all exported icons to be valid JSX components
  export const ArrowDown: LucideIconComponent;
  export const ArrowUp: LucideIconComponent;
  export const BarChart2: LucideIconComponent;
  export const Book: LucideIconComponent;
  export const BrainCircuit: LucideIconComponent;
  export const Building: LucideIconComponent;
  export const Clock: LucideIconComponent;
  export const FileSpreadsheet: LucideIconComponent;
  export const GraduationCap: LucideIconComponent;
  export const Home: LucideIconComponent;
  export const Key: LucideIconComponent;
  export const Loader2: LucideIconComponent;
  export const LogOut: LucideIconComponent;
  export const Mail: LucideIconComponent;
  export const Menu: LucideIconComponent;
  export const Phone: LucideIconComponent;
  export const Plus: LucideIconComponent;
  export const ShieldCheck: LucideIconComponent;
  export const Trash2: LucideIconComponent;
  export const User: LucideIconComponent;
  export const UserCircle: LucideIconComponent;
  export const Users: LucideIconComponent;
  export const X: LucideIconComponent;
}
