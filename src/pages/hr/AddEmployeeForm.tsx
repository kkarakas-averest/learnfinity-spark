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
      const response = await hrEmployeeService.getDepartments();
      if (response.success && response.departments) {
        setDepartments(response.departments);
      } else {
        setError(response.error || 'Failed to load departments');
      }
    } catch (err) {
      setError('Error loading departments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response: SupabaseResponse<Employee> = await hrEmployeeService.createEmployee(formData);
      
      if (response.error) {
        setError(response.error.message || 'Failed to create employee');
        return;
      }

      if (response.data?.id) {
        navigate(`/hr-dashboard/employees/${response.data.id}`);
      } else {
        setError('Failed to create employee: No ID returned');
      }
    } catch (err) {
      setError('Error creating employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 