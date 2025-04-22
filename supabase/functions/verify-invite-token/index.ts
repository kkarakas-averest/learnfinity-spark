import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log(`Function "verify-invite-token" up and running!`);

// Input schema
const VerifyPayloadSchema = z.object({
  token: z.string().uuid({ message: "Invalid token format" }),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Public client is okay here, RLS should handle security if accessing sensitive data
    // For just checking invites based on token, anon key *might* work if RLS allows it,
    // otherwise service_role is needed if RLS blocks anon reads entirely.
    // Using service_role is safer if unsure about RLS for anon reads on invites.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for reliable reads
      { auth: { persistSession: false } }
    );

    // Parse input
    const payload = await req.json();
    const validationResult = VerifyPayloadSchema.safeParse(payload);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input.', details: validationResult.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const { token } = validationResult.data;

    // Find the valid invite and fetch related company name
    const { data: inviteData, error: fetchError } = await supabaseAdmin
        .from('invites')
        .select(`
            email,
            role,
            companies ( name )
        `) // Select email, role, and company name via relationship
        .eq('invite_token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString()) // Ensure not expired
        .maybeSingle(); // Use maybeSingle as token should be unique

    if (fetchError) {
        console.error("DB fetch error:", fetchError);
        throw new Error("Database error checking invite token.");
    }

    if (!inviteData) {
        console.warn(`No valid pending invite found for token: ${token}`);
        return new Response(JSON.stringify({ error: 'Invite token is invalid, not found, or has expired.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404, // Not Found or Invalid
        });
    }

    // Extract company name (handle potential null if relationship fails)
    // This assumes the foreign key relationship is named 'companies'
    // Adjust if your foreign key relationship name is different
    const companyName = (inviteData as any).companies?.name ?? 'the designated company';

    // Return necessary details
    return new Response(
      JSON.stringify({
        email: inviteData.email,
        role: inviteData.role,
        company_name: companyName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Caught Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 