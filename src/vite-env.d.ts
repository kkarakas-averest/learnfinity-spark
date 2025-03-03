
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
  export const ChevronRight: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ChevronLeft: Icon;
  export const Circle: Icon;
  export const RefreshCw: Icon;
  export const Calendar: Icon;
  export const FileText: Icon;
  export const Star: Icon;
  export const Sparkles: Icon;
  export const MoreHorizontal: Icon;
  export const MessageSquare: Icon;
  export const Building2: Icon;
  export const FileBadge: Icon;
  export const Library: Icon;
  export const Bot: Icon;
  export const Edit: Icon;
  export const PanelLeft: Icon;
  export const Dot: Icon;
  export const PlayCircle: Icon;
  export const Target: Icon;
  export const Trophy: Icon;
  export const CalendarDays: Icon;
  export const Pencil: Icon;
  export const Save: Icon;
  export const Shield: Icon;
  export const GripVertical: Icon;
  export const ArrowRight: Icon;
  export const ArrowUpRight: Icon;
  export const Search: Icon;
  export const LayoutDashboard: Icon;
}

// Add additional TypeScript declarations as needed
declare module 'react' {
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    // more env variables...
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Fix React imports
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

// Declare DOM types
declare global {
  interface Window {
    // Add any window properties here
  }
}
