
declare module 'lucide-react' {
  import { ComponentType } from 'react';
  // Base type for all icons
  export interface LucideIcon extends ComponentType<{
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    className?: string;
  }> {}

  // Export all required icons
  export const UserCircle: LucideIcon;
  export const Phone: LucideIcon;
  export const Mail: LucideIcon;
  export const Key: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const Users: LucideIcon;
  export const BookOpen: LucideIcon;
  export const BarChart2: LucideIcon;
  export const LogOut: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Loader2: LucideIcon;
  export const Clock: LucideIcon;
  export const UserPlus: LucideIcon;
  export const FileText: LucideIcon;
  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Award: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
}
