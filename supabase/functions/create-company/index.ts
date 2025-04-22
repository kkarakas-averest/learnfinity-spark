import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

console.log(`Function "create-company" up and running!`);

// Define input schema
const CompanyPayloadSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters." }),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Setup Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // 2. Check Authorization (Super Admin Only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization Header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) throw new Error('Authentication failed.');

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || profile?.role !== 'super_admin') {
      throw new Error('Forbidden: User is not a Super Admin.');
    }

    // 3. Validate Input
    const payload = await req.json();
    const validationResult = CompanyPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input.', details: validationResult.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const { name } = validationResult.data;

    // 4. TODO: Insert company into the database
    console.log(`---> TODO: Insert company named "${name}" into DB`);
    // const { data: newCompany, error: insertError } = await supabaseAdmin
    //   .from('companies')
    //   .insert({ name: name })
    //   .select() // Select the newly created company data
    //   .single(); // Expecting a single row back

    // if (insertError) {
    //   console.error('DB Insert Error:', insertError);
    //   throw new Error(`Database error: ${insertError.message}`);
    // }

    // Placeholder success data
    const newCompany = { id: crypto.randomUUID(), name: name, created_at: new Date().toISOString() };

    // 5. Return Success Response
    return new Response(JSON.stringify({ message: 'Company created successfully.', company: newCompany }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // Created
    });

  } catch (error) {
    console.error('Caught Error:', error);
    // Distinguish Forbidden/Auth errors from general errors
    const status = error.message.startsWith('Forbidden') ? 403 : error.message.includes('Auth') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
}); 