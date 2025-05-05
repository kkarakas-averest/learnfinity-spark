import { v4 as uuidv4 } from 'uuid';
import { getSupabaseServer } from '@/lib/supabase/server';
import { 
  extractSkillsFromResume, 
  normalizeResumeSkills, 
  saveEmployeeSkills, 
  ExtractedResumeData, 
  NormalizedResumeSkill 
} from '@/lib/skills/resume-extraction';

interface ResumeExtractRequest {
  employeeId: string;
  fileContent: string;
  fileType: string;
}

interface ResumeExtractResponse {
  success: boolean;
  data?: {
    extractedData: ExtractedResumeData;
    normalizedSkills: NormalizedResumeSkill[];
    savedCount: number;
  };
  error?: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    // Parse request body
    const body = await req.json() as ResumeExtractRequest;
    
    // Validate required fields
    if (!body.employeeId || !body.fileContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: employeeId and fileContent are required"
        }),
        { status: 400 }
      );
    }
    
    // Extract resume data
    const extractedData = await extractSkillsFromResume(
      body.fileContent, 
      body.fileType || 'txt',
      body.employeeId
    );
    
    // Normalize skills against taxonomy
    const normalizedSkills = await normalizeResumeSkills(extractedData.skills);
    
    // Save to database
    const { success, count } = await saveEmployeeSkills(
      body.employeeId,
      normalizedSkills
    );
    
    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to save skills to database"
        }),
        { status: 500 }
      );
    }
    
    // Return success response with data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          extractedData,
          normalizedSkills,
          savedCount: count
        }
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in resume skill extraction:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}

export async function GET(req: Request): Promise<Response> {
  // Return metadata about the API
  return new Response(
    JSON.stringify({
      success: true,
      supported_file_types: ['pdf', 'docx', 'txt'],
      requires_auth: true,
      endpoint_description: "Extract skills from resume content and normalize against taxonomy"
    }),
    { status: 200 }
  );
} 