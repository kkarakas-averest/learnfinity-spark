
/**
 * Type declarations for HR utilities
 */

// Declare module for utils.js to provide the missing exports
declare module '@/lib/utils.js' {
  import { ClassValue } from 'clsx';
  
  export function cn(...inputs: ClassValue[]): string;
  export function formatDate(date: Date | string | number): string;
  export function formatCurrency(amount: number): string;
}

// Extend window with any runtime globals
interface Window {
  __HR_DEBUG__?: boolean;
}
