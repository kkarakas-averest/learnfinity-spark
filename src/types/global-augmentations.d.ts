
// Global type augmentations for libraries like zod
declare module 'zod' {
  export interface ZodType<T = any> {
    _type: T;
  }
  
  export interface ZodString extends ZodType<string> {
    email: (message?: string) => ZodString;
    min: (length: number, message?: string) => ZodString;
  }
  
  export interface ZodObject<T extends ZodRawShape> extends ZodType<T> {
    shape: T;
  }
  
  export interface ZodRawShape {
    [key: string]: ZodType;
  }
  
  export function string(): ZodString;
  export function object(shape: ZodRawShape): ZodObject<ZodRawShape>;
  export function infer<T extends ZodType>(schema: T): T["_type"];

  export namespace z {
    export const string: typeof string;
    export const object: typeof object;
    export const infer: typeof infer;
    export type TypeOf<T extends ZodType> = T["_type"];
  }
}

// Prevent duplicate declarations
declare global {
  // Add any global declarations here
}
