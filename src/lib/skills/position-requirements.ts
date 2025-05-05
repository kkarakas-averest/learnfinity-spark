import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export interface PositionSkillRequirement {
  id: string;
  position_id: string;
  taxonomy_skill_id: string;
  importance_level: number; // 1-5, with 5 being most important
  required_proficiency: number; // 1-5, with 5 being expert level
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  skill_name?: string;
  category_name?: string;
  subcategory_name?: string;
  group_name?: string;
}

export interface PositionSkillsFilter {
  positionId?: string;
  categoryId?: string;
  importance?: number;
  limit?: number;
  offset?: number;
}

/**
 * Get skill requirements for a position with full taxonomy data
 */
export async function getPositionSkillRequirements(
  positionId: string,
  includeHierarchy: boolean = true
): Promise<PositionSkillRequirement[]> {
  try {
    if (!positionId) {
      throw new Error('Position ID is required');
    }
    
    let query = supabase
      .from('position_skill_requirements')
      .select(`
        id,
        position_id,
        taxonomy_skill_id,
        importance_level,
        required_proficiency,
        created_at,
        updated_at
      `)
      .eq('position_id', positionId);
      
    const { data: requirements, error } = await query;
    
    if (error) {
      console.error('Error fetching position skill requirements:', error);
      return [];
    }
    
    if (!includeHierarchy) {
      return requirements || [];
    }
    
    // Fetch taxonomy data for each skill
    const enrichedRequirements = await Promise.all(
      (requirements || []).map(async (req) => {
        const { data: skillData, error: skillError } = await supabase
          .from('skill_taxonomy_items')
          .select(`
            id,
            name,
            group_id
          `)
          .eq('id', req.taxonomy_skill_id)
          .single();
          
        if (skillError || !skillData) {
          console.error(`Error fetching skill data for ${req.taxonomy_skill_id}:`, skillError);
          return {
            ...req,
            skill_name: 'Unknown Skill',
            category_name: null,
            subcategory_name: null,
            group_name: null
          };
        }
        
        // Get the group, subcategory and category
        const { data: groupData, error: groupError } = await supabase
          .from('skill_taxonomy_groups')
          .select(`
            id,
            name,
            subcategory_id
          `)
          .eq('id', skillData.group_id)
          .single();
          
        if (groupError || !groupData) {
          return {
            ...req,
            skill_name: skillData.name,
            category_name: null,
            subcategory_name: null,
            group_name: null
          };
        }
        
        const { data: subcategoryData, error: subcategoryError } = await supabase
          .from('skill_taxonomy_subcategories')
          .select(`
            id,
            name,
            category_id
          `)
          .eq('id', groupData.subcategory_id)
          .single();
          
        if (subcategoryError || !subcategoryData) {
          return {
            ...req,
            skill_name: skillData.name,
            category_name: null,
            subcategory_name: null,
            group_name: groupData.name
          };
        }
        
        const { data: categoryData, error: categoryError } = await supabase
          .from('skill_taxonomy_categories')
          .select(`
            id,
            name
          `)
          .eq('id', subcategoryData.category_id)
          .single();
          
        return {
          ...req,
          skill_name: skillData.name,
          category_name: categoryData?.name || null,
          subcategory_name: subcategoryData.name,
          group_name: groupData.name
        };
      })
    );
    
    return enrichedRequirements;
  } catch (error) {
    console.error('Error in getPositionSkillRequirements:', error);
    return [];
  }
}

/**
 * Add a skill requirement to a position
 */
export async function addPositionSkillRequirement(
  positionId: string,
  taxonomySkillId: string,
  importanceLevel: number = 3,
  requiredProficiency: number = 3
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!positionId || !taxonomySkillId) {
      throw new Error('Position ID and taxonomy skill ID are required');
    }
    
    // Validate importance level and proficiency
    if (importanceLevel < 1 || importanceLevel > 5) {
      throw new Error('Importance level must be between 1 and 5');
    }
    
    if (requiredProficiency < 1 || requiredProficiency > 5) {
      throw new Error('Required proficiency must be between 1 and 5');
    }
    
    // Check if this skill is already required for this position
    const { data: existing, error: checkError } = await supabase
      .from('position_skill_requirements')
      .select('id')
      .eq('position_id', positionId)
      .eq('taxonomy_skill_id', taxonomySkillId);
      
    if (checkError) {
      console.error('Error checking existing skill requirement:', checkError);
      return { success: false, error: 'Error checking existing requirement' };
    }
    
    if (existing && existing.length > 0) {
      // Update existing requirement
      const { error: updateError } = await supabase
        .from('position_skill_requirements')
        .update({
          importance_level: importanceLevel,
          required_proficiency: requiredProficiency,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id);
        
      if (updateError) {
        console.error('Error updating skill requirement:', updateError);
        return { success: false, error: 'Error updating requirement' };
      }
      
      return { success: true, id: existing[0].id };
    }
    
    // Create new requirement
    const newId = uuidv4();
    const { error: insertError } = await supabase
      .from('position_skill_requirements')
      .insert({
        id: newId,
        position_id: positionId,
        taxonomy_skill_id: taxonomySkillId,
        importance_level: importanceLevel,
        required_proficiency: requiredProficiency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error inserting skill requirement:', insertError);
      return { success: false, error: 'Error creating requirement' };
    }
    
    return { success: true, id: newId };
  } catch (error) {
    console.error('Error in addPositionSkillRequirement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error adding skill requirement' 
    };
  }
}

/**
 * Remove a skill requirement from a position
 */
export async function removePositionSkillRequirement(
  requirementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!requirementId) {
      throw new Error('Requirement ID is required');
    }
    
    const { error } = await supabase
      .from('position_skill_requirements')
      .delete()
      .eq('id', requirementId);
      
    if (error) {
      console.error('Error removing skill requirement:', error);
      return { success: false, error: 'Error removing requirement' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in removePositionSkillRequirement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error removing skill requirement' 
    };
  }
}

/**
 * Batch update position skill requirements
 * This will add new requirements, update existing ones, and remove requirements not in the list
 */
export async function updatePositionSkillRequirements(
  positionId: string,
  requirements: Array<{
    taxonomy_skill_id: string;
    importance_level: number;
    required_proficiency: number;
  }>
): Promise<{ success: boolean; added: number; updated: number; removed: number; error?: string }> {
  try {
    if (!positionId) {
      throw new Error('Position ID is required');
    }
    
    // Get existing requirements for this position
    const { data: existing, error: fetchError } = await supabase
      .from('position_skill_requirements')
      .select('id, taxonomy_skill_id')
      .eq('position_id', positionId);
      
    if (fetchError) {
      console.error('Error fetching existing requirements:', fetchError);
      return { success: false, added: 0, updated: 0, removed: 0, error: 'Error fetching existing requirements' };
    }
    
    // Create map of existing requirements by skill ID
    const existingMap = new Map();
    (existing || []).forEach(req => {
      existingMap.set(req.taxonomy_skill_id, req.id);
    });
    
    // Track skills in the updated list
    const updatedSkillIds = new Set(requirements.map(req => req.taxonomy_skill_id));
    
    // Identify skills to remove (in existing but not in updated list)
    const toRemove = (existing || [])
      .filter(req => !updatedSkillIds.has(req.taxonomy_skill_id))
      .map(req => req.id);
    
    // Process each required skill
    const addPromises = [];
    const updatePromises = [];
    
    for (const req of requirements) {
      if (existingMap.has(req.taxonomy_skill_id)) {
        // Update existing
        updatePromises.push(
          supabase
            .from('position_skill_requirements')
            .update({
              importance_level: req.importance_level,
              required_proficiency: req.required_proficiency,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMap.get(req.taxonomy_skill_id))
        );
      } else {
        // Add new
        addPromises.push(
          supabase
            .from('position_skill_requirements')
            .insert({
              id: uuidv4(),
              position_id: positionId,
              taxonomy_skill_id: req.taxonomy_skill_id,
              importance_level: req.importance_level,
              required_proficiency: req.required_proficiency,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        );
      }
    }
    
    // Remove requirements not in the updated list
    let removed = 0;
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('position_skill_requirements')
        .delete()
        .in('id', toRemove);
        
      if (removeError) {
        console.error('Error removing skill requirements:', removeError);
      } else {
        removed = toRemove.length;
      }
    }
    
    // Process adds
    let added = 0;
    for (const promise of addPromises) {
      const { error } = await promise;
      if (!error) added++;
    }
    
    // Process updates
    let updated = 0;
    for (const promise of updatePromises) {
      const { error } = await promise;
      if (!error) updated++;
    }
    
    return {
      success: true,
      added,
      updated,
      removed
    };
  } catch (error) {
    console.error('Error in updatePositionSkillRequirements:', error);
    return {
      success: false,
      added: 0,
      updated: 0,
      removed: 0,
      error: error instanceof Error ? error.message : 'Unknown error updating skill requirements'
    };
  }
} 