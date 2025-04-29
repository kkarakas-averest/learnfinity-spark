import React from 'react';
import { CourseAI } from '@/components/chat/CourseAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Book, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Local icon components for icons not exported by lucide-react
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);

const GraduationCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
  </svg>
);

// Local Plus icon
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Type for group card props
type GroupTypeCardProps = {
  title: string;
  icon: React.ReactNode;
  description: string;
  isSelected?: boolean;
  onClick?: () => void;
};

// Group type selection card
const GroupTypeCard = ({ title, icon, description, isSelected, onClick }: GroupTypeCardProps) => (
  <div 
    className={`border rounded-lg p-4 flex flex-col items-center text-center cursor-pointer transition-colors hover:bg-muted ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
    onClick={onClick}
  >
    <div className={`p-2 rounded-full ${isSelected ? 'bg-primary/10' : 'bg-muted'} mb-2`}>
      {icon}
    </div>
    <h3 className="font-medium text-sm mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

// Define the Employee type
type Employee = {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
};

// Department type
type Department = {
  id: string;
  name: string;
  employee_count?: number;
};

// Position type
type Position = {
  id: string;
  title: string;
  employee_count?: number;
};

// Course type
type Course = {
  id: string;
  title: string;
  description?: string;
  enrolled_count?: number;
};

// Functional ErrorBoundary
function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("Error caught by error boundary:", error);
      setHasError(true);
      
      // Optionally report to error monitoring service
      // if (window && (window as any).Sentry) (window as any).Sentry.captureException(error);
      
      // Prevent the error from bubbling up
      error.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="p-8 text-center text-red-600">
        Something went wrong in the chat. Please refresh the page.
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function CourseGeneratorPage() {
  const [activeTab, setActiveTab] = React.useState('chat');
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  
  // Bulk generation state
  const [groupType, setGroupType] = React.useState<'position' | 'department' | 'course' | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [bulkCourseTitle, setBulkCourseTitle] = React.useState('');
  const [bulkCourseDescription, setBulkCourseDescription] = React.useState('');
  const [difficultyLevel, setDifficultyLevel] = React.useState<string>('');
  const [groupEmployeeCount, setGroupEmployeeCount] = React.useState<number | null>(null);
  
  const { toast } = useToast();

  // Fetch employees when the component loads or the tab changes to 'assigned'
  React.useEffect(() => {
    if (activeTab === 'assigned') {
      fetchEmployees();
    } else if (activeTab === 'bulk') {
      // Reset the group type when entering bulk tab
      setGroupType(null);
      setSelectedGroupId(null);
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('id, name, email, hr_departments(name), hr_positions(title)')
        .order('name');

      if (error) {
        throw error;
      }

      // Map joined fields to department and position for UI
      setEmployees(
        (data || []).map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.hr_departments?.name || '',
          position: emp.hr_positions?.title || ''
        }))
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Failed to load employees',
        description: 'There was an error loading the employee list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };
  
  // Fetch group data based on the selected group type
  const fetchGroupData = async (type: 'position' | 'department' | 'course') => {
    setIsLoadingGroups(true);
    setSelectedGroupId(null);
    
    try {
      if (type === 'department') {
        // Fetch departments with employee count
        const { data, error } = await supabase
          .from('hr_departments')
          .select('id, name, hr_employees(id)')
          .order('name');
          
        if (error) throw error;
        
        setDepartments(
          (data || []).map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            employee_count: Array.isArray(dept.hr_employees) ? dept.hr_employees.length : 0
          }))
        );
      } 
      else if (type === 'position') {
        // Fetch positions with employee count
        const { data, error } = await supabase
          .from('hr_positions')
          .select('id, title, hr_employees(id)')
          .order('title');
          
        if (error) throw error;
        
        setPositions(
          (data || []).map((pos: any) => ({
            id: pos.id,
            title: pos.title,
            employee_count: Array.isArray(pos.hr_employees) ? pos.hr_employees.length : 0
          }))
        );
      }
      else if (type === 'course') {
        // Fetch courses with enrollment count
        const { data, error } = await supabase
          .from('hr_courses')
          .select('id, title, description, hr_course_enrollments(id)')
          .order('title');
          
        if (error) throw error;
        
        setCourses(
          (data || []).map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            enrolled_count: Array.isArray(course.hr_course_enrollments) ? course.hr_course_enrollments.length : 0
          }))
        );
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      toast({
        title: `Failed to load ${type} data`,
        description: `There was an error loading the ${type} list.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingGroups(false);
    }
  };
  
  // Handle group type selection
  const handleGroupTypeSelect = (type: 'position' | 'department' | 'course') => {
    setGroupType(type);
    fetchGroupData(type);
  };
  
  // Handle group selection
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    
    // Set employee count based on the selected group
    if (groupType === 'department') {
      const dept = departments.find((d: Department) => d.id === groupId);
      setGroupEmployeeCount(dept?.employee_count || 0);
    } 
    else if (groupType === 'position') {
      const pos = positions.find((p: Position) => p.id === groupId);
      setGroupEmployeeCount(pos?.employee_count || 0);
    }
    else if (groupType === 'course') {
      const course = courses.find((c: Course) => c.id === groupId);
      setGroupEmployeeCount(course?.enrolled_count || 0);
    }
  };
  
  // Handle bulk course generation
  const handleGenerateBulkCourses = () => {
    if (!groupType || !selectedGroupId || !bulkCourseTitle) {
      toast({
        title: 'Missing information',
        description: 'Please select a group and provide a course title.',
        variant: 'destructive'
      });
      return;
    }
    
    // Show confirmation toast
    toast({
      title: 'Bulk course generation initiated',
      description: `Creating "${bulkCourseTitle}" for ${groupEmployeeCount} employees in the selected ${groupType}.`,
    });
    
    // Implement the actual course generation logic here
    // This would typically involve a backend API call
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Generator</h1>
            <p className="text-muted-foreground mt-1">
              Create personalized courses using AI and employee skills data
            </p>
          </div>
        </div>

        <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              AI Course Designer
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee Specific
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bulk Generation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Course Designer</CardTitle>
                <CardDescription>
                  Engage with our AI to create customized learning content for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatErrorBoundary>
                  <CourseAI />
                </ChatErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee-Specific Course Design</CardTitle>
                <CardDescription>
                  Create personalized learning content targeted to specific employees and their skill gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-72">
                      <Select 
                        value={selectedEmployeeId || ''} 
                        onValueChange={handleEmployeeSelect}
                        disabled={isLoadingEmployees}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingEmployees ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : employees.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">
                              No employees found
                            </div>
                          ) : (
                            employees.map((employee: Employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.department || 'No department'})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={fetchEmployees}
                      disabled={isLoadingEmployees}
                    >
                      {isLoadingEmployees ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          Refresh List
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedEmployeeId ? (
                    <ChatErrorBoundary>
                      <CourseAI 
                        employeeId={selectedEmployeeId} 
                        initialMessage="I'd like to create a course for this employee based on their skill gaps and current role." 
                      />
                    </ChatErrorBoundary>
                  ) : (
                    <div className="bg-muted rounded-lg p-8 text-center">
                      <h3 className="text-lg font-medium mb-2">Select an Employee</h3>
                      <p className="text-muted-foreground">
                        Choose an employee from the dropdown to start designing a personalized course
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Course Generation</CardTitle>
                <CardDescription>
                  Create courses for groups of employees based on common criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Group Type Selector */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Group By</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <GroupTypeCard 
                        title="Position" 
                        icon={<BriefcaseIcon className="h-5 w-5" />} 
                        description="Group by job roles"
                        isSelected={groupType === 'position'}
                        onClick={() => handleGroupTypeSelect('position')}
                      />
                      <GroupTypeCard 
                        title="Department" 
                        icon={<BuildingIcon className="h-5 w-5" />} 
                        description="Group by departments"
                        isSelected={groupType === 'department'}
                        onClick={() => handleGroupTypeSelect('department')}
                      />
                      <GroupTypeCard 
                        title="Course" 
                        icon={<GraduationCapIcon className="h-5 w-5" />} 
                        description="Group by existing courses"
                        isSelected={groupType === 'course'}
                        onClick={() => handleGroupTypeSelect('course')}
                      />
                    </div>
                  </div>
                  
                  {/* Group Selection */}
                  {groupType && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Select {groupType === 'department' ? 'Department' : groupType === 'position' ? 'Job Position' : 'Course'}</h3>
                      <div className="space-y-2">
                        <Select
                          value={selectedGroupId || ''}
                          onValueChange={handleGroupSelect}
                          disabled={isLoadingGroups}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Choose a ${groupType}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingGroups ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : groupType === 'department' && departments.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">
                                No departments found
                              </div>
                            ) : groupType === 'position' && positions.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">
                                No positions found
                              </div>
                            ) : groupType === 'course' && courses.length === 0 ? (
                              <div className="p-2 text-center text-muted-foreground">
                                No courses found
                              </div>
                            ) : groupType === 'department' ? (
                              departments.map((dept: Department) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name} ({dept.employee_count || 0} employees)
                                </SelectItem>
                              ))
                            ) : groupType === 'position' ? (
                              positions.map((pos: Position) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.title} ({pos.employee_count || 0} employees)
                                </SelectItem>
                              ))
                            ) : (
                              courses.map((course: Course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title} ({course.enrolled_count || 0} enrolled)
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {/* Course Template */}
                  {selectedGroupId && groupType && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Course Template</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          placeholder="Course title" 
                          value={bulkCourseTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkCourseTitle(e.target.value)}
                        />
                        <Select
                          value={difficultyLevel}
                          onValueChange={setDifficultyLevel}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Difficulty level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea 
                        placeholder="Course description or additional personalization parameters" 
                        className="mt-2"
                        value={bulkCourseDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkCourseDescription(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {selectedGroupId && groupType && (
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="outline"
                        disabled={groupEmployeeCount === 0}
                      >
                        Preview Group ({groupEmployeeCount || 0} employees)
                      </Button>
                      <Button
                        onClick={handleGenerateBulkCourses}
                        disabled={!bulkCourseTitle || groupEmployeeCount === 0}
                      >
                        Generate Courses
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 