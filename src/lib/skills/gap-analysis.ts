import { supabase } from '../supabase';
import { getPositionSkillRequirements, PositionSkillRequirement } from './position-requirements';

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  taxonomy_skill_id: string | null;
  raw_skill: string;
  proficiency: number; // 1-5, with 5 being expert level
  verified: boolean;
  source: string; // 'cv', 'assessment', 'self-reported', 'manager'
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  skill_name?: string;
  category_name?: string;
  subcategory_name?: string;
  group_name?: string;
}

export interface SkillGap {
  category_id?: string;
  category_name?: string;
  subcategory_id?: string;
  subcategory_name?: string;
  group_id?: string;
  group_name?: string;
  taxonomy_skill_id: string;
  skill_name: string;
  required_proficiency: number;
  current_proficiency: number | null;
  proficiency_gap: number;
  importance_level: number;
  gap_score: number; // importance_level * proficiency_gap
}

export interface GapAnalysisResult {
  // Overall metrics
  match_percentage: number;
  critical_gap_count: number;
  total_requirements: number;
  matched_requirements: number;
  
  // Categorized gaps
  gaps_by_category: { [categoryName: string]: SkillGap[] };
  
  // Prioritized gaps
  prioritized_gaps: SkillGap[];
  
  // Raw data
  employee_skills: EmployeeSkill[];
  position_requirements: PositionSkillRequirement[];
}

/**
 * Get normalized skills for an employee with taxonomy data
 */
export async function getEmployeeSkills(employeeId: string): Promise<EmployeeSkill[]> {
  try {
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }
    
    // Get employee skills from the database
    const { data: skills, error } = await supabase
      .from('hr_employee_skills')
      .select(`
        id,
        employee_id,
        taxonomy_skill_id,
        raw_skill,
        proficiency,
        verified,
        source,
        created_at,
        updated_at
      `)
      .eq('employee_id', employeeId);
      
    if (error) {
      console.error('Error fetching employee skills:', error);
      return [];
    }
    
    // For skills that have a taxonomy ID, fetch the taxonomy data
    const enrichedSkills = await Promise.all(
      (skills || []).map(async (skill) => {
        if (!skill.taxonomy_skill_id) {
          return {
            ...skill,
            skill_name: skill.raw_skill,
            category_name: null,
            subcategory_name: null,
            group_name: null
          };
        }
        
        // Get the skill name and group ID
        const { data: skillData, error: skillError } = await supabase
          .from('skill_taxonomy_items')
          .select(`
            id,
            name,
            group_id
          `)
          .eq('id', skill.taxonomy_skill_id)
          .single();
          
        if (skillError || !skillData) {
          console.error(`Error fetching skill data for ${skill.taxonomy_skill_id}:`, skillError);
          return {
            ...skill,
            skill_name: skill.raw_skill,
            category_name: null,
            subcategory_name: null,
            group_name: null
          };
        }
        
        // Get the hierarchy information
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
            ...skill,
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
            ...skill,
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
          ...skill,
          skill_name: skillData.name,
          category_name: categoryData?.name || null,
          subcategory_name: subcategoryData.name,
          group_name: groupData.name
        };
      })
    );
    
    return enrichedSkills;
  } catch (error) {
    console.error('Error in getEmployeeSkills:', error);
    return [];
  }
}

/**
 * Generate a gap analysis between an employee's skills and position requirements
 */
export async function generateGapAnalysis(
  employeeId: string,
  positionId: string
): Promise<GapAnalysisResult> {
  try {
    // Get the employee's skills and position requirements
    const employeeSkills = await getEmployeeSkills(employeeId);
    const positionRequirements = await getPositionSkillRequirements(positionId, true);
    
    // Create a map of employee skills by taxonomy ID for quick lookup
    const employeeSkillMap = new Map<string, EmployeeSkill>();
    employeeSkills.forEach(skill => {
      if (skill.taxonomy_skill_id) {
        employeeSkillMap.set(skill.taxonomy_skill_id, skill);
      }
    });
    
    // Analyze gaps between requirements and employee skills
    const gaps: SkillGap[] = [];
    let matchedRequirements = 0;
    
    positionRequirements.forEach(req => {
      const employeeSkill = employeeSkillMap.get(req.taxonomy_skill_id);
      
      // Determine if this is a gap
      const currentProficiency = employeeSkill?.proficiency || 0;
      const proficiencyGap = Math.max(0, req.required_proficiency - currentProficiency);
      
      if (employeeSkill && proficiencyGap <= 0) {
        // Employee meets or exceeds the requirement
        matchedRequirements++;
      } else {
        // There's a gap, add it to the list
        gaps.push({
          category_id: undefined,
          category_name: req.category_name,
          subcategory_id: undefined,
          subcategory_name: req.subcategory_name,
          group_id: undefined,
          group_name: req.group_name,
          taxonomy_skill_id: req.taxonomy_skill_id,
          skill_name: req.skill_name || 'Unknown Skill',
          required_proficiency: req.required_proficiency,
          current_proficiency: employeeSkill?.proficiency || null,
          proficiency_gap: proficiencyGap,
          importance_level: req.importance_level,
          gap_score: req.importance_level * proficiencyGap
        });
      }
    });
    
    // Calculate overall metrics
    const totalRequirements = positionRequirements.length;
    const matchPercentage = totalRequirements > 0 
      ? (matchedRequirements / totalRequirements) * 100 
      : 0;
    
    // Count critical gaps (high importance with large gaps)
    const criticalGapCount = gaps.filter(
      gap => gap.importance_level >= 4 && gap.proficiency_gap >= 3
    ).length;
    
    // Organize gaps by category
    const gapsByCategory: { [categoryName: string]: SkillGap[] } = {};
    
    gaps.forEach(gap => {
      const categoryName = gap.category_name || 'Uncategorized';
      if (!gapsByCategory[categoryName]) {
        gapsByCategory[categoryName] = [];
      }
      gapsByCategory[categoryName].push(gap);
    });
    
    // Sort gaps by priority (gap_score)
    const prioritizedGaps = [...gaps].sort((a, b) => b.gap_score - a.gap_score);
    
    return {
      match_percentage: matchPercentage,
      critical_gap_count: criticalGapCount,
      total_requirements: totalRequirements,
      matched_requirements: matchedRequirements,
      gaps_by_category: gapsByCategory,
      prioritized_gaps: prioritizedGaps,
      employee_skills: employeeSkills,
      position_requirements: positionRequirements
    };
  } catch (error) {
    console.error('Error in generateGapAnalysis:', error);
    throw error;
  }
}

/**
 * Update an employee's skill data (create, update, or delete)
 */
export async function updateEmployeeSkill(
  employeeId: string,
  data: {
    id?: string; // If provided, updates existing skill
    taxonomy_skill_id?: string | null;
    raw_skill: string;
    proficiency: number;
    verified?: boolean;
    source?: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!employeeId || !data.raw_skill) {
      throw new Error('Employee ID and raw skill are required');
    }
    
    // Validate proficiency
    if (data.proficiency < 1 || data.proficiency > 5) {
      throw new Error('Proficiency must be between 1 and 5');
    }
    
    const now = new Date().toISOString();
    
    // If ID is provided, update existing skill
    if (data.id) {
      const { error } = await supabase
        .from('hr_employee_skills')
        .update({
          taxonomy_skill_id: data.taxonomy_skill_id,
          raw_skill: data.raw_skill,
          proficiency: data.proficiency,
          verified: data.verified !== undefined ? data.verified : true,
          source: data.source || 'hr',
          updated_at: now
        })
        .eq('id', data.id)
        .eq('employee_id', employeeId);
        
      if (error) {
        console.error('Error updating employee skill:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, id: data.id };
    }
    
    // Otherwise, create a new skill
    const newId = crypto.randomUUID();
    const { error } = await supabase
      .from('hr_employee_skills')
      .insert({
        id: newId,
        employee_id: employeeId,
        taxonomy_skill_id: data.taxonomy_skill_id,
        raw_skill: data.raw_skill,
        proficiency: data.proficiency,
        verified: data.verified !== undefined ? data.verified : true,
        source: data.source || 'hr',
        created_at: now,
        updated_at: now
      });
      
    if (error) {
      console.error('Error creating employee skill:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, id: newId };
  } catch (error) {
    console.error('Error in updateEmployeeSkill:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error updating employee skill' 
    };
  }
}

/**
 * Delete an employee skill
 */
export async function deleteEmployeeSkill(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!skillId) {
      throw new Error('Skill ID is required');
    }
    
    const { error } = await supabase
      .from('hr_employee_skills')
      .delete()
      .eq('id', skillId);
      
    if (error) {
      console.error('Error deleting employee skill:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteEmployeeSkill:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting employee skill' 
    };
  }
} 