import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Perform a search on taxonomy skills using multiple queries as needed
    const { data: skillsData, error: skillsError } = await supabase
      .from('taxonomy_skills')
      .select('id, name, group_id, subcategory_id')
      .ilike('name', `%${query}%`)
      .limit(50);

    if (skillsError) {
      console.error('Taxonomy skill search error:', skillsError);
      return NextResponse.json(
        { error: 'Failed to search taxonomy skills' },
        { status: 500 }
      );
    }

    // If we don't have any skills matching, return empty array
    if (!skillsData || skillsData.length === 0) {
      return NextResponse.json({ skills: [] });
    }

    // Get the group IDs and subcategory IDs from the skills
    const groupIds = [...new Set(skillsData.map(s => s.group_id))];
    const subcategoryIds = [...new Set(skillsData.map(s => s.subcategory_id))];

    // Get the groups data
    const { data: groupsData, error: groupsError } = await supabase
      .from('taxonomy_skill_groups')
      .select('id, name')
      .in('id', groupIds);

    if (groupsError) {
      console.error('Groups fetch error:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch skill groups' },
        { status: 500 }
      );
    }

    // Get the subcategories data
    const { data: subcategoriesData, error: subcategoriesError } = await supabase
      .from('taxonomy_subcategories')
      .select('id, name, category_id')
      .in('id', subcategoryIds);

    if (subcategoriesError) {
      console.error('Subcategories fetch error:', subcategoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch subcategories' },
        { status: 500 }
      );
    }

    // Get the category IDs from the subcategories
    const categoryIds = [...new Set(subcategoriesData.map(s => s.category_id))];

    // Get the categories data
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('taxonomy_categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Create a map for faster lookups
    const groupsMap = new Map(groupsData.map(g => [g.id, g]));
    const subcategoriesMap = new Map(subcategoriesData.map(s => [s.id, s]));
    const categoriesMap = new Map(categoriesData.map(c => [c.id, c]));

    // Transform the data structure to match the expected format
    const skills = skillsData.map(skill => {
      const group = groupsMap.get(skill.group_id);
      const subcategory = subcategoriesMap.get(skill.subcategory_id);
      const category = subcategory ? categoriesMap.get(subcategory.category_id) : null;

      return {
        id: skill.id,
        name: skill.name,
        group_id: skill.group_id,
        group_name: group?.name || '',
        subcategory_id: skill.subcategory_id,
        subcategory_name: subcategory?.name || '',
        category_id: category?.id || '',
        category_name: category?.name || '',
      };
    });

    return NextResponse.json({ skills });
  } catch (err) {
    console.error('Unexpected error in taxonomy skill search:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 