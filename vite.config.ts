
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), ["VITE_", "NEXT_PUBLIC_"]);
  
  // Log available environment variables in development mode
  if (mode === 'development') {
    console.log('\n🌍 Environment Variables Loaded in Vite Config:');
    Object.keys(env).forEach(key => {
      if (key.includes('SUPABASE') || key.includes('GROQ')) {
        console.log(`- ${key}: ${key.includes('KEY') ? '******' : env[key]}`);
      }
    });
  }
  
  // Handle Supabase URL fallback if missing
  if (!env.VITE_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL) {
    env.VITE_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
    console.log('Using NEXT_PUBLIC_SUPABASE_URL as fallback for VITE_SUPABASE_URL');
  }
  
  // Handle Supabase anon key fallback if missing
  if (!env.VITE_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    env.VITE_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('Using NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback for VITE_SUPABASE_ANON_KEY');
  }
  
  return {
    plugins: [
      react({ 
        // Explicitly set JSX runtime to 'automatic'
        jsxRuntime: 'automatic',
        // Ensure React refresh works properly
        include: '**/*.{jsx,tsx}',
      }),
      mode === 'development' && componentTagger(),
      tsconfigPaths()
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3084',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    // Make environment variables available at build time
    define: {
      // Ensure Next.js-style environment variables are also available
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      'process.env.NEXT_PUBLIC_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY || env.NEXT_PUBLIC_GROQ_API_KEY || ''),
      'process.env.NEXT_PUBLIC_ENABLE_LLM': JSON.stringify(env.VITE_ENABLE_LLM || env.NEXT_PUBLIC_ENABLE_LLM || ''),
    }
  };
});
