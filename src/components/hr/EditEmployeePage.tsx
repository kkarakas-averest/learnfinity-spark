
import * as React from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  Upload, 
  FileText, 
  ArrowLeft, 
  UserCircle, 
  Building, 
  Phone, 
  Mail, 
  Key, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { hrEmployeeService, Employee } from '@/services/hrEmployeeService';
import { hrDepartmentService } from '@/lib/services/hrDepartmentService';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/routes';
import { 
  Tabs, 
  TabsContent, 
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hrUser } = useHRAuth() || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password management state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordType, setPasswordType] = useState<'reset' | 'change'>('reset');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const [formData, setFormData] = useState({
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
  useEffect(() => {
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
  useEffect(() => {
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
  
  const openPasswordDialog = (type: 'reset' | 'change') => {
    setPasswordType(type);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setResetPassword('');
    setShowPasswordDialog(true);
  };
  
  const handlePasswordAction = async () => {
    setPasswordError('');
    
    try {
      setIsPasswordLoading(true);
      
      if (passwordType === 'change') {
        // Validate password
        if (newPassword.length < 8) {
          setPasswordError('Password must be at least 8 characters long');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          setPasswordError('Passwords do not match');
          return;
        }
        
        // Update password
        const { success, error } = await hrEmployeeService.updateEmployeePassword(formData.email, newPassword);
        
        if (!success) {
          setPasswordError(error?.message || 'Failed to update password');
          return;
        }
        
        toast.success('Password updated successfully');
        setShowPasswordDialog(false);
      } else {
        // Reset password
        const { success, newPassword: generatedPassword, error } = await hrEmployeeService.resetEmployeePassword(formData.email);
        
        if (!success) {
          setPasswordError(error?.message || 'Failed to reset password');
          return;
        }
        
        setResetPassword(generatedPassword);
        toast.success('Password reset successfully');
      }
    } catch (error) {
      console.error('Error with password action:', error);
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsPasswordLoading(false);
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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Edit Employee</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => openPasswordDialog('reset')}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Password
          </Button>
          <Button 
            variant="outline" 
            onClick={() => openPasswordDialog('change')}
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            Change Password
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card className="w-full max-w-3xl mx-auto border shadow-sm bg-card">
            <CardHeader className="bg-muted/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
              <CardDescription>
                Update the employee's basic information and department assignment
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter employee name"
                        className="pl-9"
                        required
                      />
                      <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter employee email"
                        className="pl-9"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="pl-9"
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Select
                        value={formData.departmentId}
                        onValueChange={(value) => handleSelectChange('departmentId', value)}
                      >
                        <SelectTrigger className="pl-9">
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
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium">Position</Label>
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
                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-green-600">Active</SelectItem>
                        <SelectItem value="inactive" className="text-red-600">Inactive</SelectItem>
                        <SelectItem value="onboarding" className="text-blue-600">Onboarding</SelectItem>
                        <SelectItem value="on_leave" className="text-amber-600">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label htmlFor="resume" className="text-sm font-medium">Resume</Label>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {formData.resumeUrl && (
                      <a
                        href={formData.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <FileText className="h-4 w-4" />
                        View Current Resume
                      </a>
                    )}
                    <div className="flex-1">
                      <Label
                        htmlFor="resume-upload"
                        className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-muted transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{formData.resumeFile ? 'Change Resume' : 'Upload New Resume'}</span>
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
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <FileText className="h-4 w-4 text-primary" />
                      New file selected: {formData.resumeFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-4 bg-muted/30 py-4 px-6 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card className="w-full max-w-3xl mx-auto border shadow-sm">
            <CardHeader className="bg-muted/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage employee account security settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Password Management
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You can reset the employee's password or set a new password for their account.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-2">Reset Password</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate a new random secure password for this employee.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => openPasswordDialog('reset')}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset Password
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-2">Change Password</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Set a specific new password for this employee.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => openPasswordDialog('change')}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Password Management Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {passwordType === 'reset' ? 'Reset Password' : 'Change Password'}
            </DialogTitle>
            <DialogDescription>
              {passwordType === 'reset' 
                ? 'Generate a new random password for this employee' 
                : 'Set a new password for this employee'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {passwordError && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            {passwordType === 'change' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            ) : resetPassword ? (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTitle className="text-blue-800">New Password Generated</AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="font-mono bg-white p-2 rounded border mt-1 text-sm select-all">
                    {resetPassword}
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Please save this password securely or share it with the employee. This password will not be shown again.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-muted-foreground">
                This will generate a new random password for {formData.name}. The new password will be displayed for you to securely share with the employee.
              </p>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {resetPassword ? (
              <Button onClick={() => setShowPasswordDialog(false)}>Close</Button>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handlePasswordAction} 
                  disabled={isPasswordLoading || (passwordType === 'change' && (!newPassword || !confirmPassword))}
                >
                  {isPasswordLoading ? 'Processing...' : passwordType === 'reset' ? 'Reset Password' : 'Change Password'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditEmployeePage;
