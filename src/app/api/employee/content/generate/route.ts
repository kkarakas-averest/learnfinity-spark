import { NextRequest, NextResponse } from 'next/server';
import { employeeContentGeneratorService } from '@/services/employee-content-generator.service';
import { courseGenerationRequestSchema } from '@/services/agent-service';
import { getSupabase } from '@/lib/supabase';

/**
 * API route handler for generating personalized content for an employee
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const requestData = await req.json();
    const { employeeId, courseRequest } = requestData;
    
    // Validate employeeId
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    // Validate courseRequest using zod schema
    const validationResult = courseGenerationRequestSchema.safeParse(courseRequest);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid course request', details: validationResult.error },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const supabase = getSupabase();
    const { data: employee, error } = await supabase
      .from('hr_employees')
      .select('id, name')
      .eq('id', employeeId)
      .single();
      
    if (error || !employee) {
      return NextResponse.json(
        { error: `Employee with ID ${employeeId} not found` },
        { status: 404 }
      );
    }
    
    // Generate personalized course content
    const generatedCourse = await employeeContentGeneratorService.generatePersonalizedCourse(
      employeeId,
      courseRequest
    );
    
    // Return the generated course
    return NextResponse.json({
      success: true,
      course: generatedCourse,
      employee: {
        id: employee.id,
        name: employee.name
      }
    });
  } catch (error: any) {
    console.error('Error generating employee content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * API route handler for saving a generated course
 */
export async function PUT(req: NextRequest) {
  try {
    // Parse request body
    const requestData = await req.json();
    const { employeeId, course } = requestData;
    
    // Validate employeeId and course
    if (!employeeId || !course) {
      return NextResponse.json(
        { error: 'Employee ID and course data are required' },
        { status: 400 }
      );
    }
    
    // Save the generated course
    const result = await employeeContentGeneratorService.saveGeneratedCourse(
      employeeId,
      course
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save course' },
        { status: 500 }
      );
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      courseId: result.courseId,
      message: 'Course saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving generated course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save course' },
      { status: 500 }
    );
  }
} 