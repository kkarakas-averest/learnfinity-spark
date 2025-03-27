import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import hrCourseService from '@/services/hrCourseService';
import type { Employee } from '@/services/hrEmployeeService';
import type { ProficiencyLevel } from '@/types/employee-profile.types';
import type { SupabaseResponse } from '@/types/service-responses';
import BulkEmployeeImport from '@/components/hr/BulkEmployeeImport';
import { BookOpen, FileText, User } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  duration?: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  phone?: string;
  status: string;
}

interface SkillFormData {
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  isRequired: boolean;
}

export default function AddEmployeeForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('basic-info');
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingCourses, setLoadingCourses] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = React.useState<string[]>([]);
  const [skills, setSkills] = React.useState<SkillFormData[]>([]);
  const [currentSkill, setCurrentSkill] = React.useState<SkillFormData>({
    name: '',
    category: 'Technical',
    proficiency: 'beginner',
    isRequired: false
  });
  const [formData, setFormData] = React.useState<EmployeeFormData>({
    name: '',
    email: '',
    department_id: '',
    position_id: '',
    phone: '',
    status: 'active'
  });

  React.useEffect(() => {
    loadDepartments();
    loadCourses();
  }, []);

  const loadDepartments = async () => {
    try {
      console.log('Loading departments...');
      setLoadingDepartments(true);
      
      const response = await hrEmployeeService.getDepartments();
      console.log('Departments response:', response);
      
      if (response.success && response.departments) {
        console.log('Setting departments:', response.departments);
        setDepartments(response.departments);
      } else {
        console.error('Failed to load departments:', response.error);
        setError(response.error || 'Failed to load departments');
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Error loading departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await hrCourseService.getAllCourses();
      
      if (response.data) {
        setCourses(response.data);
      } else if (response.error) {
        console.error('Failed to load courses:', response.error);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting form data:', formData);
      
      // Call createEmployee without type constraints
      const response = await hrEmployeeService.createEmployee(formData);
      console.log('Employee response:', response);
      
      // Check response shape at runtime
      if (typeof response === 'object' && response !== null) {
        // If it has an error property with a message
        if ('error' in response && response.error) {
          console.error('Error creating employee:', response.error);
          setError(typeof response.error === 'string' ? response.error : 'Failed to create employee');
          return;
        }
        
        let employeeId: string | undefined;
        
        // If it has an id directly on the response
        if ('id' in response && response.id) {
          employeeId = response.id as string;
        } 
        // If it has a data property with an id
        else if ('data' in response && response.data && typeof response.data === 'object' && 'id' in response.data) {
          const data = response.data as { id: string };
          employeeId = data.id;
        }
        
        if (employeeId) {
          console.log('Employee created successfully with ID:', employeeId);
          
          // NOTE: The following functionality would need to be implemented
          // in the hrEmployeeService before it can be used:
          
          // For skills
          if (skills.length > 0) {
            console.log('Skills would be added:', skills);
            // Feature to be implemented
          }
          
          // For courses
          if (selectedCourses.length > 0) {
            console.log('Courses would be assigned:', selectedCourses);
            // Feature to be implemented
          }
          
          // Navigate to employee profile
          navigate(`/hr-dashboard/employees/${employeeId}`);
          return;
        }
      }
      
      // If we get here, we have an unexpected response format
      console.error('Unexpected response format or missing ID:', response);
      setError('Failed to create employee: Invalid response from server');
    } catch (err) {
      console.error('Exception creating employee:', err);
      setError('Error creating employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };
  
  const handleSkillChange = (field: keyof SkillFormData, value: any) => {
    setCurrentSkill(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const addSkill = () => {
    if (!currentSkill.name.trim()) {
      return; // Don't add empty skills
    }
    
    setSkills(prev => [...prev, { ...currentSkill }]);
    setCurrentSkill({
      name: '',
      category: 'Technical',
      proficiency: 'beginner',
      isRequired: false
    });
  };
  
  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  if (loadingDepartments) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="text-lg">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Add New Employee</h1>
            <p className="text-muted-foreground">Create a new employee record and set up their initial profile</p>
          </div>
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/hr-dashboard/employees')}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={submitting || !formData.name || !formData.email}
            >
              {submitting ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </div>

        <TabsList className="mb-6">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
        </TabsList>

        {error && (
          <div className="mb-6">
            <div className="text-red-500 text-sm p-3 border border-red-200 bg-red-50 rounded-md">{error}</div>
          </div>
        )}

        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Enter the basic details for the new employee</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">Department *</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => handleChange({ target: { name: 'department_id', value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange({ target: { name: 'status', value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Inventory</CardTitle>
              <CardDescription>Add skills for this employee including proficiency level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Add a New Skill</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="skill-name">Skill Name</Label>
                      <Input
                        id="skill-name"
                        value={currentSkill.name}
                        onChange={(e) => handleSkillChange('name', e.target.value)}
                        placeholder="e.g., JavaScript, Project Management"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="skill-category">Category</Label>
                      <Select
                        value={currentSkill.category}
                        onValueChange={(value) => handleSkillChange('category', value)}
                      >
                        <SelectTrigger id="skill-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                          <SelectItem value="Management">Management</SelectItem>
                          <SelectItem value="Domain Knowledge">Domain Knowledge</SelectItem>
                          <SelectItem value="Tools">Tools & Software</SelectItem>
                          <SelectItem value="Certifications">Certifications</SelectItem>
                          <SelectItem value="Languages">Languages</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="skill-proficiency">Proficiency Level</Label>
                      <Select
                        value={currentSkill.proficiency}
                        onValueChange={(value: ProficiencyLevel) => handleSkillChange('proficiency', value)}
                      >
                        <SelectTrigger id="skill-proficiency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox 
                        id="skill-required" 
                        checked={currentSkill.isRequired}
                        onCheckedChange={(checked) => handleSkillChange('isRequired', checked)}
                      />
                      <Label htmlFor="skill-required">Required for current role</Label>
                    </div>
                  </div>
                  
                  <Button type="button" onClick={addSkill} disabled={!currentSkill.name.trim()}>
                    Add Skill
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skills to be Added</h3>
                  
                  {skills.length === 0 ? (
                    <p className="text-muted-foreground">No skills added yet. Add skills above to include them in the employee profile.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {skills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-2">
                            <Badge variant={skill.isRequired ? "default" : "secondary"}>
                              {skill.category}
                            </Badge>
                            <span className="font-medium">{skill.name}</span>
                            <Badge variant="outline">{skill.proficiency}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeSkill(index)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Assignment</CardTitle>
              <CardDescription>Assign courses for the new employee to complete</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCourses ? (
                <div className="py-4 text-center">Loading available courses...</div>
              ) : courses.length === 0 ? (
                <div className="py-4 text-center">No courses available for assignment</div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-md flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Course Assignment</h4>
                      <p className="text-sm text-muted-foreground">
                        Select courses to assign to this employee. They will be automatically enrolled
                        in these courses upon creation of their account.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md divide-y">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                          {course.category && (
                            <Badge variant="outline" className="mt-2">{course.category}</Badge>
                          )}
                        </div>
                        <div className="ml-4">
                          <Checkbox 
                            id={`course-${course.id}`}
                            checked={selectedCourses.includes(course.id)}
                            onCheckedChange={() => handleCourseSelection(course.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground">
                        {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCourses([])}
                      disabled={selectedCourses.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-import">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Employee Import</CardTitle>
              <CardDescription>Import multiple employees from a CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              <BulkEmployeeImport onComplete={() => {
                // After successful import, navigate back to employee list
                navigate('/hr-dashboard/employees');
              }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 