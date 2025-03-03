import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Upload, FileText, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { hrDepartmentService } from '@/lib/services/hrDepartmentService';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hrUser } = useHRAuth() || {};
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [departments, setDepartments] = React.useState([]);
  const [positions, setPositions] = React.useState([]);
  const [error, setError] = React.useState(null);
  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    departmentId: '',
    positionId: '',
    status: 'active',
    companyId: '',
    phone: '',
    resumeUrl: '',
    resumeFile: null
  });
  
  // Fetch employee data and departments when component mounts
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch employee details
        const { data: employee, error: employeeError } = await hrEmployeeService.getEmployee(id);
        if (employeeError) throw employeeError;
        
        // Fetch departments
        const { data: departmentData, error: departmentError } = await hrDepartmentService.getDepartments();
        if (departmentError) throw departmentError;
        
        // Set departments
        setDepartments(departmentData || []);
        
        // Set employee data
        if (employee) {
          setFormData({
            name: employee.name || '',
            email: employee.email || '',
            departmentId: employee.department_id || '',
            positionId: employee.position_id || '',
            status: employee.status || 'active',
            companyId: employee.company_id || hrUser?.company_id || '',
            phone: employee.phone || '',
            resumeUrl: employee.resume_url || '',
            resumeFile: null
          });
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        setError('Failed to load employee data. Please try again.');
        toast.error('Failed to load employee data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, hrUser]);
  
  // Fetch positions when department changes
  React.useEffect(() => {
    const fetchPositions = async () => {
      if (formData.departmentId) {
        try {
          const { data, error } = await hrDepartmentService.getPositions(formData.departmentId);
          if (error) throw error;
          setPositions(data || []);
        } catch (error) {
          console.error('Error fetching positions:', error);
          toast.error('Failed to load positions');
        }
      } else {
        setPositions([]);
      }
    };
    
    fetchPositions();
  }, [formData.departmentId]);
  
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
    
    // Clear position when department changes
    if (name === 'departmentId') {
      setFormData(prev => ({
        ...prev,
        positionId: ''
      }));
    }
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
    
    try {
      setIsLoading(true);
      
      // First update the employee details
      const { error: updateError } = await hrEmployeeService.updateEmployee(id, {
        name: formData.name,
        email: formData.email,
        department_id: formData.departmentId,
        position_id: formData.positionId,
        status: formData.status,
        phone: formData.phone
      });
      
      if (updateError) throw updateError;
      
      // If there's a new resume file, upload it
      if (formData.resumeFile) {
        const { error: resumeError } = await hrEmployeeService.uploadEmployeeResume(id, formData.resumeFile);
        if (resumeError) {
          console.error('Error uploading resume:', resumeError);
          toast.error('Failed to upload resume');
        }
      }
      
      toast.success('Employee updated successfully');
      navigate(ROUTES.HR_DASHBOARD_EMPLOYEES);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError('Failed to update employee. Please try again.');
      toast.error('Failed to update employee');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
        <h2 className="text-2xl font-bold">Edit Employee</h2>
      </div>
      
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter employee email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => handleSelectChange('departmentId', value)}
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
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) => handleSelectChange('positionId', value)}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            <div className="space-y-2">
              <Label htmlFor="resume">Resume</Label>
              <div className="flex items-center gap-4">
                {formData.resumeUrl && (
                  <a
                    href={formData.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Current Resume
                  </a>
                )}
                <div className="flex-1">
                  <Label
                    htmlFor="resume-upload"
                    className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload New Resume</span>
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                  </Label>
                </div>
              </div>
              {formData.resumeFile && (
                <p className="text-sm text-muted-foreground">
                  New file selected: {formData.resumeFile.name}
                </p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditEmployeePage; 