import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import type { Employee } from '@/services/hrEmployeeService';
import type { SupabaseResponse } from '@/types/service-responses';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  phone?: string;
  status: string;
}

export default function AddEmployeeForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>([]);
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
        
        // If it has an id directly on the response
        if ('id' in response && response.id) {
          console.log('Employee created successfully, navigating to ID:', response.id);
          navigate(`/hr-dashboard/employees/${response.id}`);
          return;
        }
        
        // If it has a data property with an id
        if ('data' in response && response.data && typeof response.data === 'object' && 'id' in response.data) {
          const data = response.data as { id: string };
          console.log('Employee created successfully with data, navigating to:', data.id);
          navigate(`/hr-dashboard/employees/${data.id}`);
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

  if (loadingDepartments) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center">
        <div className="text-lg">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/hr-dashboard/employees')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 