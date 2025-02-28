import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EmployeeProfileForm from './EmployeeProfileForm';
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { hrDepartmentService } from '@/lib/services/hrDepartmentService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/PageHeader';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Copy, Info } from 'lucide-react';

const CreateEmployeePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsDataLoading(true);
        
        // Fetch departments
        const { data: departmentsData, error: departmentsError } = 
          await hrDepartmentService.getDepartments();
        
        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData || []);
        
        // Fetch positions
        const { data: positionsData, error: positionsError } = 
          await hrDepartmentService.getPositions();
        
        if (positionsError) throw positionsError;
        setPositions(positionsData || []);
        
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Failed to load form data. Please try again.');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchFormData();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      
      // Create employee using HR service with user account creation
      const { data, error, userAccount, authError } = await hrEmployeeService.createEmployeeWithUserAccount({
        name: formData.name,
        email: formData.email,
        department_id: formData.departmentId,
        position_id: formData.positionId || null,
        status: formData.status,
        notes: formData.notes || '',
        company_id: formData.companyId // This is needed for learner record creation
      });
      
      if (error) throw error;
      
      if (userAccount) {
        setCredentials(userAccount);
        setShowCredentials(true);
      } else if (authError) {
        toast.warning(
          'Employee created, but failed to create user account',
          { description: authError.message || 'Please create the user account manually.' }
        );
        setTimeout(() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES), 3000);
      } else {
        toast.success('Employee created successfully!');
        navigate(ROUTES.HR_DASHBOARD_EMPLOYEES);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(
        `Email: ${credentials.email}\nPassword: ${credentials.password}`
      );
      toast.success('Credentials copied to clipboard');
    }
  };

  const handleCloseCredentialsDialog = () => {
    setShowCredentials(false);
    setCredentials(null);
    navigate(ROUTES.HR_DASHBOARD_EMPLOYEES);
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Create New Employee"
        description="Add a new employee to the HR system"
        backButton={{
          label: 'Back to Employees',
          to: ROUTES.HR_DASHBOARD_EMPLOYEES
        }}
      />
      
      {isDataLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <EmployeeProfileForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          departments={departments}
          positions={positions}
        />
      )}

      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Account Created</DialogTitle>
            <DialogDescription>
              A learning platform account has been created for this employee.
              Please save or share these credentials securely with the employee.
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="space-y-4 py-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>User Credentials</AlertTitle>
                <AlertDescription className="mt-2">
                  <div><strong>Email:</strong> {credentials.email}</div>
                  <div><strong>Password:</strong> {credentials.password}</div>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                These credentials will not be shown again. Please make sure to save them securely.
              </p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyCredentials} className="flex gap-2">
              <Copy className="h-4 w-4" />
              Copy Credentials
            </Button>
            <Button onClick={handleCloseCredentialsDialog}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateEmployeePage; 