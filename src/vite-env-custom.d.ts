
/// <reference types="vite/client" />

// Add explicit type declarations for Vite's import.meta.env
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_ENABLE_LLM?: string;
  readonly VITE_SUPABASE_SERVICE_KEY?: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  // Add other environment variables as needed
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
