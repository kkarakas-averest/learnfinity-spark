import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials - using direct values to avoid env var issues
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Skill categories for suggestion
const skillKeywords = {
  developer: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL',
    'Python', 'Java', 'C#', 'HTML', 'CSS'
  ],
  designer: [
    'Figma', 'UI Design', 'UX Research', 'Adobe Creative Suite', 'Design Systems',
    'Wireframing', 'Prototyping', 'User Testing', 'Visual Design', 'Interaction Design'
  ],
  manager: [
    'Leadership', 'Project Management', 'Team Building', 'Strategic Planning', 'Performance Management',
    'Agile', 'Scrum', 'Budgeting', 'Stakeholder Management', 'Risk Assessment'
  ],
  default: [
    'Communication', 'Problem Solving', 'Time Management', 'Adaptability', 'Teamwork',
    'Critical Thinking', 'Attention to Detail', 'Organization', 'Creativity', 'Decision Making'
  ]
};

// Async function to search for skills in the taxonomy
async function findSkillsByKeywords(keywords: string[]) {
  // Build a query with OR conditions for each keyword
  const queries = keywords.map(keyword => {
    return `name.ilike.%${keyword}%`;
  });
  
  // Join the queries with OR
  const filterString = queries.join(',');
  
  try {
    const { data, error } = await supabase
      .from('skill_taxonomy_items')
      .select('id, name')
      .or(filterString)
      .limit(10);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error finding skills by keywords:', error);
    return [];
  }
}

// AI suggestion function that returns appropriate skills based on position title
async function suggestSkillsForPosition(positionTitle: string) {
  const lowercaseTitle = positionTitle.toLowerCase();
  
  let keywordsToUse: string[] = [];
  
  if (lowercaseTitle.includes('develop') || lowercaseTitle.includes('engineer') || lowercaseTitle.includes('coder')) {
    keywordsToUse = skillKeywords.developer;
  } else if (lowercaseTitle.includes('design') || lowercaseTitle.includes('ux') || lowercaseTitle.includes('ui')) {
    keywordsToUse = skillKeywords.designer;
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director') || lowercaseTitle.includes('lead')) {
    keywordsToUse = skillKeywords.manager;
  } else {
    keywordsToUse = skillKeywords.default;
  }
  
  // Find actual skills from the database
  const suggestedSkills = await findSkillsByKeywords(keywordsToUse);
  
  // If we couldn't find any skills, return a fallback set
  if (!suggestedSkills || suggestedSkills.length === 0) {
    return skillKeywords.default.map((name, index) => ({
      id: `fallback-${index}`,
      name
    }));
  }
  
  return suggestedSkills;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[suggest-skills] API handler started', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Accept both GET and POST methods
    const positionTitle = 
      req.method === 'GET' 
        ? req.query.positionTitle as string 
        : req.body.positionTitle;
    
    if (!positionTitle) {
      return res.status(400).json({
        success: false,
        error: 'Position title is required'
      });
    }
    
    console.log(`[suggest-skills] Suggesting skills for position: ${positionTitle}`);
    
    // Get suggestions from function
    const suggestedSkills = await suggestSkillsForPosition(positionTitle);
    
    // Add placeholder hierarchy data for each skill
    const enrichedSkills = suggestedSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      group_id: 'placeholder',
      group_name: 'Technical',
      subcategory_id: 'placeholder',
      subcategory_name: 'Skills',
      category_id: 'placeholder',
      category_name: 'General'
    }));
    
    return res.status(200).json({
      success: true,
      skills: enrichedSkills
    });
    
  } catch (error) {
    console.error('[suggest-skills] Error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('[suggest-skills] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error suggesting skills',
      detail: 'Check server logs for more information'
    });
  }
} 