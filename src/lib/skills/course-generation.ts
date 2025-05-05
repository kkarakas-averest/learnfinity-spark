import { supabase } from '../supabase';
import { SkillGap } from './gap-analysis';

// Check if groq.ts exists
let groqClient: any;
try {
  const { generateWithStructuredOutput, GroqModels } = require('../groq');
  groqClient = { generateWithStructuredOutput, models: GroqModels };
} catch (error) {
  console.error('Error importing Groq client:', error);
  groqClient = null;
}

export interface CourseGenerationParams {
  title: string;
  objectives?: string[];
  targetSkills?: string[]; // Taxonomy skill IDs
  targetGaps?: SkillGap[]; // Skills gaps from gap analysis
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

export interface CourseModuleContent {
  title: string;
  content: string;
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }>;
  }
}

export interface CourseGenerationResult {
  title: string;
  description: string;
  modules: CourseModuleContent[];
  totalModules: number;
  objectives: string[];
  skillsCovered: string[];
}

// Taxonomy data structure types for the query result
interface TaxonomyData {
  id: string;
  name: string;
  description: string | null;
  keywords: any;
  group_id: string;
  skill_taxonomy_groups: {
    id: string;
    name: string;
    description: string | null;
    subcategory_id: string;
    skill_taxonomy_subcategories: {
      id: string;
      name: string;
      description: string | null;
      category_id: string;
      skill_taxonomy_categories: {
        id: string;
        name: string;
        description: string | null;
      }
    }
  }
}

interface SkillContext {
  id: string;
  name: string;
  description: string | null;
  keywords?: any;
  category?: string | null;
  subcategory?: string | null;
  group?: string | null;
  gapInfo?: {
    skill: string;
    category: string;
    subcategory: string;
    group: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
    importance: number;
  };
}

/**
 * Fetch skill taxonomy data by IDs
 */
async function fetchSkillTaxonomyData(skillIds: string[]): Promise<TaxonomyData[]> {
  if (!skillIds || skillIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('skill_taxonomy_items')
    .select(`
      id,
      name,
      description,
      keywords,
      group_id,
      skill_taxonomy_groups!inner (
        id,
        name,
        description,
        subcategory_id,
        skill_taxonomy_subcategories!inner (
          id,
          name,
          description,
          category_id,
          skill_taxonomy_categories!inner (
            id,
            name,
            description
          )
        )
      )
    `)
    .in('id', skillIds);
    
  if (error) {
    console.error('Error fetching skill taxonomy data:', error);
    return [];
  }
  
  return data as TaxonomyData[] || [];
}

/**
 * Transform skill gaps to a structured format for the LLM prompt
 */
function formatSkillGapsForPrompt(gaps: SkillGap[]) {
  if (!gaps || gaps.length === 0) return [];
  
  return gaps.map(gap => ({
    skill: gap.skill_name,
    category: gap.category_name || 'Uncategorized',
    subcategory: gap.subcategory_name || 'Uncategorized',
    group: gap.group_name || 'Uncategorized',
    currentLevel: gap.current_proficiency || 0,
    requiredLevel: gap.required_proficiency,
    gap: gap.proficiency_gap,
    importance: gap.importance_level,
  }));
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
    const targetSkillIds = params.targetSkills || [];
    const targetGaps = params.targetGaps || [];
    
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
    
    // If we have target gaps, format them for the prompt
    if (targetGaps.length > 0) {
      const gapContext = formatSkillGapsForPrompt(targetGaps);
      
      // If we don't have skill context yet, use the gaps to provide context
      if (skillContext.length === 0) {
        // Get unique skill IDs from gaps
        const gapSkillIds = [...new Set(targetGaps.map(gap => gap.taxonomy_skill_id))];
        const taxonomyData = await fetchSkillTaxonomyData(gapSkillIds);
        
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
            group: group?.name || null,
            gapInfo: gapContext.find(gap => gap.skill === skill.name)
          };
        });
      } else {
        // Enhance existing skill context with gap information
        skillContext = skillContext.map(skill => ({
          ...skill,
          gapInfo: gapContext.find(gap => gap.skill === skill.name)
        }));
      }
    }
    
    // Prepare Groq prompt
    const prompt = buildCourseGenerationPrompt({
      title: params.title,
      objectives,
      skillContext,
      employeeContext: params.employeeContext,
      additionalContext: params.additionalContext,
      format,
      length
    });
    
    // Generate with Groq if available
    if (groqClient) {
      const structuredOutput = await groqClient.generateWithStructuredOutput({
        model: groqClient.models.LLAMA_3_70B,
        prompt,
        outputSchema: COURSE_GENERATION_SCHEMA,
        temperature: 0.7,
        max_tokens: 8000,
      });
      
      // Clean up and return the result
      return {
        ...structuredOutput,
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
 * Build the prompt for course generation with taxonomy context
 */
function buildCourseGenerationPrompt(options: {
  title: string;
  objectives: string[];
  skillContext: SkillContext[];
  employeeContext?: any;
  additionalContext?: string;
  format: 'markdown' | 'html';
  length: 'short' | 'medium' | 'long';
}) {
  const { title, objectives, skillContext, employeeContext, additionalContext, format, length } = options;
  
  // Define module count based on length
  const moduleCount = length === 'short' ? '3-4' : length === 'medium' ? '5-7' : '8-10';
  
  // Format objectives
  const objectivesText = objectives.length > 0 
    ? objectives.map(obj => `- ${obj}`).join('\n')
    : 'No specific objectives provided, please create appropriate learning objectives.';
  
  // Format skill context
  const skillContextText = skillContext.length > 0
    ? skillContext.map(skill => {
        let text = `- ${skill.name}: ${skill.description || 'No description available'}`;
        if (skill.category) text += `\n  Category: ${skill.category}`;
        if (skill.subcategory) text += `\n  Subcategory: ${skill.subcategory}`;
        if (skill.group) text += `\n  Group: ${skill.group}`;
        if (skill.keywords) text += `\n  Keywords: ${Array.isArray(skill.keywords) ? skill.keywords.join(', ') : JSON.stringify(skill.keywords)}`;
        if (skill.gapInfo) {
          text += `\n  Current Level: ${skill.gapInfo.currentLevel}/5`;
          text += `\n  Required Level: ${skill.gapInfo.requiredLevel}/5`;
          text += `\n  Gap: ${skill.gapInfo.gap} levels`;
          text += `\n  Importance: ${skill.gapInfo.importance}/5`;
        }
        return text;
      }).join('\n\n')
    : 'No specific skills provided, please create content that would be appropriate for the course title and objectives.';
  
  // Format employee context
  let employeeContextText = '';
  if (employeeContext) {
    employeeContextText = `## Employee Context\n`;
    employeeContextText += `Name: ${employeeContext.name}\n`;
    if (employeeContext.position) employeeContextText += `Position: ${employeeContext.position}\n`;
    if (employeeContext.department) employeeContextText += `Department: ${employeeContext.department}\n`;
  }
  
  // Build the complete prompt
  return `
# Course Generation Task

You are tasked with creating a comprehensive training course on "${title}".

## Course Requirements
- Format: ${format === 'markdown' ? 'Markdown (with ## for headings)' : 'HTML (with proper tags)'}
- Length: ${length} (approximately ${moduleCount} modules)
- Structure: Each module should have a title, content, and a short quiz

## Learning Objectives
${objectivesText}

## Skills to Cover
${skillContextText}

${employeeContextText}

${additionalContext ? `## Additional Context\n${additionalContext}` : ''}

## Instructions
1. Create a detailed course with ${moduleCount} modules
2. Each module should cover specific aspects of the skills listed
3. Include practical examples and exercises
4. Each module should end with a short quiz (2-3 questions)
5. For skills with gaps, focus more content on helping bridge those gaps
6. Create content appropriate for the current skill level, aiming to help reach the required level

Please generate a structured course that follows these requirements. The output should be formatted as a complete, ready-to-use course.
`;
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

// Schema for Groq structured output
const COURSE_GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    objectives: {
      type: 'array',
      items: { type: 'string' }
    },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          quiz: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: { 
                      type: 'array',
                      items: { type: 'string' }
                    },
                    correctOptionIndex: { type: 'number' },
                    explanation: { type: 'string' }
                  },
                  required: ['question', 'options', 'correctOptionIndex', 'explanation']
                }
              }
            },
            required: ['questions']
          }
        },
        required: ['title', 'content', 'quiz']
      }
    }
  },
  required: ['title', 'description', 'objectives', 'modules']
}; 