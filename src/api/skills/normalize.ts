import { normalizeSkill, normalizeSkills, NormalizationOptions, getNormalizationStats } from '../../lib/skills/normalizer';

export interface NormalizeSkillRequest {
  skill?: string;
  skills?: string[];
  options?: NormalizationOptions;
}

export interface NormalizeSkillResponse {
  success: boolean;
  result: any;
  stats?: any;
  error?: string;
}

/**
 * API endpoint for normalizing skills against the taxonomy
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse request body
    const body: NormalizeSkillRequest = await request.json();
    
    // Validate request
    if (!body.skill && (!body.skills || !Array.isArray(body.skills) || body.skills.length === 0)) {
      return new Response(
        JSON.stringify({
          success: false, 
          error: 'Request must include either a "skill" string or a "skills" array'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process request based on whether it's a single skill or batch
    if (body.skill) {
      // Single skill normalization
      const result = await normalizeSkill(body.skill, body.options);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          result 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (body.skills) {
      // Batch skill normalization
      const results = await normalizeSkills(body.skills, body.options);
      const stats = getNormalizationStats(results);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          result: results,
          stats
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Should never reach here due to validation above
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid request format' 
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in normalize skill API:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error normalizing skills'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 