// supabase/functions/_shared/cors.ts

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://learnfinity-spark.vercel.app', // Your frontend URL
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Methods your function uses
  'Access-Control-Allow-Credentials': 'true'
}; 