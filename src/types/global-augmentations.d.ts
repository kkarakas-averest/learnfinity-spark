
// This file provides global type augmentations

// Define 'z' namespace for zod validation schemas
declare namespace z {
  export function object(schema: any): any;
  export function string(): any;
  export function email(): any;
  export function password(): any;
  export function min(length: number, message?: string): any;
}

// Define UserRole type
declare type UserRole = 'learner' | 'admin' | 'superadmin';

// Add missing utility functions
declare module '@/lib/utils' {
  export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number): F;
}
