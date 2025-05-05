import { 
  getPositionSkillRequirements, 
  addPositionSkillRequirement,
  removePositionSkillRequirement,
  updatePositionSkillRequirements,
  PositionSkillRequirement
} from '../../lib/skills/position-requirements';

export interface PositionRequirementsRequest {
  positionId: string;
  taxonomySkillId?: string;
  importanceLevel?: number;
  requiredProficiency?: number;
  requirements?: Array<{
    taxonomy_skill_id: string;
    importance_level: number;
    required_proficiency: number;
  }>;
  requirementId?: string;
  includeHierarchy?: boolean;
}

export interface PositionRequirementsResponse {
  success: boolean;
  data?: PositionSkillRequirement[] | any;
  error?: string;
}

/**
 * API endpoint for getting position skill requirements
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Parse URL params to get position ID
    const url = new URL(request.url);
    const positionId = url.searchParams.get('positionId');
    const includeHierarchy = url.searchParams.get('includeHierarchy') === 'true';
    
    if (!positionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Position ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get requirements for this position
    const requirements = await getPositionSkillRequirements(positionId, includeHierarchy);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: requirements
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in position requirements GET API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching position requirements'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API endpoint for adding or updating a position skill requirement
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body: PositionRequirementsRequest = await request.json();
    
    // Validate required fields
    if (!body.positionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Position ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle batch update if requirements array is provided
    if (body.requirements && Array.isArray(body.requirements) && body.requirements.length > 0) {
      const result = await updatePositionSkillRequirements(
        body.positionId,
        body.requirements
      );
      
      return new Response(
        JSON.stringify({
          success: result.success,
          data: result,
          error: result.error
        }),
        { 
          status: result.success ? 200 : 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Handle single requirement addition/update
    if (!body.taxonomySkillId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Taxonomy skill ID is required for single requirement update'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await addPositionSkillRequirement(
      body.positionId,
      body.taxonomySkillId,
      body.importanceLevel || 3,
      body.requiredProficiency || 3
    );
    
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
    console.error('Error in position requirements POST API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating position requirements'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API endpoint for removing a position skill requirement
 */
export async function DELETE(request: Request): Promise<Response> {
  try {
    // Parse URL params to get requirement ID
    const url = new URL(request.url);
    const requirementId = url.searchParams.get('requirementId');
    
    if (!requirementId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Requirement ID is required for deletion'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await removePositionSkillRequirement(requirementId);
    
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
    console.error('Error in position requirements DELETE API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting position requirement'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 