
/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly [key: string]: string | undefined;
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_GROQ_API_KEY?: string;
    readonly VITE_ENABLE_LLM?: string;
    readonly VITE_SUPABASE_SERVICE_KEY?: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
  };
}

// Add missing Lucide icon declarations
declare module 'lucide-react' {
  export * from 'lucide-react/dist/esm/icons';
  export const CircleUserRound: React.FC<LucideProps>;
  export const PhoneCall: React.FC<LucideProps>;
  export const Video: React.FC<LucideProps>;
  export const DotsVertical: React.FC<LucideProps>;
  export const CaretRight: React.FC<LucideProps>;
  export const ChevronsLeft: React.FC<LucideProps>;
  export const ChevronsRight: React.FC<LucideProps>;
  export const ChevronsUpDown: React.FC<LucideProps>;
  export const Copy: React.FC<LucideProps>;
  export const Wrench: React.FC<LucideProps>;
  export const Filter: React.FC<LucideProps>;
  export const Key: React.FC<LucideProps>;
  export const Mail: React.FC<LucideProps>;
  export const ShieldCheck: React.FC<LucideProps>;
  export const AlertCircle: React.FC<LucideProps>;
  export const Info: React.FC<LucideProps>;
}
