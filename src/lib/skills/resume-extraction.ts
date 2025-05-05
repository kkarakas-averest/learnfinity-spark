import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseServer } from '@/lib/supabase/server';
import { calculateLevenshteinSimilarity } from '@/lib/skills/normalizer';

// Interfaces for Resume Skills Data
export interface ExtractedSkill {
  name: string;
  proficiency?: number;
  years?: number;
  confidence?: number;
}

export interface ExtractedEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear?: number;
}

export interface ExtractedExperience {
  title: string;
  company: string;
  startDate: string;
  endDate?: string; 
  description: string;
  skills: ExtractedSkill[];
}

export interface ExtractedResumeData {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: ExtractedSkill[];
  education: ExtractedEducation[];
  experience: ExtractedExperience[];
}

export interface NormalizedResumeSkill extends ExtractedSkill {
  taxonomySkillId?: string;
  normalizedName?: string;
  matchConfidence?: number;
}

/**
 * Extract skills and other data from a resume file.
 * 
 * @param fileContent The text content of the resume file
 * @param fileType The type of the file (pdf, docx, etc.)
 * @param userId The ID of the user who uploaded the resume
 * @returns The extracted resume data
 */
export async function extractSkillsFromResume(
  fileContent: string, 
  fileType: string,
  employeeId: string
): Promise<ExtractedResumeData> {
  // In a production environment, this would use a more sophisticated extraction method
  // such as passing the resume to an LLM or a specialized parsing service
  
  // Basic extraction logic for demonstration
  const skills: ExtractedSkill[] = [];
  const education: ExtractedEducation[] = [];
  const experience: ExtractedExperience[] = [];
  
  // Extract skills based on common patterns in resumes
  const skillsPattern = /skills:(.+?)(?=education|experience|$)/is;
  const skillsMatch = fileContent.match(skillsPattern);
  
  if (skillsMatch && skillsMatch[1]) {
    const skillsList = skillsMatch[1].split(/[,;•\n]/);
    
    for (const skill of skillsList) {
      const trimmedSkill = skill.trim();
      if (trimmedSkill.length > 0) {
        skills.push({
          name: trimmedSkill,
          confidence: 0.8
        });
      }
    }
  }
  
  // Extract education (simplified)
  const educationPattern = /education:(.+?)(?=experience|skills|$)/is;
  const educationMatch = fileContent.match(educationPattern);
  
  if (educationMatch && educationMatch[1]) {
    const degreePattern = /(bachelor|master|doctorate|phd|bs|ms|ba|mba)[^\n]+/gi;
    const degreeMatches = educationMatch[1].matchAll(degreePattern);
    
    for (const match of degreeMatches) {
      education.push({
        degree: match[1] || 'Degree',
        field: 'Extracted Field',
        institution: 'Extracted Institution',
      });
    }
  }
  
  // Extract experience sections
  const experiencePattern = /experience:(.+?)(?=education|skills|$)/is;
  const experienceMatch = fileContent.match(experiencePattern);
  
  if (experienceMatch && experienceMatch[1]) {
    const experienceSection = experienceMatch[1];
    const jobTitles = experienceSection.match(/([A-Z][a-z]+ ?)+(?=\sat\s|\s-\s)/g) || [];
    
    for (const title of jobTitles) {
      // Basic extraction of company
      const companyPattern = new RegExp(`${title}\\s+at\\s+([A-Z][a-z\\s]+)`, 'i');
      const companyMatch = experienceSection.match(companyPattern);
      
      experience.push({
        title: title,
        company: companyMatch ? companyMatch[1] : 'Unknown Company',
        startDate: 'Extracted Start Date',
        description: 'Extracted Description',
        skills: [] // Skills specifically mentioned in this experience
      });
    }
  }
  
  return {
    fullName: extractFullName(fileContent),
    email: extractEmail(fileContent),
    phone: extractPhone(fileContent),
    location: extractLocation(fileContent),
    summary: extractSummary(fileContent),
    skills,
    education,
    experience
  };
}

/**
 * Normalize extracted skills against the skills taxonomy.
 * 
 * @param skills An array of extracted skills
 * @returns The same skills with taxonomy mapping information
 */
export async function normalizeResumeSkills(
  skills: ExtractedSkill[]
): Promise<NormalizedResumeSkill[]> {
  const supabase = getSupabaseServer();
  const normalizedSkills: NormalizedResumeSkill[] = [];
  
  // Get all taxonomy skills for comparison
  const { data: taxonomySkills, error } = await supabase
    .from('skill_taxonomy_items')
    .select('id, name, keywords');
  
  if (error || !taxonomySkills) {
    console.error('Error fetching taxonomy skills:', error);
    return skills as NormalizedResumeSkill[];
  }
  
  for (const skill of skills) {
    let bestMatch = {
      id: '',
      name: '',
      similarity: 0
    };
    
    for (const taxonomySkill of taxonomySkills) {
      // Check exact match
      if (taxonomySkill.name.toLowerCase() === skill.name.toLowerCase()) {
        bestMatch = {
          id: taxonomySkill.id,
          name: taxonomySkill.name,
          similarity: 1
        };
        break;
      }
      
      // Check fuzzy match
      const similarity = calculateLevenshteinSimilarity(skill.name.toLowerCase(), taxonomySkill.name.toLowerCase());
      
      if (similarity > bestMatch.similarity && similarity > 0.8) {
        bestMatch = {
          id: taxonomySkill.id,
          name: taxonomySkill.name,
          similarity
        };
      }
      
      // Check against keywords if available
      if (taxonomySkill.keywords && Array.isArray(taxonomySkill.keywords)) {
        for (const keyword of taxonomySkill.keywords) {
          if (typeof keyword === 'string') {
            if (keyword.toLowerCase() === skill.name.toLowerCase()) {
              bestMatch = {
                id: taxonomySkill.id,
                name: taxonomySkill.name,
                similarity: 1
              };
              break;
            }
            
            const keywordSimilarity = calculateLevenshteinSimilarity(skill.name.toLowerCase(), keyword.toLowerCase());
            if (keywordSimilarity > bestMatch.similarity && keywordSimilarity > 0.8) {
              bestMatch = {
                id: taxonomySkill.id,
                name: taxonomySkill.name,
                similarity: keywordSimilarity
              };
            }
          }
        }
      }
    }
    
    const normalizedSkill: NormalizedResumeSkill = {
      ...skill
    };
    
    if (bestMatch.similarity > 0.7) {
      normalizedSkill.taxonomySkillId = bestMatch.id;
      normalizedSkill.normalizedName = bestMatch.name;
      normalizedSkill.matchConfidence = bestMatch.similarity;
    }
    
    normalizedSkills.push(normalizedSkill);
  }
  
  return normalizedSkills;
}

/**
 * Save extracted and normalized resume skills for an employee.
 * 
 * @param employeeId The ID of the employee
 * @param skills The normalized skills extracted from the resume
 * @returns Success status of the operation
 */
export async function saveEmployeeSkills(
  employeeId: string,
  skills: NormalizedResumeSkill[]
): Promise<{ success: boolean; count: number }> {
  const supabase = getSupabaseServer();
  let successCount = 0;
  
  for (const skill of skills) {
    const { error } = await supabase
      .from('hr_employee_skills')
      .insert({
        id: uuidv4(),
        employee_id: employeeId,
        taxonomy_skill_id: skill.taxonomySkillId || null,
        raw_skill: skill.name,
        proficiency: skill.proficiency || 1,
        verified: false,
        source: 'cv'
      });
    
    if (!error) {
      successCount++;
    } else {
      console.error('Error saving employee skill:', error);
    }
  }
  
  return {
    success: successCount > 0,
    count: successCount
  };
}

// Helper functions for extracting specific resume data
function extractFullName(content: string): string {
  // Simple logic to extract the first potential name-like pattern
  const namePattern = /^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/m;
  const match = content.match(namePattern);
  return match ? match[1] : 'Unknown Name';
}

function extractEmail(content: string): string | undefined {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = content.match(emailPattern);
  return match ? match[0] : undefined;
}

function extractPhone(content: string): string | undefined {
  const phonePattern = /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const match = content.match(phonePattern);
  return match ? match[0] : undefined;
}

function extractLocation(content: string): string | undefined {
  // Simplified location extraction
  const locationPattern = /(?:location|address):\s*([^\n]+)/i;
  const match = content.match(locationPattern);
  return match ? match[1].trim() : undefined;
}

function extractSummary(content: string): string | undefined {
  // Extract text between "summary" and the next section
  const summaryPattern = /summary:(.+?)(?=experience:|education:|skills:|$)/is;
  const match = content.match(summaryPattern);
  return match ? match[1].trim() : undefined;
} 