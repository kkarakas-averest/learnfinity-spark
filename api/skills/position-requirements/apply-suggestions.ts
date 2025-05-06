// @vercel/node
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../src/lib/supabase';

// Interface definitions
interface SkillSuggestion {
  skillName: string;
  category: string;
  level: string;
  description: string;
}

interface TaxonomySkill {
  id: string;
  name: string;
  category: string;
}

interface SkippedSuggestion {
  skillName: string;
  reason: string;
}

interface AppliedSuggestion {
  skillName: string;
  taxonomySkillId: string | null;
  requirementId: string | null;
  wasCreated: boolean;
}

interface ApiResponse {
  success: boolean;
  applied: AppliedSuggestion[];
  skipped: SkippedSuggestion[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      applied: [],
      skipped: [],
      error: 'Method not allowed. Please use POST.'
    });
  }

  try {
    // Extract request data
    const { positionId, suggestions } = req.body;

    if (!positionId || !suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({
        success: false,
        applied: [],
        skipped: [],
        error: 'Missing required data: positionId and suggestions array'
      });
    }

    // Verify position exists
    const { data: position, error: positionError } = await supabase
      .from('hr_positions')
      .select('id, title')
      .eq('id', positionId)
      .single();

    if (positionError || !position) {
      return res.status(404).json({
        success: false,
        applied: [],
        skipped: [],
        error: `Position not found: ${positionId}`
      });
    }

    // Get existing skill requirements for this position
    const { data: existingRequirements, error: requirementsError } = await supabase
      .from('position_skill_requirements')
      .select('id, skill_id, importance_level, required_proficiency')
      .eq('position_id', positionId);

    if (requirementsError) {
      console.error('Error fetching existing requirements:', requirementsError);
      return res.status(500).json({
        success: false,
        applied: [],
        skipped: [],
        error: 'Failed to fetch existing skill requirements'
      });
    }

    // Process each suggestion
    const appliedSuggestions: AppliedSuggestion[] = [];
    const skippedSuggestions: SkippedSuggestion[] = [];

    for (const suggestion of suggestions) {
      const { skillName, category, level } = suggestion;
      
      try {
        // Check if skill already exists in taxonomy
        const { data: existingSkills, error: skillError } = await supabase
          .from('skill_taxonomy')
          .select('id, name, category')
          .ilike('name', skillName)
          .limit(5);

        if (skillError) {
          console.error(`Error searching for skill "${skillName}":`, skillError);
          skippedSuggestions.push({
            skillName,
            reason: 'Database error while searching for skill'
          });
          continue;
        }

        // Find exact match or closest match
        let taxonomySkill: TaxonomySkill | null = null;
        if (existingSkills && existingSkills.length > 0) {
          // Try exact match first
          taxonomySkill = existingSkills.find(s => 
            s.name.toLowerCase() === skillName.toLowerCase()
          ) as TaxonomySkill || null;
          
          // If no exact match, use the first result
          if (!taxonomySkill && existingSkills.length > 0) {
            taxonomySkill = existingSkills[0] as TaxonomySkill;
          }
        }

        // If skill doesn't exist in taxonomy, create it
        if (!taxonomySkill) {
          // Map skill level to proficiency number
          const proficiencyMapping: Record<string, number> = {
            'Beginner': 1,
            'Intermediate': 2,
            'Advanced': 3,
            'Expert': 4
          };
          
          const { data: newSkill, error: createSkillError } = await supabase
            .from('skill_taxonomy')
            .insert({
              name: skillName,
              category: category || 'Other',
              description: suggestion.description || `${skillName} skill for ${position.title}`,
              status: 'active'
            })
            .select('id, name, category')
            .single();

          if (createSkillError || !newSkill) {
            console.error(`Error creating skill "${skillName}":`, createSkillError);
            skippedSuggestions.push({
              skillName,
              reason: 'Failed to create new skill in taxonomy'
            });
            continue;
          }

          taxonomySkill = newSkill as TaxonomySkill;
          
          console.log(`Created new skill in taxonomy: ${skillName} (${taxonomySkill.id})`);
        }

        // Check if position already has this skill requirement
        const existingRequirement = existingRequirements?.find(req => 
          req.skill_id === taxonomySkill?.id
        );

        if (existingRequirement) {
          // Skill already assigned to position
          appliedSuggestions.push({
            skillName,
            taxonomySkillId: taxonomySkill.id,
            requirementId: existingRequirement.id,
            wasCreated: false
          });
          
          console.log(`Skill already assigned to position: ${skillName}`);
          continue;
        }

        // Map skill level to proficiency number
        const proficiencyMapping: Record<string, number> = {
          'Beginner': 1,
          'Intermediate': 2,
          'Advanced': 3,
          'Expert': 4
        };
        
        // Add skill requirement to position
        const { data: newRequirement, error: requirementError } = await supabase
          .from('position_skill_requirements')
          .insert({
            position_id: positionId,
            skill_id: taxonomySkill.id,
            importance_level: 3, // Default importance
            required_proficiency: proficiencyMapping[level] || 2,
            notes: suggestion.description || ''
          })
          .select('id')
          .single();

        if (requirementError || !newRequirement) {
          console.error(`Error adding requirement for skill "${skillName}":`, requirementError);
          skippedSuggestions.push({
            skillName,
            reason: 'Failed to add skill requirement to position'
          });
          continue;
        }

        // Successfully added skill requirement
        appliedSuggestions.push({
          skillName,
          taxonomySkillId: taxonomySkill.id,
          requirementId: newRequirement.id,
          wasCreated: true
        });
        
        console.log(`Added new skill requirement: ${skillName} (${taxonomySkill.id})`);
        
      } catch (err) {
        console.error(`Error processing suggestion for skill "${skillName}":`, err);
        skippedSuggestions.push({
          skillName,
          reason: 'Unexpected error during processing'
        });
      }
    }

    // Return results
    return res.status(200).json({
      success: true,
      applied: appliedSuggestions,
      skipped: skippedSuggestions
    });
    
  } catch (error) {
    console.error('Error in apply-suggestions API:', error);
    return res.status(500).json({
      success: false,
      applied: [],
      skipped: [],
      error: error instanceof Error ? error.message : 'Unknown error applying suggestions'
    });
  }
} 