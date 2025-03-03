
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
}
