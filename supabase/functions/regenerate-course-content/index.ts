
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, employeeId } = await req.json();

    // Sanity check input
    if (!courseId || !employeeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Read the Groq API key from edge function secrets
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY is not set in Supabase secrets.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Supabase client (use service_role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get course data
    const { data: course, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: 'Course not found.', details: courseError?.message }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get employee data (including CV)
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select('*, department:department_id (*), position:position_id (*), cv_extracted_data')
      .eq('id', employeeId)
      .single();
    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found', details: employeeError?.message }),
        { status: 404, headers: corsHeaders }
      );
    }
    if (!employee.cv_extracted_data) {
      return new Response(
        JSON.stringify({ error: 'No CV data. Please upload and process a CV first.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare personalization payload
    const payloadForGroq = {
      courseId,
      courseTitle: course.title,
      courseDescription: course.description,
      employeeId: employee.id,
      employeeName: employee.name,
      position: employee.position?.title || 'Unknown',
      department: employee.department?.name || 'Unknown',
      profileData: employee.cv_extracted_data
    };

    // Call Groq API for personalized content
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: 'system',
            content: "You are an expert educator. Generate personalized course content for the given employee using their CV data and the course description."
          },
          {
            role: 'user',
            content:
              `Course Title: ${payloadForGroq.courseTitle}
Course Description: ${payloadForGroq.courseDescription}
Employee Name: ${payloadForGroq.employeeName}
Position: ${payloadForGroq.position}
Department: ${payloadForGroq.department}
Profile Data: ${JSON.stringify(payloadForGroq.profileData, null, 2)}

TASK: Generate detailed personalized training modules tailored for the employee's role. Output as JSON with modules, objectives, and a personalized summary.`
          }
        ],
        temperature: 0.6,
        max_tokens: 3000
      })
    });

    if (!groqResponse.ok) {
      const errorDetail = await groqResponse.text();
      return new Response(
        JSON.stringify({ error: 'Groq API call failed', details: errorDetail }),
        { status: 500, headers: corsHeaders }
      );
    }

    const groqData = await groqResponse.json();
    const generatedContent = groqData.choices?.[0]?.message?.content;
    // Try to extract JSON from response (Groq responses are often text with JSON inside)
    let parsedContent = null;

    try {
      const match = generatedContent.match(/\{[\s\S]*?\}$/);
      parsedContent = match ? JSON.parse(match[0]) : null;
    } catch (_e) {}

    if (!parsedContent) {
      return new Response(
        JSON.stringify({ error: 'Could not parse AI-generated course JSON content.', raw: generatedContent }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Insert into hr_personalized_course_content table
    const insertRes = await supabase
      .from('hr_personalized_course_content')
      .insert({
        course_id: courseId,
        employee_id: employeeId,
        content: parsedContent,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (insertRes.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to save personalized content in DB', details: insertRes.error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: insertRes.data.id,
        contentId: insertRes.data.id,
        personalizedContent: parsedContent
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
