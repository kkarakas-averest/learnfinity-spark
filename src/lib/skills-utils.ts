/**
 * Utilities for working with skills data
 */

/**
 * Format skill gaps for inclusion in prompts
 */
export function formatSkillGapsForPrompt(gaps: Array<{ 
  skill_name: string; 
  proficiency_gap: number; 
  importance_level: number;
}>): string {
  if (!gaps || gaps.length === 0) return '';
  
  return gaps.map(gap => {
    const importanceText = gap.importance_level <= 2 ? 'low importance' :
      gap.importance_level === 3 ? 'medium importance' : 'high importance';
    
    const gapText = gap.proficiency_gap <= 1 ? 'minor gap' :
      gap.proficiency_gap === 2 ? 'moderate gap' : 'significant gap';
    
    return `- ${gap.skill_name}: ${gapText} (${importanceText}, gap size: ${gap.proficiency_gap})`;
  }).join('\n');
}

/**
 * Group skills by category
 */
export function groupSkillsByCategory(skills: Array<{
  skill_name: string;
  category_name?: string;
}>): Record<string, string[]> {
  const categories: Record<string, string[]> = {};
  
  skills.forEach(skill => {
    const category = skill.category_name || 'Uncategorized';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push(skill.skill_name);
  });
  
  return categories;
}

/**
 * Prioritize skills based on importance and gap
 */
export function prioritizeSkills(skills: Array<{
  skill_name: string;
  importance_level: number;
  proficiency_gap: number;
}>): Array<{
  skill_name: string;
  importance_level: number;
  proficiency_gap: number;
  priority_score: number;
}> {
  return skills.map(skill => ({
    ...skill,
    priority_score: skill.importance_level * skill.proficiency_gap
  }))
  .sort((a, b) => b.priority_score - a.priority_score);
} 