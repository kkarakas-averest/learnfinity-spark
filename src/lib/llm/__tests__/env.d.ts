interface ImportMetaEnv {
  MODE: string;
  VITE_APP_NAME: string;
  VITE_DEBUG: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GROQ_API_KEY: string;
  VITE_ENABLE_LLM: string;
  VITE_ENABLE_BATCH_PROCESSING: string;
  VITE_ENABLE_NOTIFICATIONS: string;
  VITE_BATCH_SIZE: string;
  VITE_MAX_CONCURRENT_REQUESTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 