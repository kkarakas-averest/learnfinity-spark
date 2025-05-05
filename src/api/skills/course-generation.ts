import { generateCourseContent, CourseGenerationParams, CourseGenerationResult } from '../../lib/skills/course-generation';
import { generateGapAnalysis } from '../../lib/skills/gap-analysis';

export interface CourseGenerationRequest {
  title: string;
  objectives?: string[];
  targetSkills?: string[];
  employeeId?: string;
  positionId?: string;
  employeeContext?: {
    id: string;
    name: string;
    position?: string;
    department?: string;
  };
  additionalContext?: string;
  format?: 'markdown' | 'html';
  length?: 'short' | 'medium' | 'long';
}

export interface CourseGenerationResponse {
  success: boolean;
  data?: CourseGenerationResult;
  error?: string;
}

/**
 * API endpoint for generating courses based on skills
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body: CourseGenerationRequest = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Course title is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Build generation parameters
    const params: CourseGenerationParams = {
      title: body.title,
      objectives: body.objectives,
      targetSkills: body.targetSkills,
      employeeContext: body.employeeContext,
      additionalContext: body.additionalContext,
      format: body.format,
      length: body.length
    };
    
    // If employeeId and positionId are provided, get skill gaps
    if (body.employeeId && body.positionId) {
      try {
        const gapAnalysis = await generateGapAnalysis(body.employeeId, body.positionId);
        
        // Add gap information to the params
        params.targetGaps = gapAnalysis.prioritized_gaps;
        
        // If employee context is not provided, add basic info from gap analysis
        if (!params.employeeContext && gapAnalysis.employee_skills.length > 0) {
          const firstSkill = gapAnalysis.employee_skills[0];
          params.employeeContext = {
            id: firstSkill.employee_id,
            name: 'Employee', // We don't have the name in the skill records
          };
        }
      } catch (gapError) {
        console.error('Error generating gap analysis:', gapError);
        // Continue without gap information
      }
    }
    
    // Generate course content
    const result = await generateCourseContent(params);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in course generation API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating course'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API endpoint for getting course generation details
 */
export async function GET(request: Request): Promise<Response> {
  // This endpoint could provide metadata about course generation capabilities
  // For now, just return a simple response
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        supported_formats: ['markdown', 'html'],
        supported_lengths: ['short', 'medium', 'long']
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
} 