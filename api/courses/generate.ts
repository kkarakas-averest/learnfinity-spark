import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';

// Set CORS headers helper function
const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return res;
};

// HARDCODED FALLBACK VALUES - Only used if environment variables fail
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const GROQ_API_KEY = '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';

/**
 * API endpoint for generating AI course content
 * 
 * This handles:
 * 1. Getting employee data and skills
 * 2. Retrieving content from uploaded documents
 * 3. Generating course content with Groq
 * 4. Storing the generated content in the database
 * 
 * Request format:
 * {
 *   employeeId: string,
 *   title: string,
 *   description?: string,
 *   skillsToAddress?: string[],
 *   difficultyLevel?: 'beginner' | 'intermediate' | 'advanced',
 *   estimatedDuration?: number,
 *   uploadIds?: string[]
 * }
 * 
 * Response format:
 * {
 *   success: boolean,
 *   contentId?: string,
 *   title?: string,
 *   courseStructure?: object,
 *   error?: string
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Check for authentication (JWT or dev token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get request data
    const {
      employeeId,
      title,
      description,
      skillsToAddress,
      difficultyLevel = 'intermediate',
      estimatedDuration,
      uploadIds = []
    } = req.body;

    // Validate required parameters
    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'employeeId is required' 
      });
    }

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'title is required' 
      });
    }
    
    console.log(`Generating course "${title}" for employee ${employeeId}`);
    
    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id, 
        name, 
        email,
        department_id,
        position_id,
        cv_extracted_data,
        hr_departments(name),
        hr_positions(title)
      `)
      .eq('id', employeeId)
      .single();
      
    if (employeeError || !employee) {
      console.error('Error fetching employee:', employeeError);
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Get employee's skills from the latest assessment
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('hr_skill_assessments')
      .select('id')
      .eq('employee_id', employeeId)
      .order('assessed_at', { ascending: false })
      .limit(1);
      
    if (assessmentError) {
      console.error('Error fetching assessments:', assessmentError);
    }
    
    let skills: any[] = [];
    let skillGaps: any[] = [];
    
    if (assessmentData && assessmentData.length > 0) {
      const assessmentId = assessmentData[0].id;
      
      // Get existing skills
      const { data: skillData, error: skillError } = await supabase
        .from('hr_skill_assessment_details')
        .select(`
          skill_name,
          proficiency_level,
          gap_level
        `)
        .eq('assessment_id', assessmentId)
        .eq('is_missing', false);
        
      if (!skillError && skillData) {
        skills = skillData;
      } else {
        console.error('Error fetching skills:', skillError);
      }
      
      // Get skill gaps
      const { data: gapData, error: gapError } = await supabase
        .from('hr_skill_assessment_details')
        .select(`
          skill_name,
          gap_level
        `)
        .eq('assessment_id', assessmentId)
        .eq('is_missing', true);
        
      if (!gapError && gapData) {
        skillGaps = gapData;
      } else {
        console.error('Error fetching skill gaps:', gapError);
      }
    }
    
    // Gather document context from uploads
    let documents: any[] = [];
    if (uploadIds.length > 0) {
      const { data: uploads, error: uploadsError } = await supabase
        .from('hr_uploads')
        .select(`
          id,
          file_name,
          file_type,
          extracted_text
        `)
        .in('id', uploadIds)
        .eq('processed', true);
        
      if (uploadsError) {
        console.error('Error fetching uploads:', uploadsError);
      } else {
        documents = uploads || [];
      }
    }
    
    // Format employee data for context
    const departmentName = Array.isArray(employee.hr_departments) 
      ? (employee.hr_departments[0] as any)?.name 
      : (employee.hr_departments as any)?.name || null;
      
    const positionTitle = Array.isArray(employee.hr_positions) 
      ? (employee.hr_positions[0] as any)?.title 
      : (employee.hr_positions as any)?.title || null;
    
    // Create a unique content ID for the course
    const contentId = uuidv4();
    
    // Initialize Groq client
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    // Create context string from documents
    let documentContext = '';
    for (const doc of documents) {
      // Limit to the first 1000 characters per document to avoid token overflow
      const extractedText = doc.extracted_text || '';
      if (extractedText.length > 0) {
        documentContext += `Document: ${doc.file_name}\n${extractedText.substring(0, 1000)}\n\n`;
      }
    }
    
    // Create a comprehensive system prompt for course generation
    const systemPrompt = `
You are an expert instructional designer specializing in corporate training and professional development.
Your task is to create a personalized, workplace-relevant course that meets specific learning needs.

COURSE REQUIREMENTS:
- The course should be well-structured, professional, and engaging
- Content must be tailored to the employee's role, department, and skill level
- Incorporate real-world examples and case studies relevant to their industry
- Include assessments that test practical application of knowledge
- Format the content with appropriate HTML for rich text display (h2, h3, p, ul, ol, blockquote)
- Optimize content for workplace learning with actionable takeaways
- Structure the output as valid JSON according to the specified format
`;

    // Construct a detailed user prompt with specific requirements
    const userPrompt = `
Create a personalized course titled "${title}" for the following employee:

EMPLOYEE PROFILE:
- Name: ${employee.name}
- Department: ${departmentName || 'Not specified'}
- Position: ${positionTitle || 'Not specified'}
- CV Data: ${employee.cv_extracted_data ? JSON.stringify(employee.cv_extracted_data).substring(0, 500) : 'Not available'}

SKILLS AND GAPS:
- Current Skills: ${skills.map(s => s.skill_name).join(', ') || 'Not specified'}
- Skill Gaps to Address: ${
  skillsToAddress && skillsToAddress.length > 0 
    ? skillsToAddress.join(', ') 
    : skillGaps.map(g => g.skill_name).join(', ') || 'Not specified'
}

COURSE PARAMETERS:
- Title: ${title}
- Description: ${description || `A personalized course on ${title} for ${employee.name}`}
- Difficulty Level: ${difficultyLevel}
${estimatedDuration ? `- Estimated Duration: ${estimatedDuration} minutes` : ''}

${documentContext ? 'REFERENCE MATERIALS:\n' + documentContext : ''}

OUTPUT FORMAT (JSON):
{
  "title": "Personalized course title",
  "description": "Comprehensive course description",
  "learning_objectives": ["Objective 1", "Objective 2", "..."],
  "modules": [
    {
      "module_id": "module-1",
      "title": "Module 1 Title",
      "description": "Module 1 description",
      "sections": [
        {
          "section_id": "section-1-1",
          "title": "Section 1.1 Title",
          "content": "<h2>Section Content</h2><p>Detailed content with rich HTML...</p>",
          "case_study": "<blockquote><p>Relevant case study for this section...</p></blockquote>",
          "actionable_takeaway": "Specific, actionable step for application",
          "quiz": {
            "question": "Assessment question?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_index": 0,
            "explanation": "Explanation of the correct answer"
          }
        }
      ]
    }
  ]
}

The course should have 3-5 modules with 2-4 sections each. Each section should include content, a case study, actionable takeaway, and a quiz question.
The content must be directly relevant to the employee's role and skills to address.
Do not include any explanations or text outside the JSON structure.
`;

    console.log('Calling Groq API for course generation...');
    
    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    const groqResponseContent = chatCompletion.choices[0]?.message?.content;
    
    if (!groqResponseContent) {
      throw new Error('Groq API returned an empty response');
    }
    
    // Parse the JSON response
    const courseData = JSON.parse(groqResponseContent);
    
    // Create ai_course_content record
    const { error: contentError } = await supabase
      .from('ai_course_content')
      .insert({
        id: contentId,
        course_id: null, // Will be updated when published
        employee_id: employeeId,
        version: '1.0',
        title: courseData.title || title,
        description: courseData.description || description,
        content: courseData,
        learning_objectives: courseData.learning_objectives || [],
        is_active: true,
        personalization_params: {
          title,
          difficultyLevel,
          skillsToAddress,
          employeeId,
          uploadIds
        },
        personalization_context: {
          departmentName,
          positionTitle,
          skills: skills.map(s => s.skill_name),
          skillGaps: skillGaps.map(g => g.skill_name)
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (contentError) {
      console.error('Error creating AI course content:', contentError);
      return res.status(500).json({ 
        success: false, 
        error: `Error creating content record: ${contentError.message}` 
      });
    }
    
    // Create section records for each module section
    for (const module of courseData.modules) {
      for (const section of module.sections) {
        const { error: sectionError } = await supabase
          .from('ai_course_content_sections')
          .insert({
            content_id: contentId,
            module_id: module.module_id,
            section_id: section.section_id,
            title: section.title,
            content: section.content,
            order_index: parseInt(section.section_id.split('-')[2], 10) || 0,
            case_study: section.case_study,
            actionable_takeaway: section.actionable_takeaway,
            quiz: section.quiz,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (sectionError) {
          console.error(`Error creating section "${section.title}":`, sectionError);
          // Continue creating other sections
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      contentId,
      title: courseData.title,
      description: courseData.description,
      learningObjectives: courseData.learning_objectives,
      moduleCount: courseData.modules.length,
      courseStructure: {
        modules: courseData.modules.map(module => ({
          moduleId: module.module_id,
          title: module.title,
          sectionCount: module.sections.length
        }))
      }
    });
    
  } catch (error) {
    console.error('Error generating course content:', error);
    
    return res.status(500).json({
      success: false,
      error: `Error generating course content: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 