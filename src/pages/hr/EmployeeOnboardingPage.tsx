
import React, { useState } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ROUTES } from '@/lib/routes';
import EmployeeProfileForm from '@/components/hr/EmployeeProfileForm';
import { BulkEmployeeImport } from '@/components/hr/BulkEmployeeImport';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const EmployeeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('individual');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load departments
        const { data: departmentsData, error: departmentsError } = 
          await hrDepartmentService.getDepartments();
        
        if (departmentsError) {
          console.error('Error fetching departments:', departmentsError);
          toast.error('Failed to load departments');
          return;
        }
        setDepartments(departmentsData || []);
        
        // Load positions
        const { data: positionsData, error: positionsError } = 
          await hrDepartmentService.getPositions();
        
        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          toast.error('Failed to load positions');
          return;
        }
        setPositions(positionsData || []);
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      // Create the employee data object
      const employeeData = {
        name: formData.name,
        email: formData.email,
        department_id: formData.department,
        position_id: formData.position,
        status: formData.status || 'onboarding',
        phone: formData.phone || null
      };
      
      // Create the employee with user account
      const { data, error, userAccount } = await hrEmployeeService.createEmployeeWithUserAccount(employeeData);
      
      if (error) {
        throw error;
      }
      
      toast.success('Employee created successfully', {
        description: `A temporary password has been created for ${data.email}`
      });
      
      // Navigate back to employees list
      navigate(ROUTES.HR_DASHBOARD + '?tab=employees');
      
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.HR_DASHBOARD + '?tab=employees');
  };

  const handleBulkImportComplete = () => {
    // Optionally navigate or update UI after bulk import completes
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Employee Onboarding</h1>
          <p className="text-muted-foreground">Add new employees to the system</p>
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="individual">Individual Employee</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Individual Employee</CardTitle>
              <CardDescription>
                Create a single employee account. The employee will receive a welcome email with login instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !dataLoaded ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner />
                </div>
              ) : (
                <EmployeeProfileForm
                  departments={departments}
                  positions={positions}
                  onSubmit={handleSubmit}
                  isCreating={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkEmployeeImport onComplete={handleBulkImportComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeOnboardingPage;
