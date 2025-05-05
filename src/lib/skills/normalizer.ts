import { supabase } from '../supabase';
import { distance, closest } from 'fastest-levenshtein';

/**
 * Skill normalization result with taxonomy mapping and confidence
 */
export interface SkillNormalizationResult {
  rawSkill: string;
  taxonomySkillId: string | null;
  taxonomySkillName: string | null;
  confidence: number;
  matches: Array<{
    id: string;
    name: string;
    similarityScore: number;
    category: string | null;
    subcategory: string | null;
    group: string | null;
  }>;
}

/**
 * Configuration options for skill normalization
 */
export interface NormalizationOptions {
  /** Minimum confidence threshold for automatic matching (0-1) */
  confidenceThreshold?: number;
  /** Maximum number of potential matches to return */
  maxMatches?: number;
  /** Whether to include skill hierarchy information */
  includeHierarchy?: boolean;
  /** Filter to specific categories */
  categoryFilter?: string[];
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  confidenceThreshold: 0.7,
  maxMatches: 5,
  includeHierarchy: true,
  categoryFilter: [],
};

/**
 * Calculate string similarity score between two strings (0-1)
 * Higher value means more similar
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1; // Both empty strings
  
  const levenshteinDistance = distance(s1, s2);
  return 1 - levenshteinDistance / maxLength;
}

/**
 * Search for potential skill matches in the taxonomy
 */
async function searchTaxonomySkills(rawSkill: string, options: NormalizationOptions) {
  // Create a simplified version for better matching
  const simplifiedSkill = rawSkill.toLowerCase().trim();
  
  // Query for skills that might match using full text search
  // First try exact matches, then fuzzy search
  let { data: exactMatches, error: exactError } = await supabase
    .from('skill_taxonomy_items')
    .select('id, name, group_id')
    .ilike('name', simplifiedSkill)
    .limit(10);
    
  if (exactError) {
    console.error('Error searching for exact skill matches:', exactError);
    exactMatches = [];
  }
  
  // Perform a more flexible search for potential matches using pattern matching
  let { data: fuzzyMatches, error: fuzzyError } = await supabase
    .from('skill_taxonomy_items')
    .select('id, name, group_id')
    .ilike('name', `%${simplifiedSkill}%`)
    .limit(50);
    
  if (fuzzyError) {
    console.error('Error searching for fuzzy skill matches:', fuzzyError);
    fuzzyMatches = [];
  }
  
  // Combine results, removing duplicates
  const combinedMatches = [
    ...(exactMatches || []),
    ...((fuzzyMatches || []).filter(fm => 
      !(exactMatches || []).some(em => em.id === fm.id)
    ))
  ];
  
  // Calculate similarity scores for all potential matches
  const scoredMatches = combinedMatches.map(match => {
    const similarityScore = calculateSimilarity(rawSkill, match.name);
    return {
      ...match,
      similarityScore
    };
  });
  
  // Sort by similarity score (highest first)
  return scoredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Fetch category hierarchy information for a skill
 */
async function fetchSkillHierarchy(skillGroupId: string) {
  // First get the group and its subcategory
  const { data: group, error: groupError } = await supabase
    .from('skill_taxonomy_groups')
    .select('id, name, subcategory_id')
    .eq('id', skillGroupId)
    .single();
    
  if (groupError || !group) {
    console.error('Error fetching skill group:', groupError);
    return { category: null, subcategory: null, group: null };
  }
  
  // Then get the subcategory and its category
  const { data: subcategory, error: subcategoryError } = await supabase
    .from('skill_taxonomy_subcategories')
    .select('id, name, category_id')
    .eq('id', group.subcategory_id)
    .single();
    
  if (subcategoryError || !subcategory) {
    console.error('Error fetching skill subcategory:', subcategoryError);
    return { category: null, subcategory: null, group: group.name };
  }
  
  // Finally get the category
  const { data: category, error: categoryError } = await supabase
    .from('skill_taxonomy_categories')
    .select('id, name')
    .eq('id', subcategory.category_id)
    .single();
    
  if (categoryError || !category) {
    console.error('Error fetching skill category:', categoryError);
    return { category: null, subcategory: subcategory.name, group: group.name };
  }
  
  return {
    category: category.name,
    subcategory: subcategory.name,
    group: group.name
  };
}

/**
 * Normalize a raw skill against the taxonomy
 * Returns the best match and confidence score
 */
export async function normalizeSkill(
  rawSkill: string,
  options: NormalizationOptions = {}
): Promise<SkillNormalizationResult> {
  // Merge with default options
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  if (!rawSkill || typeof rawSkill !== 'string' || rawSkill.trim() === '') {
    console.log(`Skipping empty or invalid skill: "${rawSkill}"`);
    return {
      rawSkill,
      taxonomySkillId: null,
      taxonomySkillName: null,
      confidence: 0,
      matches: []
    };
  }
  
  console.log(`Normalizing individual skill: "${rawSkill}"`);
  
  try {
    // Find potential matches
    console.log(`Searching taxonomy for matches to "${rawSkill}"`);
    const matches = await searchTaxonomySkills(rawSkill, mergedOptions);
    
    if (matches.length === 0) {
      console.log(`No taxonomy matches found for "${rawSkill}"`);
      return {
        rawSkill,
        taxonomySkillId: null,
        taxonomySkillName: null,
        confidence: 0,
        matches: []
      };
    }
    
    console.log(`Found ${matches.length} potential taxonomy matches for "${rawSkill}"`);
    
    // Get the best match
    const bestMatch = matches[0];
    const confidence = bestMatch.similarityScore;
    console.log(`Best match: "${bestMatch.name}" (ID: ${bestMatch.id.substring(0, 8)}...) with confidence ${confidence.toFixed(2)}`);
    
    // Fetch hierarchy information if needed
    const topMatches = matches.slice(0, mergedOptions.maxMatches);
    const matchesWithHierarchy = await Promise.all(
      topMatches.map(async (match) => {
        if (mergedOptions.includeHierarchy) {
          const hierarchy = await fetchSkillHierarchy(match.group_id);
          return { ...match, ...hierarchy };
        }
        return { 
          ...match, 
          category: null, 
          subcategory: null, 
          group: null 
        };
      })
    );
    
    const isAccepted = confidence >= (mergedOptions.confidenceThreshold || 0);
    console.log(`Match ${isAccepted ? 'accepted' : 'rejected'} based on confidence threshold ${mergedOptions.confidenceThreshold}`);
    
    return {
      rawSkill,
      taxonomySkillId: isAccepted ? bestMatch.id : null,
      taxonomySkillName: isAccepted ? bestMatch.name : null,
      confidence,
      matches: matchesWithHierarchy
    };
  } catch (error) {
    console.error(`Error normalizing skill "${rawSkill}":`, error);
    return {
      rawSkill,
      taxonomySkillId: null,
      taxonomySkillName: null,
      confidence: 0,
      matches: []
    };
  }
}

/**
 * Batch normalize multiple skills against the taxonomy
 */
export async function normalizeSkills(
  rawSkills: string[],
  options: NormalizationOptions = {}
): Promise<SkillNormalizationResult[]> {
  // Process in batches to avoid rate limiting or excessive concurrent requests
  const results: SkillNormalizationResult[] = [];
  const batchSize = 5;
  
  console.log(`======== TAXONOMY NORMALIZATION START ========`);
  console.log(`Starting normalization of ${rawSkills.length} skills to taxonomy`);
  console.log(`Raw skills to normalize: ${rawSkills.join(', ')}`);
  console.log(`Using options:`, options);
  
  const startTime = performance.now();
  
  for (let i = 0; i < rawSkills.length; i += batchSize) {
    const batch = rawSkills.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rawSkills.length/batchSize)}: ${batch.join(', ')}`);
    
    const batchPromises = batch.map(skill => normalizeSkill(skill, options));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`Batch ${Math.floor(i/batchSize) + 1} results:`, 
      batchResults.map(r => ({
        raw: r.rawSkill,
        taxonomyId: r.taxonomySkillId ? r.taxonomySkillId.substring(0, 8) + '...' : 'null',
        taxonomyName: r.taxonomySkillName,
        confidence: r.confidence.toFixed(2)
      }))
    );
  }
  
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Calculate statistics
  const matchedSkills = results.filter(r => r.taxonomySkillId !== null);
  const matchRate = (matchedSkills.length / results.length) * 100;
  const avgConfidence = matchedSkills.length > 0 
    ? matchedSkills.reduce((sum, r) => sum + r.confidence, 0) / matchedSkills.length 
    : 0;
  
  console.log(`======== TAXONOMY NORMALIZATION COMPLETE ========`);
  console.log(`Normalized ${results.length} skills in ${duration}s`);
  console.log(`Match rate: ${matchRate.toFixed(1)}% (${matchedSkills.length}/${results.length})`);
  console.log(`Average confidence for matches: ${avgConfidence.toFixed(2)}`);
  console.log(`Results summary:`, 
    results.map(r => ({
      raw: r.rawSkill,
      normalized: r.taxonomySkillName,
      taxonomyId: r.taxonomySkillId ? r.taxonomySkillId.substring(0, 8) + '...' : 'null',
      confidence: r.confidence.toFixed(2)
    }))
  );
  
  return results;
}

/**
 * Get summary statistics from normalization results
 */
export function getNormalizationStats(results: SkillNormalizationResult[]) {
  const matched = results.filter(r => r.taxonomySkillId !== null).length;
  const total = results.length;
  const matchRate = total > 0 ? matched / total : 0;
  
  return {
    total,
    matched,
    unmatched: total - matched,
    matchRate,
    averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / total
  };
}

/**
 * Calculate Levenshtein similarity between two strings.
 * Returns a value between 0 and 1, where 1 means exact match.
 * 
 * @param source The source string
 * @param target The target string
 * @returns A similarity score between 0 and 1
 */
export function calculateLevenshteinSimilarity(source: string, target: string): number {
  if (source === target) return 1;
  if (!source || !target) return 0;
  
  // Calculate the Levenshtein distance
  const distance = getLevenshteinDistance(source, target);
  const maxLength = Math.max(source.length, target.length);
  
  // Convert distance to similarity score (1 - normalized distance)
  return 1 - (distance / maxLength);
}

/**
 * Get the Levenshtein distance between two strings.
 * 
 * @param source The source string
 * @param target The target string
 * @returns The Levenshtein distance
 */
function getLevenshteinDistance(source: string, target: string): number {
  // Create a matrix
  const matrix: number[][] = Array(target.length + 1)
    .fill(null)
    .map(() => Array(source.length + 1).fill(null));
  
  // Fill the first row and column
  for (let i = 0; i <= source.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= target.length; j++) {
    matrix[j][0] = j;
  }
  
  // Fill the rest of the matrix
  for (let j = 1; j <= target.length; j++) {
    for (let i = 1; i <= source.length; i++) {
      const indicator = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[target.length][source.length];
}

/**
 * Find the best match for a string from a list of candidates.
 * 
 * @param input The input string to find a match for
 * @param candidates An array of candidate strings
 * @param minSimilarity Minimum similarity threshold (0-1)
 * @returns The best match and its similarity score, or null if no match meets the threshold
 */
export function findBestMatch(
  input: string, 
  candidates: string[], 
  minSimilarity: number = 0.7
): { match: string; similarity: number } | null {
  if (!input || !candidates || candidates.length === 0) {
    return null;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for exact matches first
  for (const candidate of candidates) {
    if (candidate.toLowerCase().trim() === normalizedInput) {
      return {
        match: candidate,
        similarity: 1
      };
    }
  }
  
  // Use fastest-levenshtein for quick approximate matching
  const closestMatch = closest(normalizedInput, candidates.map(c => c.toLowerCase().trim()));
  const closestCandidate = candidates.find(c => c.toLowerCase().trim() === closestMatch);
  
  if (!closestCandidate) return null;
  
  const similarity = calculateLevenshteinSimilarity(normalizedInput, closestMatch);
  
  return similarity >= minSimilarity 
    ? { match: closestCandidate, similarity }
    : null;
}

/**
 * Group similar strings together using Levenshtein similarity.
 * 
 * @param strings An array of strings to group
 * @param similarityThreshold The similarity threshold (0-1)
 * @returns An array of string groups
 */
export function groupSimilarStrings(
  strings: string[], 
  similarityThreshold: number = 0.8
): string[][] {
  if (!strings || strings.length === 0) return [];
  
  const groups: string[][] = [];
  const processedIndices = new Set<number>();
  
  for (let i = 0; i < strings.length; i++) {
    if (processedIndices.has(i)) continue;
    
    const currentGroup: string[] = [strings[i]];
    processedIndices.add(i);
    
    for (let j = i + 1; j < strings.length; j++) {
      if (processedIndices.has(j)) continue;
      
      const similarity = calculateLevenshteinSimilarity(
        strings[i].toLowerCase(),
        strings[j].toLowerCase()
      );
      
      if (similarity >= similarityThreshold) {
        currentGroup.push(strings[j]);
        processedIndices.add(j);
      }
    }
    
    groups.push(currentGroup);
  }
  
  return groups;
} 