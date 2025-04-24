import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';

interface SkillMatrixProps {
  companyId?: string;
}

type Department = {
  id: string;
  name: string;
};

type SkillData = {
  proficiency: number;
  gap: number;
  isMissing: boolean;
  count: number;
};

type EmployeeData = {
  id: string;
  name: string;
  departmentName: string;
  positionName: string;
  skills: Record<string, SkillData>;
  assessedAt: string;
};

type Assessment = {
  id: string;
  employee_id: string;
  assessed_at: string;
  hr_skill_assessment_details: Array<{
    id: string;
    skill_name: string;
    proficiency_level: number;
    gap_level: number;
    is_missing: boolean;
  }>;
  hr_employees: {
    id: string;
    name: string;
    department_id?: string;
    position_id?: string;
    hr_departments?: {
      id: string;
      name: string;
    };
    hr_positions?: {
      id: string;
      title: string;
    };
  };
};

export function SkillsMatrix({ companyId }: SkillMatrixProps) {
  const [loading, setLoading] = React.useState(true);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [department, setDepartment] = React.useState<string>('all');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [viewType, setViewType] = React.useState<'heatmap' | 'numbers'>('heatmap');
  const [skillFilter, setSkillFilter] = React.useState<string>('all');
  
  React.useEffect(() => {
    fetchAssessments();
    fetchDepartments();
  }, [companyId]);
  
  async function fetchAssessments() {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('hr_skill_assessments')
        .select(`
          id,
          employee_id,
          assessed_at,
          hr_skill_assessment_details (
            id,
            skill_name,
            proficiency_level,
            gap_level,
            is_missing
          ),
          hr_employees (
            id,
            name,
            department_id,
            position_id,
            hr_departments (
              id,
              name
            ),
            hr_positions (
              id,
              title
            )
          )
        `)
        .order('assessed_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching assessments:', error);
        throw error;
      } 
      
      setAssessments((data as unknown as Assessment[]) || []);
    } catch (error) {
      console.error('Failed to load skills matrix data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchDepartments() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('id, name')
        .eq('company_id', companyId || '');
        
      if (error) {
        console.error('Error fetching departments:', error);
      } else {
        setDepartments((data || []) as Department[]);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  }
  
  // Filter assessments by department if selected
  const filteredAssessments: Assessment[] = assessments.filter((a: Assessment) => {
    if (department === 'all') return true;
    return a.hr_employees?.hr_departments?.id === department;
  });
  
  // Extract all unique skills across assessments
  const allSkills: string[] = [...new Set(
    filteredAssessments.flatMap((a: Assessment) => 
      a.hr_skill_assessment_details?.map((d) => d.skill_name) || []
    )
  )].sort();
  
  // Filter skills if a specific one is selected
  const displayedSkills: string[] = skillFilter === 'all' 
    ? allSkills 
    : allSkills.filter((skill: string) => skill.toLowerCase().includes(skillFilter.toLowerCase()));
  
  // Group by employees and get latest assessment per employee
  const employeeMap: Record<string, EmployeeData> = {};
  
  filteredAssessments.forEach((assessment: Assessment) => {
    const employee = assessment.hr_employees;
    if (!employee) return;
    
    const employeeId = employee.id;
    const assessmentDate = new Date(assessment.assessed_at);
    
    // Only use this assessment if it's newer than what we already have
    if (!employeeMap[employeeId] || new Date(employeeMap[employeeId].assessedAt) < assessmentDate) {
      employeeMap[employeeId] = {
        id: employeeId,
        name: employee.name,
        departmentName: employee.hr_departments?.name || 'Unknown Department',
        positionName: employee.hr_positions?.title || 'Unknown Position',
        assessedAt: assessment.assessed_at,
        skills: {}
      };
    }
    
    // Add skills data
    if (assessment.hr_skill_assessment_details) {
      assessment.hr_skill_assessment_details.forEach((detail) => {
        const existingSkill = employeeMap[employeeId].skills[detail.skill_name];
        
        if (existingSkill) {
          // Update existing skill with new assessment data
          existingSkill.proficiency = detail.proficiency_level;
          existingSkill.gap = detail.gap_level;
          existingSkill.isMissing = detail.is_missing;
          existingSkill.count += 1;
        } else {
          // Add new skill
          employeeMap[employeeId].skills[detail.skill_name] = {
            proficiency: detail.proficiency_level,
            gap: detail.gap_level,
            isMissing: detail.is_missing,
            count: 1
          };
        }
      });
    }
  });
  
  const employees: EmployeeData[] = Object.values(employeeMap);
  
  function getSkillCellClass(skillData: SkillData | undefined) {
    if (!skillData) return 'bg-gray-100';
    if (skillData.isMissing) return 'bg-red-100 text-red-600';
    
    // Color based on proficiency
    const proficiencyColors = [
      'bg-red-100 text-red-700',     // 0 - None
      'bg-orange-100 text-orange-700', // 1 - Basic
      'bg-yellow-100 text-yellow-700', // 2 - Intermediate
      'bg-green-100 text-green-700',   // 3 - Proficient
      'bg-blue-100 text-blue-700',     // 4 - Advanced
      'bg-purple-100 text-purple-700'  // 5 - Expert
    ];
    
    return proficiencyColors[Math.min(skillData.proficiency, 5)];
  }
  
  function formatSkillValue(skillData: SkillData | undefined) {
    if (!skillData) return '–';
    if (skillData.isMissing) return 'Missing';
    
    // Text representations for the numbers
    const proficiencyLabels = ['None', 'Basic', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
    
    return viewType === 'numbers' 
      ? skillData.proficiency
      : proficiencyLabels[Math.min(skillData.proficiency, 5)];
  }
  
  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle>Skills Matrix</CardTitle>
            <CardDescription>
              Overview of employee skill proficiency across the organization
            </CardDescription>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select
              value={department}
              onValueChange={setDepartment}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={skillFilter}
              onValueChange={setSkillFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map((skill: string) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Tabs value={viewType} onValueChange={(v: string) => setViewType(v as 'heatmap' | 'numbers')} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="heatmap">Labels</TabsTrigger>
                <TabsTrigger value="numbers">Numbers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {assessments.length === 0 ? (
          <div className="p-6 text-center">
            <Info className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-lg font-medium">No Assessment Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete skills assessments to populate the matrix.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left sticky left-0 bg-muted z-10 min-w-[200px]">Employee</th>
                  {displayedSkills.map((skill: string) => (
                    <th key={skill} className="p-2 text-center whitespace-nowrap min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-[120px]">{skill}</div>
                          </TooltipTrigger>
                          <TooltipContent>{skill}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee: EmployeeData) => (
                  <tr key={employee.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 sticky left-0 bg-background z-10 min-w-[200px]">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.positionName}, {employee.departmentName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(employee.assessedAt).toLocaleDateString()}
                      </div>
                    </td>
                    
                    {displayedSkills.map((skill: string) => {
                      const skillData = employee.skills[skill];
                      return (
                        <td 
                          key={skill} 
                          className={`p-2 text-center ${getSkillCellClass(skillData)}`}
                        >
                          {formatSkillValue(skillData)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {employees.length === 0 && (
                  <tr>
                    <td 
                      colSpan={displayedSkills.length + 1} 
                      className="p-4 text-center text-muted-foreground"
                    >
                      No skills assessment data available for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-red-100"></span>
            <span className="text-xs">Missing</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-orange-100"></span>
            <span className="text-xs">Basic</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-yellow-100"></span>
            <span className="text-xs">Intermediate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-green-100"></span>
            <span className="text-xs">Proficient</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-blue-100"></span>
            <span className="text-xs">Advanced</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 inline-block bg-purple-100"></span>
            <span className="text-xs">Expert</span>
          </div>
        </div>
        
        {/* Refresh button */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAssessments()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh Data'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 