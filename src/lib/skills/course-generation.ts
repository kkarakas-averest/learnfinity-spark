import { supabase } from '../supabase';
import { generateGapAnalysis } from './gap-analysis';
import { formatSkillGapsForPrompt } from '../../lib/skills-utils';
import { GroqClient } from '../groq-client';

// Initialize Groq client if available
let groqClient: GroqClient | null = null;
try {
  groqClient = new GroqClient();
  console.log('Groq client initialized for course generation');
} catch (e) {
  console.warn('Could not initialize Groq client for course generation, using fallback generator');
}

export interface CourseModuleContent {
  title: string;
  content: string;
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }[];
  };
}

export interface SkillContext {
  id: string;
  name: string;
  description: string | null;
  keywords?: string[] | null;
  category: string | null;
  subcategory: string | null;
  group: string | null;
}

export interface CourseGenerationParams {
  title: string;
  targetSkills?: string[]; // Taxonomy skill IDs
  targetGaps?: {
    skill_name: string;
    proficiency_gap: number;
    importance_level: number;
  }[];
  objectives?: string[];
  employeeContext?: {
    id: string;
    name: string;
    position?: string;
    department?: string;
  };
  positionId?: string; // New: Generate course content based on position requirements
  additionalContext?: string;
  format?: 'markdown' | 'html';
  length?: 'short' | 'medium' | 'long';
}

export interface CourseGenerationResult {
  title: string;
  description: string;
  modules: CourseModuleContent[];
  totalModules: number;
  objectives: string[];
  skillsCovered: string[];
}

interface GroqGeneratedOutput {
  title: string;
  description: string;
  modules: CourseModuleContent[];
  objectives: string[];
}

const COURSE_GENERATION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          quiz: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { 
                      type: "array",
                      items: { type: "string" }
                    },
                    correctOptionIndex: { type: "number" },
                    explanation: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    objectives: {
      type: "array",
      items: { type: "string" }
    }
  }
};

// Function to fetch skill taxonomy data for a list of skill IDs
async function fetchSkillTaxonomyData(skillIds: string[]): Promise<any[]> {
  if (!skillIds.length) return [];
  
  const { data, error } = await supabase
    .from('skill_taxonomy_items')
    .select(`
      id,
      name,
      description,
      keywords,
      skill_taxonomy_groups (
        id,
        name,
        skill_taxonomy_subcategories (
          id,
          name,
          skill_taxonomy_categories (
            id,
            name
          )
        )
      )
    `)
    .in('id', skillIds);
    
  if (error) {
    console.error('Error fetching skill taxonomy data:', error);
    return [];
  }
  
  return data || [];
}

// Function to get position requirements, returns skill IDs and position details
async function getPositionRequirements(
  positionId: string
): Promise<{
  positionName: string;
  positionDescription: string;
  skillIds: string[];
  requirements: any[];
}> {
  try {
    // Get position details
    const { data: position, error: posError } = await supabase
      .from('hr_positions')
      .select('id, title, description, department_id')
      .eq('id', positionId)
      .single();
      
    if (posError) throw posError;
    
    // Get department name if available
    let departmentName = '';
    if (position.department_id) {
      const { data: dept } = await supabase
        .from('hr_departments')
        .select('name')
        .eq('id', position.department_id)
        .single();
      
      if (dept) departmentName = dept.name;
    }
    
    // Get position skill requirements
    const { data: requirements, error: reqError } = await supabase
      .from('position_skill_requirements')
      .select(`
        id,
        taxonomy_skill_id,
        importance_level,
        required_proficiency,
        skill_taxonomy_items (
          id,
          name,
          description
        )
      `)
      .eq('position_id', positionId);
      
    if (reqError) throw reqError;
    
    // Extract skill IDs
    const skillIds = requirements.map((req: any) => req.taxonomy_skill_id);
    
    return {
      positionName: position.title,
      positionDescription: position.description || `Position: ${position.title}${departmentName ? ` in ${departmentName} department` : ''}`,
      skillIds,
      requirements
    };
  } catch (error) {
    console.error('Error getting position requirements:', error);
    return {
      positionName: '',
      positionDescription: '',
      skillIds: [],
      requirements: []
    };
  }
}

/**
 * Generate a course based on skill gaps and taxonomy
 */
export async function generateCourseContent(
  params: CourseGenerationParams
): Promise<CourseGenerationResult> {
  try {
    if (!params.title) {
      throw new Error('Course title is required');
    }
    
    // Initialize default values
    const format = params.format || 'markdown';
    const length = params.length || 'medium';
    const objectives = params.objectives || [];
    let targetSkillIds = params.targetSkills || [];
    let targetGaps = params.targetGaps || [];
    
    // If position ID is provided, use position requirements
    if (params.positionId) {
      const positionData = await getPositionRequirements(params.positionId);
      
      // If we have employee context, we can generate a gap analysis
      if (params.employeeContext?.id && positionData.skillIds.length > 0) {
        const gapAnalysis = await generateGapAnalysis(
          params.employeeContext.id,
          params.positionId
        );
        
        // Use gap analysis to populate targetGaps if not already set
        if (targetGaps.length === 0 && gapAnalysis.prioritized_gaps.length > 0) {
          targetGaps = gapAnalysis.prioritized_gaps.map(gap => ({
            skill_name: gap.skill_name,
            proficiency_gap: gap.proficiency_gap,
            importance_level: gap.importance_level
          }));
        }
      }
      
      // Add position skill IDs to target skills if not already there
      if (positionData.skillIds.length > 0) {
        // Combine with existing target skills without duplicates
        const combinedSkillIds = new Set([...targetSkillIds, ...positionData.skillIds]);
        targetSkillIds = Array.from(combinedSkillIds);
        
        // Update params with position context if not already set
        if (!params.additionalContext) {
          params.additionalContext = `This course is designed for the ${positionData.positionName} position. ${positionData.positionDescription}`;
        }
      }
    }
    
    // Prepare skill context
    let skillContext: SkillContext[] = [];
    
    // If we have target skills, fetch their taxonomy data
    if (targetSkillIds.length > 0) {
      const taxonomyData = await fetchSkillTaxonomyData(targetSkillIds);
      skillContext = taxonomyData.map(skill => {
        const group = skill.skill_taxonomy_groups;
        const subcategory = group?.skill_taxonomy_subcategories;
        const category = subcategory?.skill_taxonomy_categories;
        
        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          keywords: skill.keywords,
          category: category?.name || null,
          subcategory: subcategory?.name || null,
          group: group?.name || null
        };
      });
    }
    
    // Create the prompt
    const skillDetailsText = skillContext.map(skill => {
      return `- ${skill.name}${skill.category ? ` (Category: ${skill.category})` : ''}${skill.description ? `\n  ${skill.description}` : ''}`;
    }).join('\n');
    
    let gapsText = '';
    if (targetGaps.length > 0) {
      gapsText = formatSkillGapsForPrompt(targetGaps);
    }
    
    const promptLength = length === 'short' ? '2-3' : length === 'medium' ? '4-5' : '6-8';
    
    const prompt = `
Generate a comprehensive professional course titled "${params.title}".

${params.additionalContext ? `Context: ${params.additionalContext}\n` : ''}
${params.employeeContext ? `This course is for ${params.employeeContext.name}${params.employeeContext.position ? ` who works as a ${params.employeeContext.position}` : ''}${params.employeeContext.department ? ` in the ${params.employeeContext.department} department` : ''}.` : ''}

${skillContext.length > 0 ? `The course should cover these skills:\n${skillDetailsText}\n` : ''}
${gapsText ? `Skill gaps to address:\n${gapsText}\n` : ''}
${objectives.length > 0 ? `Learning objectives:\n${objectives.map(obj => `- ${obj}`).join('\n')}\n` : ''}

Create a course with ${promptLength} modules, each with detailed content in ${format} format. For each module, include a quiz with 2-3 questions that test understanding of the material.

The first module should provide an introduction to the subject. Subsequent modules should cover the core concepts, practical applications, and advanced topics. The final module should provide a conclusion and recommendations for further learning.

Please provide the course title, description, module content, and quizzes.
`;

    // Generate with Groq if available
    if (groqClient) {
      const structuredOutput = await groqClient.generateWithStructuredOutput<GroqGeneratedOutput>({
        model: groqClient.models.LLAMA_3_70B,
        prompt,
        outputSchema: COURSE_GENERATION_SCHEMA,
        temperature: 0.7,
        max_tokens: 8000,
      });
      
      // Clean up and return the result
      return {
        title: structuredOutput.title,
        description: structuredOutput.description,
        modules: structuredOutput.modules,
        objectives: structuredOutput.objectives,
        totalModules: structuredOutput.modules.length,
        skillsCovered: skillContext.map(s => s.name)
      };
    }
    
    // Fallback for testing when Groq is not available
    return fallbackGenerateCourse(params, skillContext);
  } catch (error) {
    console.error('Error generating course content:', error);
    throw error;
  }
}

/**
 * Fallback course generation when Groq is not available
 */
function fallbackGenerateCourse(
  params: CourseGenerationParams, 
  skillContext: SkillContext[]
): CourseGenerationResult {
  return {
    title: params.title,
    description: `This is a course about ${params.title} focusing on ${skillContext.map(s => s.name).join(', ')}`,
    modules: [
      {
        title: 'Introduction',
        content: '# Introduction\n\nThis is a placeholder introduction module for the course.',
        quiz: {
          questions: [
            {
              question: 'What is this course about?',
              options: [
                'Machine Learning',
                params.title,
                'Cooking',
                'History'
              ],
              correctOptionIndex: 1,
              explanation: `This course covers ${params.title}`
            }
          ]
        }
      },
      {
        title: 'Core Concepts',
        content: '# Core Concepts\n\nThis is a placeholder for core concepts.',
        quiz: {
          questions: [
            {
              question: 'What will you learn in this module?',
              options: [
                'Advanced topics',
                'Code implementation',
                'Core concepts',
                'Historical background'
              ],
              correctOptionIndex: 2,
              explanation: 'This module covers the core concepts of the subject.'
            }
          ]
        }
      }
    ],
    totalModules: 2,
    objectives: params.objectives || ['Learn about the subject'],
    skillsCovered: skillContext.map(s => s.name)
  };
} 