import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials - using direct values to avoid env var issues
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Sample skills for different position types
const sampleSkills = {
  developer: [
    { id: 'skill-1', name: 'JavaScript' },
    { id: 'skill-2', name: 'TypeScript' },
    { id: 'skill-3', name: 'React' },
    { id: 'skill-4', name: 'Node.js' },
    { id: 'skill-5', name: 'SQL' }
  ],
  designer: [
    { id: 'skill-6', name: 'Figma' },
    { id: 'skill-7', name: 'UI Design' },
    { id: 'skill-8', name: 'UX Research' },
    { id: 'skill-9', name: 'Adobe Creative Suite' },
    { id: 'skill-10', name: 'Design Systems' }
  ],
  manager: [
    { id: 'skill-11', name: 'Leadership' },
    { id: 'skill-12', name: 'Project Management' },
    { id: 'skill-13', name: 'Team Building' },
    { id: 'skill-14', name: 'Strategic Planning' },
    { id: 'skill-15', name: 'Performance Management' }
  ],
  default: [
    { id: 'skill-16', name: 'Communication' },
    { id: 'skill-17', name: 'Problem Solving' },
    { id: 'skill-18', name: 'Time Management' },
    { id: 'skill-19', name: 'Adaptability' },
    { id: 'skill-20', name: 'Teamwork' }
  ]
};

// Mock AI suggestion function that returns appropriate skills based on position title
function suggestSkillsForPosition(positionTitle: string) {
  const lowercaseTitle = positionTitle.toLowerCase();
  
  if (lowercaseTitle.includes('develop') || lowercaseTitle.includes('engineer') || lowercaseTitle.includes('coder')) {
    return sampleSkills.developer;
  } else if (lowercaseTitle.includes('design') || lowercaseTitle.includes('ux') || lowercaseTitle.includes('ui')) {
    return sampleSkills.designer;
  } else if (lowercaseTitle.includes('manager') || lowercaseTitle.includes('director') || lowercaseTitle.includes('lead')) {
    return sampleSkills.manager;
  } else {
    return sampleSkills.default;
  }
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
    
    // Get suggestions from mock function
    const suggestedSkills = suggestSkillsForPosition(positionTitle);
    
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