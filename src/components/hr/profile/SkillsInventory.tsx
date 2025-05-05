import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skill, ProficiencyLevel } from '@/types/employee-profile.types';
import { AlertTriangle, CheckCircle, Award } from 'lucide-react';

interface SkillsInventoryProps {
  skills: Skill[];
  requiredSkills?: Skill[];
  missingSkills?: Skill[];
  onAddSkill?: () => void;
  onEditSkill?: (skillId: string) => void;
  isEditable?: boolean;
  onGenerateLearningPath?: () => void;
}

/**
 * Convert a proficiency level to a numeric value for visualization
 */
const proficiencyToValue = (proficiency: ProficiencyLevel): number => {
  switch (proficiency) {
    case 'beginner': return 25;
    case 'intermediate': return 50;
    case 'advanced': return 75;
    case 'expert': return 100;
    default: return 0;
  }
};

/**
 * Get the color class for a proficiency level
 */
const getProficiencyColor = (proficiency: ProficiencyLevel): string => {
  switch (proficiency) {
    case 'beginner': return 'text-blue-500';
    case 'intermediate': return 'text-green-500';
    case 'advanced': return 'text-purple-500';
    case 'expert': return 'text-amber-500';
    default: return 'text-gray-500';
  }
};

/**
 * Group skills by category
 */
const groupSkillsByCategory = (skills: Skill[]): Record<string, Skill[]> => {
  return skills.reduce((groups, skill) => {
    const category = skill.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(skill);
    return groups;
  }, {} as Record<string, Skill[]>);
};

/**
 * SkillsInventory component 
 * 
 * Displays an employee's skills grouped by category with proficiency indicators
 */
const SkillsInventory: React.FC<SkillsInventoryProps> = ({
  skills,
  requiredSkills = [],
  missingSkills = [],
  onAddSkill,
  onEditSkill,
  isEditable = false,
  onGenerateLearningPath,
}: SkillsInventoryProps) => {
  if (!skills || skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills Inventory</CardTitle>
          <CardDescription>No skills recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                This employee does not have any skills recorded in their profile.
              </p>
              {isEditable && (
                <Button onClick={onAddSkill}>
                  Add First Skill
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const skillGroups: Record<string, Skill[]> = groupSkillsByCategory(skills);
  const totalRequired = requiredSkills.length;
  const totalMissing = missingSkills.length;
  const totalCovered = totalRequired - totalMissing;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Skills Inventory</CardTitle>
          <CardDescription>
            {skills.length} skill{skills.length !== 1 ? 's' : ''} recorded
            {totalRequired > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                | {totalCovered}/{totalRequired} required skills met
              </span>
            )}
          </CardDescription>
        </div>
        {isEditable && (
          <Button variant="outline" size="sm" onClick={onAddSkill}>
            Add Skill
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(skillGroups).map(([category, categorySkills]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-lg flex items-center">
                <Award className="h-4 w-4 mr-2" />
                {category}
                <Badge variant="outline" className="ml-2">
                  {categorySkills.length}
                </Badge>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categorySkills.map((skill) => (
                  <div 
                    key={skill.id} 
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => isEditable && onEditSkill && onEditSkill(skill.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{skill.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium ${getProficiencyColor(skill.proficiency)} capitalize`}>
                            {skill.proficiency}
                          </span>
                          {skill.isRequired && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Required
                            </Badge>
                          )}
                          {skill.lastAssessed && (
                            <span className="text-xs text-muted-foreground">
                              Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Visual proficiency indicator */}
                      <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center">
                        <span className={`text-sm font-bold ${getProficiencyColor(skill.proficiency)}`}>
                          {proficiencyToValue(skill.proficiency) / 25}
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={proficiencyToValue(skill.proficiency)} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Required skills summary and missing skills visualization */}
          {totalRequired > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md flex gap-2 items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {totalMissing === 0
                    ? 'All required skills for this role are covered!'
                    : `${totalMissing} required skill${totalMissing > 1 ? 's are' : ' is'} missing for this role.`}
                </p>
                {totalMissing > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {missingSkills.map((skill: Skill) => (
                      <Badge key={skill.id} variant="destructive" className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {totalMissing > 0 && onGenerateLearningPath && (
                  <Button size="sm" className="mt-2" onClick={onGenerateLearningPath}>
                    Generate Learning Path for Missing Skills
                  </Button>
                )}
              </div>
            </div>
          )}
          {/* Required skills check */}
          {skills.some((s: Skill) => s.isRequired) && (
            <div className="mt-4 p-3 bg-muted rounded-md flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Required Skills</p>
                <p className="text-xs text-muted-foreground">
                  Skills marked as "Required" are essential for the employee's current role.
                  Ensure these skills are regularly assessed and developed.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsInventory; 