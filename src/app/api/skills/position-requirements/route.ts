import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch position requirements with taxonomy hierarchy info
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const positionId = searchParams.get('positionId');
  const requirementId = searchParams.get('requirementId');
  const includeHierarchy = searchParams.get('includeHierarchy') === 'true';
  
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    if (requirementId) {
      // Fetch a single requirement
      const { data, error } = await supabase
        .from('position_skill_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
    
    if (!positionId) {
      return NextResponse.json(
        { success: false, error: 'Position ID is required' },
        { status: 400 }
      );
    }
    
    // Base query to fetch requirements
    let query = supabase
      .from('position_skill_requirements')
      .select(`
        id,
        taxonomy_skill_id,
        importance_level,
        required_proficiency
      `)
      .eq('position_id', positionId);
    
    const { data: requirements, error } = await query;
    
    if (error) throw error;
    
    if (includeHierarchy && requirements && requirements.length > 0) {
      // Get all taxonomy skill IDs
      const skillIds = requirements.map(req => req.taxonomy_skill_id);
      
      // Fetch skill details with hierarchy
      const { data: skillsData, error: skillsError } = await supabase
        .from('taxonomy_skills')
        .select(`
          id, 
          name
        `)
        .in('id', skillIds);
      
      if (skillsError) throw skillsError;
      
      // Create a map of skill details
      const skillsMap = new Map();
      skillsData?.forEach(skill => {
        skillsMap.set(skill.id, skill);
      });
      
      // Fetch groups data separately to avoid nesting issues
      const { data: groupData, error: groupError } = await supabase
        .from('taxonomy_skills')
        .select('id, group_id')
        .in('id', skillIds);
        
      if (groupError) throw groupError;
      
      // Get the group IDs
      const groupIds = [...new Set(groupData?.map(item => item.group_id) || [])];
      
      // Get group names
      const { data: groupNamesData, error: groupNamesError } = await supabase
        .from('taxonomy_skill_groups')
        .select('id, name')
        .in('id', groupIds);
        
      if (groupNamesError) throw groupNamesError;
      
      // Create a map of group ID to name
      const groupNamesMap = new Map();
      groupNamesData?.forEach(group => {
        groupNamesMap.set(group.id, group.name);
      });
      
      // Create a map of skill ID to group name
      const skillToGroupMap = new Map();
      groupData?.forEach(skill => {
        skillToGroupMap.set(skill.id, groupNamesMap.get(skill.group_id) || '');
      });
      
      // Fetch subcategories data
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('taxonomy_skills')
        .select('id, subcategory_id')
        .in('id', skillIds);
        
      if (subcategoryError) throw subcategoryError;
      
      // Get the subcategory IDs
      const subcategoryIds = [...new Set(subcategoryData?.map(item => item.subcategory_id) || [])];
      
      // Get subcategory names
      const { data: subcategoryNamesData, error: subcategoryNamesError } = await supabase
        .from('taxonomy_subcategories')
        .select('id, name, category_id')
        .in('id', subcategoryIds);
        
      if (subcategoryNamesError) throw subcategoryNamesError;
      
      // Create a map of subcategory ID to name
      const subcategoryNamesMap = new Map();
      const subcategoryToCategoryMap = new Map();
      subcategoryNamesData?.forEach(subcategory => {
        subcategoryNamesMap.set(subcategory.id, subcategory.name);
        subcategoryToCategoryMap.set(subcategory.id, subcategory.category_id);
      });
      
      // Create a map of skill ID to subcategory name
      const skillToSubcategoryMap = new Map();
      subcategoryData?.forEach(skill => {
        skillToSubcategoryMap.set(skill.id, subcategoryNamesMap.get(skill.subcategory_id) || '');
      });
      
      // Get the category IDs
      const categoryIds = [...new Set(subcategoryNamesData?.map(item => item.category_id) || [])];
      
      // Get category names
      const { data: categoryNamesData, error: categoryNamesError } = await supabase
        .from('taxonomy_categories')
        .select('id, name')
        .in('id', categoryIds);
        
      if (categoryNamesError) throw categoryNamesError;
      
      // Create a map of category ID to name
      const categoryNamesMap = new Map();
      categoryNamesData?.forEach(category => {
        categoryNamesMap.set(category.id, category.name);
      });
      
      // Enrich requirements with hierarchy info
      const enrichedRequirements = requirements.map(req => {
        const skill = skillsMap.get(req.taxonomy_skill_id);
        
        // Get the subcategory ID for this skill
        const subcategoryId = subcategoryData?.find(
          s => s.id === req.taxonomy_skill_id
        )?.subcategory_id;
        
        // Get the category ID for this subcategory
        const categoryId = subcategoryId ? subcategoryToCategoryMap.get(subcategoryId) : undefined;
        
        return {
          ...req,
          skill_name: skill?.name || '',
          group_name: skillToGroupMap.get(req.taxonomy_skill_id) || '',
          subcategory_name: skillToSubcategoryMap.get(req.taxonomy_skill_id) || '',
          category_name: categoryId ? categoryNamesMap.get(categoryId) || '' : ''
        };
      });
      
      return NextResponse.json({ success: true, data: enrichedRequirements });
    }
    
    return NextResponse.json({ success: true, data: requirements });
  } catch (error: any) {
    console.error('Error fetching position requirements:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST: Add a new position requirement
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const body = await request.json();
    const { positionId, taxonomySkillId, importanceLevel, requiredProficiency } = body;
    
    if (!positionId || !taxonomySkillId) {
      return NextResponse.json(
        { success: false, error: 'Position ID and Taxonomy Skill ID are required' },
        { status: 400 }
      );
    }
    
    // Check if this skill is already assigned to the position
    const { data: existingData, error: existingError } = await supabase
      .from('position_skill_requirements')
      .select('id')
      .eq('position_id', positionId)
      .eq('taxonomy_skill_id', taxonomySkillId);
    
    if (existingError) throw existingError;
    
    if (existingData && existingData.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This skill is already assigned to this position' },
        { status: 400 }
      );
    }
    
    // Insert new requirement
    const { data, error } = await supabase
      .from('position_skill_requirements')
      .insert({
        position_id: positionId,
        taxonomy_skill_id: taxonomySkillId,
        importance_level: importanceLevel || 3,
        required_proficiency: requiredProficiency || 3
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error adding position requirement:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a position requirement
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requirementId = searchParams.get('requirementId');
  
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    if (!requirementId) {
      return NextResponse.json(
        { success: false, error: 'Requirement ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('position_skill_requirements')
      .delete()
      .eq('id', requirementId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting position requirement:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 