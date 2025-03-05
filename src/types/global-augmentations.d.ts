
import { z as zodInstance } from 'zod';

declare global {
  namespace z {
    export const object: typeof zodInstance.object;
    export const string: typeof zodInstance.string;
    export const number: typeof zodInstance.number;
    export const boolean: typeof zodInstance.boolean;
    export const array: typeof zodInstance.array;
    export const infer: typeof zodInstance.infer;
    
    export type infer<T> = zodInstance.infer<T>;
  }

  // Add UserRole type to fix App.tsx error
  type UserRole = "learner" | "mentor" | "hr" | "superadmin" | "admin";
}

export {};
