import { NextResponse } from 'next/server';

// This endpoint provides runtime environment variables that
// might not be available during client-side initialization
export async function GET() {
  // Only expose NEXT_PUBLIC_ and VITE_ variables as they're meant to be client-accessible
  const publicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null,
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || null,
    NEXT_PUBLIC_ENABLE_LLM: process.env.NEXT_PUBLIC_ENABLE_LLM || process.env.VITE_ENABLE_LLM || null,
    // Add fallbacks for Vite variables too
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
    VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || null,
    VITE_ENABLE_LLM: process.env.VITE_ENABLE_LLM || process.env.NEXT_PUBLIC_ENABLE_LLM || null,
  };
  
  // Add cache control headers to prevent caching
  // This ensures we always get fresh values
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  };
  
  console.log('Runtime environment endpoint called. Available vars:', {
    supabaseUrl: !!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !!publicEnv.VITE_SUPABASE_URL,
    supabaseKey: !!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!publicEnv.VITE_SUPABASE_ANON_KEY,
    groqKey: !!publicEnv.NEXT_PUBLIC_GROQ_API_KEY || !!publicEnv.VITE_GROQ_API_KEY,
    enableLlm: !!publicEnv.NEXT_PUBLIC_ENABLE_LLM || !!publicEnv.VITE_ENABLE_LLM
  });
  
  return NextResponse.json(publicEnv, { headers });
} 