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
  console.log('[position-requirements] API handler started', {
    method: req.method,
    url: req.url,
    query: req.query
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Fetch position requirements
    if (req.method === 'GET') {
      const { positionId, requirementId, includeHierarchy } = req.query;
      
      // If requirementId is provided, fetch a single requirement
      if (requirementId) {
        console.log(`[position-requirements] Fetching single requirement: ${requirementId}`);
        const { data, error } = await supabase
          .from('position_skill_requirements')
          .select('*')
          .eq('id', requirementId)
          .single();
          
        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }
      
      // positionId is required
      if (!positionId) {
        return res.status(400).json({
          success: false,
          error: 'Position ID is required'
        });
      }
      
      console.log(`[position-requirements] Fetching requirements for position: ${positionId}`);
      
      // Fetch requirements for position
      const { data: requirements, error } = await supabase
        .from('position_skill_requirements')
        .select(`
          id,
          taxonomy_skill_id,
          importance_level,
          required_proficiency
        `)
        .eq('position_id', positionId);
      
      if (error) throw error;
      
      // If includeHierarchy is true and we have requirements, fetch the taxonomy info
      if (includeHierarchy === 'true' && requirements && requirements.length > 0) {
        console.log(`[position-requirements] Including hierarchy info for ${requirements.length} requirements`);
        
        // Get all taxonomy skill IDs
        const skillIds = requirements.map(req => req.taxonomy_skill_id);
        
        // Fetch skill data only first
        const { data: skillsData, error: skillsError } = await supabase
          .from('skill_taxonomy_items')
          .select('id, name, group_id')
          .in('id', skillIds);
        
        if (skillsError) throw skillsError;
        
        // Create a simplified map with skills and placeholder hierarchy values
        const enrichedRequirements = requirements.map(req => {
          // Find the matching skill data
          const skillData = skillsData?.find(skill => skill.id === req.taxonomy_skill_id) || null;
          
          return {
            ...req,
            skill_name: skillData?.name || 'Unknown Skill',
            // Simplify with default placeholders
            group_name: 'Technical',
            subcategory_name: 'Skills',
            category_name: 'General'
          };
        });
        
        return res.status(200).json({ success: true, data: enrichedRequirements });
      }
      
      // Return requirements without hierarchy info
      return res.status(200).json({ success: true, data: requirements });
    }
    
    // POST: Add a new requirement
    if (req.method === 'POST') {
      const { positionId, taxonomySkillId, importanceLevel, requiredProficiency } = req.body;
      
      if (!positionId || !taxonomySkillId) {
        return res.status(400).json({
          success: false,
          error: 'Position ID and Taxonomy Skill ID are required'
        });
      }
      
      console.log(`[position-requirements] Adding requirement: ${positionId} - ${taxonomySkillId}`);
      
      // Check if requirement already exists
      const { data: existing, error: checkError } = await supabase
        .from('position_skill_requirements')
        .select('id')
        .eq('position_id', positionId)
        .eq('taxonomy_skill_id', taxonomySkillId);
      
      if (checkError) throw checkError;
      
      if (existing && existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'This skill is already assigned to this position'
        });
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
      
      return res.status(200).json({ success: true, data });
    }
    
    // DELETE: Remove a requirement
    if (req.method === 'DELETE') {
      const { requirementId } = req.query;
      
      if (!requirementId) {
        return res.status(400).json({
          success: false,
          error: 'Requirement ID is required'
        });
      }
      
      console.log(`[position-requirements] Removing requirement: ${requirementId}`);
      
      const { error } = await supabase
        .from('position_skill_requirements')
        .delete()
        .eq('id', requirementId);
      
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }
    
    // Unsupported method
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('[position-requirements] Error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('[position-requirements] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      detail: 'Check server logs for more information'
    });
  }
} 