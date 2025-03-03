
/// <reference types="vite/client" />

// This file provides TypeScript type declarations for Vite's environment variables and other Vite-specific features.
// It complements the global.d.ts file which provides declarations for React, libraries, and our own components.

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
