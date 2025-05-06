import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

type TaxonomySkill = {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  subcategory_id: string;
  subcategory_name: string;
  category_id: string;
  category_name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; data?: TaxonomySkill[]; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const search = typeof req.query.q === 'string' ? req.query.q : '';

  try {
    // Fetch skills with full hierarchy
    let query = supabase
      .from('skill_taxonomy_items')
      .select(`
        id,
        name,
        group_id,
        skill_taxonomy_groups (
          id,
          name,
          subcategory_id,
          skill_taxonomy_subcategories (
            id,
            name,
            category_id,
            skill_taxonomy_categories (
              id,
              name
            )
          )
        )
      `)
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: skills, error } = await query;

    if (error) throw error;

    const result: TaxonomySkill[] = (skills || []).map((skill: any) => ({
      id: skill.id,
      name: skill.name,
      group_id: skill.group_id,
      group_name: skill.skill_taxonomy_groups?.name ?? '',
      subcategory_id: skill.skill_taxonomy_groups?.skill_taxonomy_subcategories?.id ?? '',
      subcategory_name: skill.skill_taxonomy_groups?.skill_taxonomy_subcategories?.name ?? '',
      category_id: skill.skill_taxonomy_groups?.skill_taxonomy_subcategories?.skill_taxonomy_categories?.id ?? '',
      category_name: skill.skill_taxonomy_groups?.skill_taxonomy_subcategories?.skill_taxonomy_categories?.name ?? '',
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error searching taxonomy skills',
    });
  }
} 