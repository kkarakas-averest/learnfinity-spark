import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, BarChart2, Users, Award, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

// Add type assertions for Recharts components
// This allows us to use them without TypeScript errors
const TypedPie = Pie as any;
const TypedBar = Bar as any;
const TypedXAxis = XAxis as any;
const TypedYAxis = YAxis as any;
const TypedTooltip = Tooltip as any;
const TypedLegend = Legend as any;
const TypedCell = Cell as any;

/**
 * EmployeeDataDashboard component for visualizing employee learning data
 * This component displays charts and statistics based on the seeded employee data
 */
const EmployeeDataDashboard: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('overview');
  
  // Data states
  const [skillDistribution, setSkillDistribution] = React.useState<any[]>([]);
  const [learningProgress, setLearningProgress] = React.useState<any[]>([]);
  const [courseCompletion, setCourseCompletion] = React.useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = React.useState<any[]>([]);
  
  // Summary metrics
  const [metrics, setMetrics] = React.useState({
    totalEmployees: 0,
    avgSkillLevel: 0,
    courseCompletionRate: 0,
    learningGoalsAchieved: 0
  });

  // Sample colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Load data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch employees count
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id');
        
        if (employeesError) throw new Error(`Error fetching employees: ${employeesError.message}`);
        
        // Fetch skill distribution
        const { data: skillsData, error: skillsError } = await supabase
          .from('skill_records')
          .select('skill_name, proficiency_level');
        
        if (skillsError) throw new Error(`Error fetching skills: ${skillsError.message}`);
        
        // Process skills data
        const skillsMap = new Map();
        skillsData?.forEach(skill => {
          if (!skillsMap.has(skill.skill_name)) {
            skillsMap.set(skill.skill_name, { 
              name: skill.skill_name, 
              count: 0, 
              avgLevel: 0,
              totalLevel: 0 
            });
          }
          const skillData = skillsMap.get(skill.skill_name);
          skillData.count++;
          skillData.totalLevel += skill.proficiency_level;
        });
        
        const processedSkillsData = Array.from(skillsMap.values()).map(skill => ({
          name: skill.name,
          count: skill.count,
          avgLevel: Math.round((skill.totalLevel / skill.count) * 10) / 10
        })).sort((a, b) => b.count - a.count).slice(0, 5);
        
        // Fetch department distribution
        const { data: employeesWithDept, error: deptError } = await supabase
          .from('employees')
          .select('department');
        
        if (deptError) throw new Error(`Error fetching departments: ${deptError.message}`);
        
        // Process department data
        const deptMap = new Map();
        employeesWithDept?.forEach(employee => {
          if (!deptMap.has(employee.department)) {
            deptMap.set(employee.department, { name: employee.department, count: 0 });
          }
          deptMap.get(employee.department).count++;
        });
        
        const processedDeptData = Array.from(deptMap.values());
        
        // Fake learning progress data (would come from learning_history table)
        const fakeProgressData = [
          { name: 'Week 1', progress: 20 },
          { name: 'Week 2', progress: 35 },
          { name: 'Week 3', progress: 45 },
          { name: 'Week 4', progress: 60 },
          { name: 'Week 5', progress: 75 },
          { name: 'Week 6', progress: 85 }
        ];
        
        // Fake course completion data (would come from learning_history table)
        const fakeCourseData = [
          { name: 'Completed', value: 68 },
          { name: 'In Progress', value: 22 },
          { name: 'Not Started', value: 10 }
        ];
        
        // Set all data states
        setSkillDistribution(processedSkillsData);
        setDepartmentStats(processedDeptData);
        setLearningProgress(fakeProgressData); // Replace with real data when available
        setCourseCompletion(fakeCourseData); // Replace with real data when available
        
        // Set summary metrics
        setMetrics({
          totalEmployees: employeesData?.length || 0,
          avgSkillLevel: 3.7, // Placeholder - calculate from actual data
          courseCompletionRate: 68, // Placeholder
          learningGoalsAchieved: 42 // Placeholder
        });
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Employee Learning Analytics</h2>
        <Button variant="outline" size="sm">
          <BarChart2 className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Users className="text-primary mr-2 h-4 w-4" />
              {metrics.totalEmployees}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Skill Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Award className="text-primary mr-2 h-4 w-4" />
              {metrics.avgSkillLevel} / 5
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Course Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <BookOpen className="text-primary mr-2 h-4 w-4" />
              {metrics.courseCompletionRate}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Goals Achieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Target className="text-primary mr-2 h-4 w-4" />
              {metrics.learningGoalsAchieved}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Distribution</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="progress">Learning Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course Completion Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Course Completion Status</CardTitle>
                <CardDescription>Distribution of course completion status across employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <TypedPie
                        data={courseCompletion}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseCompletion.map((entry, index) => (
                          <TypedCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </TypedPie>
                      <TypedTooltip />
                      <TypedLegend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex space-x-4">
                  <Badge variant="outline" className="bg-[#0088FE] text-white">
                    Completed: {courseCompletion[0]?.value}%
                  </Badge>
                  <Badge variant="outline" className="bg-[#00C49F] text-white">
                    In Progress: {courseCompletion[1]?.value}%
                  </Badge>
                  <Badge variant="outline" className="bg-[#FFBB28] text-white">
                    Not Started: {courseCompletion[2]?.value}%
                  </Badge>
                </div>
              </CardFooter>
            </Card>
            
            {/* Learning Progress Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Weekly Learning Progress</CardTitle>
                <CardDescription>Average learning progress over the past 6 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={learningProgress}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <TypedXAxis dataKey="name" />
                      <TypedYAxis />
                      <TypedTooltip />
                      <TypedLegend />
                      <TypedBar dataKey="progress" fill="#8884d8" name="Progress (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" />
                  Progress has increased by 15% over the past month
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Skills in Organization</CardTitle>
              <CardDescription>Most common skills among employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={skillDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <TypedXAxis type="number" />
                    <TypedYAxis type="category" dataKey="name" />
                    <TypedTooltip />
                    <TypedLegend />
                    <TypedBar dataKey="count" fill="#82ca9d" name="Employee Count" />
                    <TypedBar dataKey="avgLevel" fill="#8884d8" name="Avg. Proficiency (1-5)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Analysis</CardTitle>
              <CardDescription>Detailed breakdown of skill distribution across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={skillDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <TypedXAxis dataKey="name" />
                      <TypedYAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <TypedYAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <TypedTooltip />
                      <TypedLegend />
                      <TypedBar yAxisId="left" dataKey="count" fill="#8884d8" name="Employee Count" />
                      <TypedBar yAxisId="right" dataKey="avgLevel" fill="#82ca9d" name="Avg. Proficiency (1-5)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skill Proficiency Breakdown</h3>
                  
                  {skillDistribution.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <span>{skill.avgLevel} / 5</span>
                      </div>
                      <Progress value={skill.avgLevel * 20} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View All Skills</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
              <CardDescription>Employee distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <TypedPie
                      data={departmentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {departmentStats.map((entry, index) => (
                        <TypedCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </TypedPie>
                    <TypedTooltip />
                    <TypedLegend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress Over Time</CardTitle>
              <CardDescription>Weekly learning activity and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={learningProgress}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <TypedXAxis dataKey="name" />
                    <TypedYAxis />
                    <TypedTooltip />
                    <TypedLegend />
                    <TypedBar dataKey="progress" fill="#8884d8" name="Progress (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium">Progress Milestones</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Last Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">85%</div>
                      <p className="text-xs text-muted-foreground">10% increase</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Last Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">62%</div>
                      <p className="text-xs text-muted-foreground">25% increase</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Last Quarter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">45%</div>
                      <p className="text-xs text-muted-foreground">40% increase</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDataDashboard; 