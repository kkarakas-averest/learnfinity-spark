import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentFactory } from '@/agents/AgentFactory';

/**
 * API endpoint to process an employee's CV and generate a profile summary
 * POST /api/hr/employees/process-cv
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { employeeId, cvUrl } = body;
    
    if (!employeeId || !cvUrl) {
      return NextResponse.json(
        { error: 'Employee ID and CV URL are required' }, 
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select('*')
      .eq('id', employeeId)
      .single();
      
    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found', details: employeeError?.message }, 
        { status: 404 }
      );
    }
    
    // Initialize the AI agent for processing
    const agentFactory = AgentFactory.getInstance();
    const contentAgent = agentFactory.createAgent('educator') as any;
    
    // Create a prompt for CV analysis and profile summary generation
    const prompt = `
      I need you to analyze this employee's CV/resume and create a professional profile summary.
      
      CV URL: ${cvUrl}
      Employee Name: ${employee.name}
      Position: ${employee.position_id ? 'To be extracted from CV' : ''}
      Department: ${employee.department_id ? 'To be extracted from CV' : ''}
      
      Please extract the key information from the CV and create a 250-word professional profile summary.
      The summary should include:
      1. Professional background
      2. Key skills and expertise
      3. Experience highlights
      4. Educational background
      5. Career achievements
      
      Format the summary as a single paragraph that highlights the employee's strengths and expertise.
      The tone should be professional and concise.
    `;
    
    try {
      // Generate the profile summary
      const generatedSummary = await contentAgent.complete(prompt, {
        max_tokens: 500,
        temperature: 0.7
      });
      
      // If we couldn't generate a summary, create a basic one
      const summary = generatedSummary || 
        `${employee.name} is a professional in the ${employee.department || 'organization'}. Their CV has been uploaded and is available for review.`;
      
      // Store the summary in the database
      const { error: updateError } = await supabase
        .from('hr_employees')
        .update({
          cv_extracted_data: { 
            summary,
            extraction_date: new Date().toISOString(),
            source: 'ai_generated'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);
        
      if (updateError) {
        console.error('Error updating employee with CV data:', updateError);
        return NextResponse.json(
          { error: 'Failed to save profile summary', details: updateError.message }, 
          { status: 500 }
        );
      }
      
      // Create a record of the CV extraction
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: cvUrl,
          extracted_data: { summary },
          extraction_status: 'completed'
        });
      
      return NextResponse.json({
        success: true,
        message: 'CV processed and profile summary generated',
        summary
      });
    } catch (aiError: any) {
      console.error('Error generating profile summary:', aiError);
      
      // Store a record of the failed attempt
      await supabase
        .from('hr_employee_cv_extractions')
        .insert({
          employee_id: employeeId,
          original_file_url: cvUrl,
          extraction_status: 'failed',
          extracted_data: { error: aiError.message }
        });
      
      return NextResponse.json(
        { error: 'Failed to generate profile summary', details: aiError.message }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing CV:', error);
    return NextResponse.json(
      { error: 'Failed to process CV', details: error.message }, 
      { status: 500 }
    );
  }
} 