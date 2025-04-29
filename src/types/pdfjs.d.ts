declare module 'pdfjs-dist/build/pdf' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  // Add other necessary exports based on pdfjs-dist usage, e.g., getDocument, etc.
  export function getDocument(...args: any[]): Promise<any>;  // Replace 'any' with specific types if known from docs, but here it's inferred safely
} 