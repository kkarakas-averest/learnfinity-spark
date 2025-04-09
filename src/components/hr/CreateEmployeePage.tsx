import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import EmployeeProfileForm from './EmployeeProfileForm';
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';

// Define interfaces
interface FormData {
  name: string;
  email: string;
  departmentId: string;
  positionId: string;
  status: string;
  companyId: string;
  courseIds: string[];
  resumeFile: File | null;
}

interface EmployeeData {
  name: string;
  email: string;
  department_id: string;
  position_id: string;
  status: string;
  company_id: string;
  hire_date: string;
  course_ids: string[];
  resume_url?: string; // Optional property for resume URL
}

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch departments and positions when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get departments
        const deptResult = await hrEmployeeService.getDepartments();
        if (deptResult.success) {
          setDepartments(deptResult.departments);
        } else {
          console.error('Failed to fetch departments:', deptResult.error);
        }
        
        // Get positions
        const posResult = await hrEmployeeService.getPositions();
        if (posResult.success) {
          setPositions(posResult.positions);
        } else {
          console.error('Failed to fetch positions:', posResult.error);
        }
      } catch (err) {
        console.error('Error fetching department/position data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format the data as expected by the API
      const employeeData: EmployeeData = {
        name: formData.name,
        email: formData.email,
        department_id: formData.departmentId,
        position_id: formData.positionId,
        status: formData.status || 'active',
        company_id: formData.companyId,
        hire_date: new Date().toISOString().split('T')[0], // Today's date
        course_ids: formData.courseIds || [] 
      };
      
      // Create the employee first to get the ID
      const result = await hrEmployeeService.createEmployee(employeeData);
      
      if (result.success && result.data) {
        const employeeId = result.data.id;
        
        // Upload resume if provided
        if (formData.resumeFile && employeeId) {
          try {
            const { data: resumeData, error: resumeError } = await hrEmployeeService.uploadEmployeeResume(employeeId, formData.resumeFile);
            if (resumeError) {
              console.warn('Resume upload failed:', resumeError.message);
            }
          } catch (uploadErr) {
            console.warn('Error uploading resume:', uploadErr);
          }
        }
        
        // Navigate back to employee list on success
        navigate(`${ROUTES.HR_DASHBOARD}/employees`);
      } else {
        setError(result.error || 'Failed to create employee');
        console.error('Employee creation failed:', result.error);
      }
    } catch (err) {
      setError('An error occurred while creating the employee');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add New Employee</h1>
        <Button 
          variant="outline"
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
        >
          Cancel
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeProfileForm 
            onSubmit={handleSubmit}
            isLoading={loading}
            departments={departments}
            positions={positions}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEmployeePage;
