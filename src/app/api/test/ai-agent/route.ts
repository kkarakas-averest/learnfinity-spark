import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '@/services/agent.service';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Schema for the test request
const TestRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  testType: z.enum(['learning_path', 'rag_status', 'intervention']),
  employeeEmail: z.string().email().optional(),
});

/**
 * Test endpoint for AI agent functionality
 * This enables testing the AI agents with real learner data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input
    const validation = TestRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { testType, userId, employeeEmail } = validation.data;
    
    // If no userId is provided but employeeEmail is, try to find the employee
    let userIdToUse = userId;
    
    if (!userIdToUse && employeeEmail) {
      // Find the employee by email
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('email', employeeEmail)
        .single();
      
      if (employeeError || !employee) {
        return NextResponse.json(
          { error: 'Employee not found with the provided email' },
          { status: 404 }
        );
      }
      
      userIdToUse = employee.id;
      
      // Get the employee-user mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('employee_user_mapping')
        .select('user_id')
        .eq('employee_id', userIdToUse)
        .single();
      
      if (!mappingError && mapping) {
        userIdToUse = mapping.user_id;
      } else {
        // Just use the employee ID if no mapping exists
        console.warn(`No user mapping found for employee ${userIdToUse}, using employee ID directly`);
      }
    }
    
    if (!userIdToUse) {
      return NextResponse.json(
        { error: 'No user ID could be determined. Provide either userId or employeeEmail.' },
        { status: 400 }
      );
    }
    
    // Get the agent service
    const agentService = new AgentService();
    
    // Handle the different test types
    switch (testType) {
      case 'learning_path': {
        // Get employee data for profile
        const { data: employee, error: employeeError } = await supabase
          .from('hr_employees')
          .select('*')
          .eq('id', userIdToUse)
          .single();
        
        if (employeeError) {
          return NextResponse.json(
            { error: 'Failed to fetch employee data', details: employeeError.message },
            { status: 500 }
          );
        }
        
        // Create a user profile from employee data
        const userProfile = {
          userId: userIdToUse,
          role: employee.title || 'Employee',
          department: employee.department || 'General',
          skills: [], // Ideally these would come from a skills table
        };
        
        // Generate a learning path
        const result = await agentService.generateLearningPath(userProfile);
        
        // Record the agent activity
        await supabase.from('agent_activities').insert({
          id: uuidv4(),
          user_id: userIdToUse,
          agent_type: 'personalization',
          agent_name: 'Learning Path Designer',
          activity_type: 'learning_path_generated',
          description: 'Generated personalized learning path via test API',
          metadata: {
            testRun: true,
            timestamp: new Date().toISOString(),
            result: result.success ? 'success' : 'failure',
          },
          timestamp: new Date()
        });
        
        return NextResponse.json(result);
      }
      
      case 'rag_status': {
        // Get enrollments for the user
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', userIdToUse);
        
        if (enrollmentsError) {
          return NextResponse.json(
            { error: 'Failed to fetch enrollments', details: enrollmentsError.message },
            { status: 500 }
          );
        }
        
        if (!enrollments || enrollments.length === 0) {
          return NextResponse.json(
            { error: 'No course enrollments found for this user' },
            { status: 404 }
          );
        }
        
        // Choose the first enrollment to analyze
        const enrollment = enrollments[0];
        
        // Determine RAG status
        const ragResult = await agentService.determineRAGStatus({
          enrollmentId: enrollment.id,
          userId: userIdToUse,
          courseId: enrollment.course_id,
          currentProgress: enrollment.progress || 0,
          recentActivity: enrollment.last_activity_at ? new Date(enrollment.last_activity_at) : null,
        });
        
        // Record the agent activity
        await supabase.from('agent_activities').insert({
          id: uuidv4(),
          user_id: userIdToUse,
          agent_type: 'analyzer',
          agent_name: 'Progress Monitor',
          activity_type: 'rag_status_determination',
          description: 'Analyzed course progress and determined RAG status via test API',
          metadata: {
            testRun: true,
            timestamp: new Date().toISOString(),
            result: ragResult.success ? 'success' : 'failure',
            enrollmentId: enrollment.id,
          },
          timestamp: new Date()
        });
        
        return NextResponse.json(ragResult);
      }
      
      case 'intervention': {
        // Get enrollments for the user that have amber or red status
        const { data: atRiskEnrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('user_id', userIdToUse)
          .in('rag_status', ['amber', 'red']);
        
        if (enrollmentsError) {
          return NextResponse.json(
            { error: 'Failed to fetch at-risk enrollments', details: enrollmentsError.message },
            { status: 500 }
          );
        }
        
        let enrollmentToUse;
        
        if (!atRiskEnrollments || atRiskEnrollments.length === 0) {
          // If no at-risk enrollments, use any enrollment
          const { data: anyEnrollment, error: anyError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('user_id', userIdToUse)
            .limit(1)
            .single();
          
          if (anyError || !anyEnrollment) {
            return NextResponse.json(
              { error: 'No course enrollments found for this user' },
              { status: 404 }
            );
          }
          
          // Set a temporary RAG status for testing
          enrollmentToUse = { ...anyEnrollment, rag_status: 'amber' };
        } else {
          // Use the first at-risk enrollment
          enrollmentToUse = atRiskEnrollments[0];
        }
        
        // Generate intervention recommendations
        const interventionResult = await agentService.suggestInterventions({
          userId: userIdToUse,
          enrollmentId: enrollmentToUse.id,
          courseId: enrollmentToUse.course_id,
          ragStatus: enrollmentToUse.rag_status || 'amber',
          progress: enrollmentToUse.progress || 0,
          lastActivity: enrollmentToUse.last_activity_at ? new Date(enrollmentToUse.last_activity_at) : null,
        });
        
        // Record the agent activity
        await supabase.from('agent_activities').insert({
          id: uuidv4(),
          user_id: userIdToUse,
          agent_type: 'educator',
          agent_name: 'Learning Coach',
          activity_type: 'intervention_recommendation',
          description: 'Generated intervention recommendations via test API',
          metadata: {
            testRun: true,
            timestamp: new Date().toISOString(),
            result: interventionResult.success ? 'success' : 'failure',
            enrollmentId: enrollmentToUse.id,
            ragStatus: enrollmentToUse.rag_status,
          },
          timestamp: new Date()
        });
        
        return NextResponse.json(interventionResult);
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in AI agent test endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process AI agent test', details: error.message },
      { status: 500 }
    );
  }
} 