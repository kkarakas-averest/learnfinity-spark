// @vercel/node
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials - using direct values to avoid env var issues
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[taxonomy-search] API handler started', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { q } = req.query;
    const searchQuery = typeof q === 'string' ? q.trim() : '';
    
    console.log(`[taxonomy-search] Searching for skills with query: "${searchQuery}"`);
    
    // Search for skills (simplified version)
    const { data: skills, error } = await supabase
      .from('skill_taxonomy_items')
      .select('id, name')
      .ilike('name', `%${searchQuery}%`)
      .order('name')
      .limit(50);
    
    if (error) throw error;
    
    // Add placeholder hierarchy data
    const enrichedSkills = (skills || []).map(skill => ({
      id: skill.id,
      name: skill.name,
      group_id: 'placeholder',
      group_name: 'Technical',
      subcategory_id: 'placeholder',
      subcategory_name: 'Skills',
      category_id: 'placeholder',
      category_name: 'General'
    }));
    
    console.log(`[taxonomy-search] Found ${enrichedSkills.length} skills matching query`);
    
    return res.status(200).json({ 
      success: true,
      skills: enrichedSkills
    });
    
  } catch (error) {
    console.error('[taxonomy-search] Error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('[taxonomy-search] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error searching taxonomy',
      detail: 'Check server logs for more information'
    });
  }
} 