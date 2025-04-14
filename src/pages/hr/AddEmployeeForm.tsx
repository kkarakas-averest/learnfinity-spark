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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import hrCourseService from '@/services/hrCourseService';
import type { ProficiencyLevel } from '@/types/employee-profile.types';
import type { SupabaseResponse } from '@/types/service-responses';
import BulkEmployeeImport from '@/components/hr/BulkEmployeeImport';
import { BookOpen, FileText, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Define our own interfaces for the component
interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  status: string;
  phone?: string;
  department?: string;
  position?: string;
}

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
  resumeFile?: File | null;
}

interface SkillFormData {
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  isRequired: boolean;
}

// Response types for the API calls
interface EmployeeResponse {
  success: boolean;
  data?: Employee;
  error?: string;
  id?: string;
}

interface SkillResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CourseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function AddEmployeeForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('basic-info');
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingPositions, setLoadingPositions] = React.useState(false);
  const [loadingCourses, setLoadingCourses] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [positions, setPositions] = React.useState<{id: string, title: string, department_id: string}[]>([]);
  const [filteredPositions, setFilteredPositions] = React.useState<{id: string, title: string, department_id: string}[]>([]);
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
    status: 'active',
    resumeFile: null
  });

  React.useEffect(() => {
    loadDepartments();
    loadPositions();
    loadCourses();
  }, []);

  // Update filtered positions when department changes
  React.useEffect(() => {
    if (formData.department_id) {
      setFilteredPositions(
        positions.filter(position => position.department_id === formData.department_id)
      );
    } else {
      setFilteredPositions([]);
    }
  }, [formData.department_id, positions]);

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

  const loadPositions = async () => {
    try {
      console.log('Loading positions...');
      setLoadingPositions(true);
      
      const { data, error } = await supabase
        .from('hr_positions')
        .select('id, title, department_id');
      
      if (error) {
        console.error('Failed to load positions:', error);
        setError(error.message || 'Failed to load positions');
      } else if (data) {
        console.log('Setting positions:', data);
        setPositions(data);
      }
    } catch (err) {
      console.error('Error loading positions:', err);
      setError('Error loading positions');
    } finally {
      setLoadingPositions(false);
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
    setSuccessMessage(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Employee name is required');
        setSubmitting(false);
        return;
      }

      if (!formData.email.trim()) {
        setError('Email address is required');
        setSubmitting(false);
        return;
      }

      if (!formData.department_id) {
        setError('Department selection is required');
        setSubmitting(false);
        return;
      }

      console.log('Submitting form data:', formData);
      
      // Call createEmployee
      const response = await hrEmployeeService.createEmployee(formData);
      console.log('Employee response:', response);
      
      // Explicitly cast response to any to handle different response shapes
      const anyResponse = response as any;
      
      // Check for errors
      if (anyResponse.error) {
        console.error('Error creating employee:', anyResponse.error);
        setError(anyResponse.error || 'Failed to create employee');
        setSubmitting(false);
        return;
      }
      
      // Employee creation was successful - get ID from response
      let employeeId: string | undefined;
      
      // Handle different response formats
      if (anyResponse.id) {
        employeeId = anyResponse.id;
      } else if (anyResponse.data && typeof anyResponse.data === 'object' && 'id' in anyResponse.data) {
        employeeId = anyResponse.data.id as string;
      }
      
      if (!employeeId) {
        setError('Employee created but no ID was returned');
        setSubmitting(false);
        return;
      }
      
      // Upload resume if provided
      if (formData.resumeFile && employeeId) {
        try {
          console.log('Uploading resume file...');
          const { data: resumeData, error: resumeError } = 
            await (hrEmployeeService as any).uploadEmployeeResume(employeeId, formData.resumeFile);
          
          if (resumeError) {
            console.warn('Resume upload failed:', resumeError);
          } else {
            console.log('Resume uploaded successfully:', resumeData);
            
            // Try to trigger CV processing
            if (resumeData?.resumeUrl) {
              try {
                console.log('Triggering CV processing...');
                const processCvResponse = await fetch('/api/hr/employees/process-cv', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    employeeId: employeeId,
                    cvUrl: resumeData.resumeUrl
                  })
                });
                
                if (processCvResponse.ok) {
                  console.log('CV processing triggered successfully');
                } else {
                  console.warn('CV processing request failed:', await processCvResponse.text());
                }
              } catch (processingError) {
                console.error('Error triggering CV processing:', processingError);
              }
            }
          }
        } catch (uploadErr) {
          console.error('Error uploading resume:', uploadErr);
        }
      }
      
      setSuccessMessage('Employee created successfully!');
      console.log('Employee created successfully with ID:', employeeId);
      
      // Add skills one by one
      let skillsAdded = 0;
      if (skills.length > 0) {
        try {
          for (const skill of skills) {
            const skillResponse = await (hrEmployeeService as any).addEmployeeSkill(employeeId, {
              name: skill.name,
              category: skill.category,
              proficiency: skill.proficiency,
              isRequired: skill.isRequired
            });
            
            if (!skillResponse.error) {
              skillsAdded++;
            } else {
              console.warn('Failed to add skill:', skill.name, skillResponse.error);
            }
          }
          console.log(`Added ${skillsAdded} of ${skills.length} skills`);
        } catch (skillErr) {
          console.error('Error adding skills:', skillErr);
        }
      }
      
      // Assign courses one by one
      let coursesAssigned = 0;
      if (selectedCourses.length > 0) {
        try {
          for (const courseId of selectedCourses) {
            // Use the server API endpoint
            const response = await fetch('/api/hr/course-assignment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                courseId,
                employeeId
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              coursesAssigned++;
            } else {
              console.warn('Failed to assign course:', courseId, result.error);
            }
          }
          console.log(`Assigned ${coursesAssigned} of ${selectedCourses.length} courses`);
        } catch (courseErr) {
          console.error('Error assigning courses:', courseErr);
        }
      }
      
      // Show success message with details
      const successDetails = [];
      if (skillsAdded > 0) {
        successDetails.push(`${skillsAdded} skills added`);
      }
      if (coursesAssigned > 0) {
        successDetails.push(`${coursesAssigned} courses assigned`);
      }
      
      const detailsMessage = successDetails.length > 0 
        ? ` (${successDetails.join(', ')})`
        : '';
        
      setSuccessMessage(`Employee created successfully${detailsMessage}!`);
      
      // Wait 1.5 seconds to show the success message before navigating
      setTimeout(() => {
        // Navigate to employee profile
        navigate(`/hr-dashboard/employees/${employeeId}`);
      }, 1500);
    } catch (err) {
      console.error('Exception creating employee:', err);
      setError('An unexpected error occurred. Please try again.');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        resumeFile: e.target.files?.[0] || null
      }));
    }
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

        {successMessage && (
          <div className="mb-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
              <CardDescription>Enter the basic details for the new employee</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                    placeholder="Enter employee's full name"
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
                    disabled={submitting}
                    placeholder="Enter employee's email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">Department *</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => handleChange({ target: { name: 'department_id', value } } as any)}
                    disabled={submitting}
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
                  <Label htmlFor="position_id">Position</Label>
                  <Select
                    value={formData.position_id}
                    onValueChange={(value) => handleChange({ target: { name: 'position_id', value } } as any)}
                    disabled={submitting || !formData.department_id || filteredPositions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.department_id ? "Select department first" : filteredPositions.length === 0 ? "No positions available" : "Select position"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPositions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title}
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
                    disabled={submitting}
                    placeholder="Enter employee's phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange({ target: { name: 'status', value } } as any)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resumeFile">CV/Resume</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={submitting}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a CV to automatically generate a profile summary (PDF, DOC, or DOCX)
                  </p>
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