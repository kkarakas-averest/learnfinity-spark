import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Upload, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { Checkbox } from '@/components/ui/checkbox';

// Define mock departments in case the API doesn't return any
const mockDepartments = [
  { id: 'dept-1', name: 'Engineering' },
  { id: 'dept-2', name: 'Marketing' },
  { id: 'dept-3', name: 'Human Resources' },
  { id: 'dept-4', name: 'Finance' },
  { id: 'dept-5', name: 'Product Management' },
  { id: 'dept-6', name: 'Sales' },
  { id: 'dept-7', name: 'Customer Support' },
  { id: 'dept-8', name: 'Operations' },
  { id: 'dept-9', name: 'Legal' }
];

// Define mock positions in case the API doesn't return any
const mockPositions = [
  // Engineering positions
  { id: 'pos-1', title: 'Software Engineer', department_id: 'dept-1' },
  { id: 'pos-2', title: 'Senior Software Engineer', department_id: 'dept-1' },
  { id: 'pos-3', title: 'Lead Engineer', department_id: 'dept-1' },
  { id: 'pos-4', title: 'DevOps Engineer', department_id: 'dept-1' },
  
  // Marketing positions
  { id: 'pos-5', title: 'Marketing Specialist', department_id: 'dept-2' },
  { id: 'pos-6', title: 'Marketing Manager', department_id: 'dept-2' },
  { id: 'pos-7', title: 'Digital Marketing Specialist', department_id: 'dept-2' },
  
  // HR positions
  { id: 'pos-8', title: 'HR Specialist', department_id: 'dept-3' },
  { id: 'pos-9', title: 'HR Manager', department_id: 'dept-3' },
  { id: 'pos-10', title: 'Recruiter', department_id: 'dept-3' },
  
  // Finance positions
  { id: 'pos-11', title: 'Financial Analyst', department_id: 'dept-4' },
  { id: 'pos-12', title: 'Accountant', department_id: 'dept-4' },
  { id: 'pos-13', title: 'Finance Manager', department_id: 'dept-4' },
  
  // Product Management positions
  { id: 'pos-14', title: 'Product Manager', department_id: 'dept-5' },
  { id: 'pos-15', title: 'Product Owner', department_id: 'dept-5' },
  
  // Sales positions
  { id: 'pos-16', title: 'Sales Representative', department_id: 'dept-6' },
  { id: 'pos-17', title: 'Account Manager', department_id: 'dept-6' },
  { id: 'pos-18', title: 'Sales Manager', department_id: 'dept-6' },
  
  // Customer Support positions
  { id: 'pos-19', title: 'Customer Support Specialist', department_id: 'dept-7' },
  { id: 'pos-20', title: 'Support Team Lead', department_id: 'dept-7' },
  
  // Operations positions
  { id: 'pos-21', title: 'Operations Analyst', department_id: 'dept-8' },
  { id: 'pos-22', title: 'Operations Manager', department_id: 'dept-8' },
  
  // Legal positions
  { id: 'pos-23', title: 'Legal Counsel', department_id: 'dept-9' },
  { id: 'pos-24', title: 'Compliance Officer', department_id: 'dept-9' }
];

// Define available courses
const availableCourses = [
  { id: 'course-1', title: 'Cybersecurity for Fintech', description: 'Essential security practices for fintech industry' },
  { id: 'course-2', title: 'New Employee Orientation', description: 'Introduction to company policies and procedures' },
  { id: 'course-3', title: 'Leadership Fundamentals', description: 'Core principles for effective leadership' }
];

const EmployeeProfileForm = ({ onSubmit, isLoading, departments = [], positions = [] }) => {
  const { hrUser } = useHRAuth() || {};
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    positionId: '',
    status: 'active',
    companyId: '',
    courseIds: [],
    resumeFile: null
  });
  
  const [error, setError] = useState(null);
  const [displayDepartments, setDisplayDepartments] = useState([]);
  const [displayPositions, setDisplayPositions] = useState([]);
  const [resumeFileName, setResumeFileName] = useState('');
  
  // Set the company ID from the HR user's context when component mounts
  useEffect(() => {
    if (hrUser?.company_id) {
      setFormData(prev => ({
        ...prev,
        companyId: hrUser.company_id
      }));
    } else {
      // Fallback company ID - use valid UUID
      setFormData(prev => ({
        ...prev,
        companyId: '4fb1a692-3995-40ee-8aa5-292fd8ebf029'
      }));
    }
  }, [hrUser]);
  
  // Set departments - use mock data if API returns empty array
  useEffect(() => {
    if (departments && departments.length > 0) {
      setDisplayDepartments(departments);
    } else {
      setDisplayDepartments(mockDepartments);
    }
  }, [departments]);
  
  // Set positions - use mock data if API returns empty array
  useEffect(() => {
    if (positions && positions.length > 0) {
      setDisplayPositions(positions);
    } else {
      setDisplayPositions(mockPositions);
    }
  }, [positions]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCourseToggle = (courseId) => {
    setFormData(prev => {
      const currentCourses = [...prev.courseIds];
      
      if (currentCourses.includes(courseId)) {
        return {
          ...prev,
          courseIds: currentCourses.filter(id => id !== courseId)
        };
      } else {
        return {
          ...prev,
          courseIds: [...currentCourses, courseId]
        };
      }
    });
  };
  
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const fileType = file.type;
      const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(fileType)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        resumeFile: file
      }));
      
      setResumeFileName(file.name);
      setError(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.departmentId) {
      setError('Please fill out all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Ensure companyId is set
    if (!formData.companyId) {
      console.warn('Company ID not set in form. Setting default UUID.');
      setFormData(prev => ({
        ...prev,
        companyId: '4fb1a692-3995-40ee-8aa5-292fd8ebf029'
      }));
    }
    
    // Check if at least one course is selected
    if (formData.courseIds.length === 0) {
      setError('Please select at least one course for the employee');
      return;
    }
    
    console.log('Submitting employee form with data:', {
      ...formData,
      resumeFile: formData.resumeFile ? `${formData.resumeFile.name} (${Math.round(formData.resumeFile.size / 1024)}KB)` : null
    });
    
    // Submit the form
    onSubmit(formData);
  };
  
  // Filter positions based on selected department
  const filteredPositions = formData.departmentId
    ? displayPositions.filter(pos => pos.department_id === formData.departmentId)
    : displayPositions;
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Employee Information</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="John Doe"
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
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Employee will be automatically registered with this email address
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select 
                value={formData.departmentId} 
                onValueChange={(value) => handleSelectChange('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {displayDepartments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="positionId">Position</Label>
              <Select 
                value={formData.positionId} 
                onValueChange={(value) => handleSelectChange('positionId', value)}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Resume upload section */}
          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF or DOCX, max 5MB)</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('resume').click()}
                className="w-full flex gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {resumeFileName ? 'Change Resume' : 'Upload Resume'}
              </Button>
              <input
                id="resume"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeUpload}
                className="hidden"
              />
            </div>
            {resumeFileName && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{resumeFileName}</span>
              </div>
            )}
          </div>
          
          {/* Course selection section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Course Enrollment</h3>
            <div className="space-y-2">
              {availableCourses.map(course => (
                <div key={course.id} className="flex items-start space-x-3">
                  <Checkbox 
                    id={`course-${course.id}`}
                    checked={formData.courseIds.includes(course.id)}
                    onCheckedChange={() => handleCourseToggle(course.id)}
                  />
                  <div>
                    <label 
                      htmlFor={`course-${course.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {course.title}
                    </label>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hidden input for company ID - populated automatically from HR user context */}
          <input type="hidden" name="companyId" value={formData.companyId} />
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Employee...' : 'Create Employee'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmployeeProfileForm; 