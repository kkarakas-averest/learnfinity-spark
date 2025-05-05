import { 
  generateGapAnalysis, 
  updateEmployeeSkill, 
  deleteEmployeeSkill,
  GapAnalysisResult 
} from '../../lib/skills/gap-analysis';

export interface GapAnalysisRequest {
  employeeId: string;
  positionId: string;
}

export interface UpdateEmployeeSkillRequest {
  employeeId: string;
  id?: string;
  taxonomy_skill_id?: string | null;
  raw_skill: string;
  proficiency: number;
  verified?: boolean;
  source?: string;
}

export interface DeleteEmployeeSkillRequest {
  skillId: string;
}

export interface GapAnalysisResponse {
  success: boolean;
  data?: GapAnalysisResult | any;
  error?: string;
}

/**
 * API endpoint for getting gap analysis between an employee and position
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Parse URL params to get employee and position IDs
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const positionId = url.searchParams.get('positionId');
    
    if (!employeeId || !positionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Employee ID and Position ID are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate gap analysis
    const analysis = await generateGapAnalysis(employeeId, positionId);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: analysis
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in gap analysis GET API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating gap analysis'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API endpoint for updating employee skills
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body: UpdateEmployeeSkillRequest = await request.json();
    
    // Validate required fields
    if (!body.employeeId || !body.raw_skill) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Employee ID and raw skill are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update or create employee skill
    const result = await updateEmployeeSkill(body.employeeId, {
      id: body.id,
      taxonomy_skill_id: body.taxonomy_skill_id,
      raw_skill: body.raw_skill,
      proficiency: body.proficiency,
      verified: body.verified,
      source: body.source
    });
    
    return new Response(
      JSON.stringify({
        success: result.success,
        data: { id: result.id },
        error: result.error
      }),
      { 
        status: result.success ? 200 : 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in employee skill update API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating employee skill'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API endpoint for deleting employee skills
 */
export async function DELETE(request: Request): Promise<Response> {
  try {
    // Parse URL params to get skill ID
    const url = new URL(request.url);
    const skillId = url.searchParams.get('skillId');
    
    if (!skillId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Skill ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete employee skill
    const result = await deleteEmployeeSkill(skillId);
    
    return new Response(
      JSON.stringify({
        success: result.success,
        error: result.error
      }),
      { 
        status: result.success ? 200 : 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in employee skill delete API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting employee skill'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 