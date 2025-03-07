import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CareerGoal, Skill } from '@/types/employee-profile.types';
import { AlertTriangle, CheckCircle, Target, Calendar, BookOpen, Info, Award } from 'lucide-react';

interface CareerDevelopmentProps {
  careerGoals: CareerGoal[];
  skills: Skill[];
  isEditable?: boolean;
  onAddGoal?: () => void;
  onEditGoal?: (goalId: string) => void;
}

/**
 * Format a date for display
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No deadline';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};

/**
 * Get color class based on goal status
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'not_started':
      return 'bg-gray-100 text-gray-800';
    case 'deferred':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Calculate progress toward a goal based on required skills
 */
const calculateGoalProgress = (goal: CareerGoal, skills: Skill[]): number => {
  if (!goal.requiredSkills.length) return 0;
  
  const requiredSkillsCount = goal.requiredSkills.length;
  let achievedSkillsCount = 0;
  
  goal.requiredSkills.forEach(skillId => {
    const skill = skills.find(s => s.id === skillId);
    if (skill && (skill.proficiency === 'advanced' || skill.proficiency === 'expert')) {
      achievedSkillsCount++;
    }
  });
  
  return Math.round((achievedSkillsCount / requiredSkillsCount) * 100);
};

/**
 * Get skill name by ID
 */
const getSkillName = (skillId: string, skills: Skill[]): string => {
  const skill = skills.find(s => s.id === skillId);
  return skill ? skill.name : 'Unknown Skill';
};

/**
 * Get skill proficiency level by ID
 */
const getSkillLevel = (skillId: string, skills: Skill[]): string => {
  const skill = skills.find(s => s.id === skillId);
  return skill ? skill.proficiency : 'unknown';
};

/**
 * CareerDevelopment Component
 * 
 * Displays an employee's career goals and development progress
 */
const CareerDevelopment: React.FC<CareerDevelopmentProps> = ({
  careerGoals,
  skills,
  isEditable = false,
  onAddGoal,
  onEditGoal
}) => {
  const [activeTab, setActiveTab] = React.useState('goals');
  
  if (!careerGoals.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Career Development</CardTitle>
          <CardDescription>Career goals and development plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <p className="text-muted-foreground mb-4">
                No career goals have been recorded for this employee.
              </p>
              {isEditable && (
                <Button onClick={onAddGoal}>
                  Add First Goal
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter goals by status
  const activeGoals = careerGoals.filter(g => g.status === 'in_progress' || g.status === 'not_started');
  const completedGoals = careerGoals.filter(g => g.status === 'completed');
  const deferredGoals = careerGoals.filter(g => g.status === 'deferred');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Career Development</CardTitle>
          <CardDescription>
            {careerGoals.length} goal{careerGoals.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </div>
        {isEditable && (
          <Button variant="outline" size="sm" onClick={onAddGoal}>
            Add Goal
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="goals">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Award className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <BookOpen className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            {activeGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  Active Goals
                </h3>
                {activeGoals.map(goal => (
                  <div 
                    key={goal.id} 
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => isEditable && onEditGoal && onEditGoal(goal.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium">{goal.title}</h3>
                      <Badge className={`${getStatusColor(goal.status)} capitalize`}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {goal.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress</span>
                        <span>{calculateGoalProgress(goal, skills)}%</span>
                      </div>
                      <Progress value={calculateGoalProgress(goal, skills)} className="h-2" />
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Target: {formatDate(goal.targetDate)}
                      </div>
                      <div className="text-xs">
                        {goal.requiredSkills.length} required skill{goal.requiredSkills.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {completedGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Completed Goals
                </h3>
                {completedGoals.map(goal => (
                  <div 
                    key={goal.id} 
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors opacity-80"
                    onClick={() => isEditable && onEditGoal && onEditGoal(goal.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{goal.title}</h3>
                      <Badge className={`${getStatusColor(goal.status)} capitalize`}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {deferredGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  Deferred Goals
                </h3>
                {deferredGoals.map(goal => (
                  <div 
                    key={goal.id} 
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors opacity-80"
                    onClick={() => isEditable && onEditGoal && onEditGoal(goal.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{goal.title}</h3>
                      <Badge className={`${getStatusColor(goal.status)} capitalize`}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {goal.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Required Skills Progress</h3>
              
              <div className="space-y-4">
                {Array.from(new Set(
                  careerGoals.flatMap(goal => goal.requiredSkills)
                )).map((skillId: string) => {
                  const skill = skills.find(s => s.id === skillId);
                  if (!skill) return null;
                  
                  const proficiencyValue = {
                    'beginner': 25,
                    'intermediate': 50,
                    'advanced': 75,
                    'expert': 100
                  }[skill.proficiency] || 0;
                  
                  const proficiencyColor = {
                    'beginner': 'text-blue-500',
                    'intermediate': 'text-green-500',
                    'advanced': 'text-purple-500',
                    'expert': 'text-amber-500'
                  }[skill.proficiency] || 'text-gray-500';
                  
                  return (
                    <div key={skillId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{skill.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Required for {careerGoals.filter(g => g.requiredSkills.includes(skillId)).length} goal(s)
                          </p>
                        </div>
                        <Badge variant="outline" className={`${proficiencyColor} capitalize`}>
                          {skill.proficiency}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between items-center text-sm">
                          <span>Proficiency</span>
                          <span>{proficiencyValue}%</span>
                        </div>
                        <Progress value={proficiencyValue} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-md flex gap-2">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Skill Development</p>
                <p className="text-xs text-muted-foreground">
                  Advanced or Expert level proficiency in required skills helps achieve career goals.
                  Focus on skills that appear in multiple goals for maximum impact.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted">
                <h3 className="font-medium mb-2">Recommended Focus Areas</h3>
                <ul className="space-y-2">
                  {activeGoals.length > 0 ? (
                    activeGoals.map(goal => {
                      const missingSkills = goal.requiredSkills.filter(
                        skillId => {
                          const skill = skills.find(s => s.id === skillId);
                          return !skill || skill.proficiency === 'beginner' || skill.proficiency === 'intermediate';
                        }
                      );
                      
                      if (!missingSkills.length) return null;
                      
                      return (
                        <li key={goal.id} className="text-sm">
                          <strong>For "{goal.title}":</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            {missingSkills.map(skillId => (
                              <li key={skillId} className="text-muted-foreground flex items-center">
                                <Target className="h-3 w-3 mr-1" />
                                Improve {getSkillName(skillId, skills)} (currently {getSkillLevel(skillId, skills)})
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    }).filter(Boolean)
                  ) : (
                    <li className="text-sm text-muted-foreground">No active goals to generate recommendations</li>
                  )}
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Timeline Recommendations</h3>
                <div className="space-y-3">
                  {activeGoals
                    .filter(goal => goal.targetDate)
                    .sort((a, b) => {
                      if (!a.targetDate || !b.targetDate) return 0;
                      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
                    })
                    .map(goal => {
                      if (!goal.targetDate) return null;
                      
                      const daysRemaining = Math.ceil(
                        (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      const progress = calculateGoalProgress(goal, skills);
                      
                      let statusMessage = '';
                      let statusColor = '';
                      
                      if (daysRemaining < 0) {
                        statusMessage = 'Past deadline';
                        statusColor = 'text-red-500';
                      } else if (daysRemaining < 30 && progress < 50) {
                        statusMessage = 'Urgent attention needed';
                        statusColor = 'text-amber-500';
                      } else if (daysRemaining < 90 && progress < 30) {
                        statusMessage = 'Progress behind schedule';
                        statusColor = 'text-yellow-500';
                      } else if (progress > 75) {
                        statusMessage = 'On track to complete';
                        statusColor = 'text-green-500';
                      } else {
                        statusMessage = 'Needs regular focus';
                        statusColor = 'text-blue-500';
                      }
                      
                      return (
                        <div key={goal.id} className="text-sm border-b pb-2 last:border-0">
                          <div className="flex justify-between">
                            <span className="font-medium">{goal.title}</span>
                            <span>{formatDate(goal.targetDate)}</span>
                          </div>
                          <div className={`${statusColor}`}>
                            {statusMessage} • {daysRemaining < 0 ? Math.abs(daysRemaining) + ' days overdue' : daysRemaining + ' days remaining'}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CareerDevelopment; 