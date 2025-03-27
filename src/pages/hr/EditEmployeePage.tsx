import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status?: string;
  skills?: string[];
}

const EditEmployeePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active',
    skills: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch employee
        const { data: employeeData, error: employeeError } = await hrEmployeeService.getEmployee(id);
        
        if (employeeError) throw new Error('Failed to fetch employee data');
        
        if (employeeData) {
          const typedEmployeeData = employeeData as Employee;
          setEmployee(typedEmployeeData);
          // Initialize form with employee data
          setFormData({
            name: typedEmployeeData.name || '',
            email: typedEmployeeData.email || '',
            phone: typedEmployeeData.phone || '',
            department_id: typedEmployeeData.department_id || '',
            position_id: typedEmployeeData.position_id || '',
            hire_date: typedEmployeeData.hire_date || '',
            status: typedEmployeeData.status || 'active',
            skills: Array.isArray(typedEmployeeData.skills) 
              ? typedEmployeeData.skills.join(', ') 
              : ''
          });
        }
        
        // Fetch departments
        const { departments: deptData, error: deptError } = await hrEmployeeService.getDepartments();
        
        if (deptError) {
          console.error('Error fetching departments:', deptError);
        } else {
          setDepartments(deptData || []);
        }
        
        // Fetch positions (simplified approach since we don't have a method for this)
        const { data: positionsData, error: positionsError } = await supabase
          .from('hr_positions')
          .select('id, title, department_id');
          
        if (!positionsError) {
          setPositions(positionsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load employee data'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setSubmitting(true);
    try {
      // Prepare data for update
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department_id: formData.department_id,
        position_id: formData.position_id,
        hire_date: formData.hire_date,
        status: formData.status
      };
      
      // Update employee
      const { success, error } = await hrEmployeeService.updateEmployee(id, updateData);
      
      if (error) throw error;
      
      // Add skills if provided (simplified implementation)
      if (formData.skills.trim()) {
        const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        
        for (const skillName of skillsArray) {
          try {
            // Use direct Supabase call since addEmployeeSkill might not exist
            const { error: skillError } = await supabase
              .from('hr_employee_skills')
              .insert({
                employee_id: id,
                skill_name: skillName,
                proficiency_level: 'intermediate',
                is_in_progress: false
              });
            
            if (skillError && skillError.code !== 'PGRST204') {
              console.error('Error adding skill:', skillError);
            }
          } catch (skillError) {
            console.error('Error adding skill:', skillError);
          }
        }
      }
      
      toast({
        title: 'Success',
        description: 'Employee profile updated successfully'
      });
      
      // Navigate back to employee profile
      navigate(`${ROUTES.HR_DASHBOARD}/employee/${id}`);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update employee profile'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <Button 
          variant="outline"
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employee/${id}`)}
        >
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department_id">Department</Label>
                <Select 
                  value={formData.department_id} 
                  onValueChange={(value) => handleSelectChange('department_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
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
                  onValueChange={(value) => handleSelectChange('position_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions
                      .filter(pos => !formData.department_id || pos.department_id === formData.department_id)
                      .map(pos => (
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
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="JavaScript, React, TypeScript, etc."
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employee/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditEmployeePage;
