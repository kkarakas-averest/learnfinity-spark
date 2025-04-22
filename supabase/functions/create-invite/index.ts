// supabase/functions/create-invite/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Assuming a shared CORS config
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log(`Function "create-invite" up and running!`);

// Define input schema using Zod
const InvitePayloadSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  company_id: z.string().uuid({ message: "Invalid company ID format" }),
  role: z.enum(['H&R', 'L&D'], { message: "Role must be either 'H&R' or 'L&D'" })
});

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Set up Supabase client with SERVICE_ROLE key
    // IMPORTANT: Store keys securely in environment variables!
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } } // Essential for server-side
    );

    // 2. Check Authorization: Verify JWT and User Role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization Header');
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
        console.error('Auth Error:', userError);
        return new Response(JSON.stringify({ error: 'Authentication failed.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }

    // Check if the authenticated user is a super_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'super_admin') {
      console.error('Super Admin Check Failed:', profileError);
      return new Response(JSON.stringify({ error: 'Forbidden: User is not a Super Admin.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403, // Forbidden
      });
    }

    // 3. Parse and Validate Input Payload
    const payload = await req.json();
    const validationResult = InvitePayloadSchema.safeParse(payload);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input.', details: validationResult.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { email, company_id, role } = validationResult.data;

    // 4. Generate Invite Token and Expiry
    const invite_token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

    // 5. Insert Invite into Database
    const { error: insertError } = await supabaseAdmin
      .from('invites')
      .insert({
        email,
        company_id,
        role,
        invite_token,
        expires_at: expires_at.toISOString(),
        status: 'pending',
        // created_at defaults to now()
      });

    if (insertError) {
      console.error('DB Insert Error:', insertError);
      // Check for specific errors, e.g., duplicate email/pending invite for company?
      throw new Error(`Database error: ${insertError.message}`);
    }

    // 6. Send Invite Email using Resend
    // TODO: Implement actual email sending logic using Resend SDK/API
    const appUrl = Deno.env.get('YOUR_APP_URL') ?? 'http://localhost:5173'; // Get from env or default
    const acceptUrl = `${appUrl}/accept-invite?token=${invite_token}`;
    console.log(`---> Would send invite email to ${email} with link: ${acceptUrl}`);

    /*
    // Example Resend call (replace with actual implementation)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set. Skipping email.');
    } else {
      const resend = new Resend(resendApiKey);
      try {
        await resend.emails.send({
          from: 'Your App <noreply@yourdomain.com>', // Configure sender
          to: [email],
          subject: 'You are invited to join Your App!',
          html: `<h1>Invitation</h1><p>You have been invited to join company ID ${company_id} as a ${role}.</p><p>Click here to accept: <a href="${acceptUrl}">${acceptUrl}</a></p><p>This link expires in 7 days.</p>`,
        });
        console.log('Resend email sent successfully.');
      } catch (emailError) {
        console.error('Resend Error:', emailError);
        // Decide how to handle email failure - log it, but maybe don't fail the whole request?
        // Could add a status to the invite like 'pending_email_failed'
      }
    }
    */

    // 7. Return Success Response
    return new Response(JSON.stringify({ message: 'Invite created and email sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // Created
    });

  } catch (error) {
    console.error('Caught Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 