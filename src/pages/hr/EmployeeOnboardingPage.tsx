import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { OnboardingService } from '@/services/onboarding.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { EmployeeOnboardingData } from '@/types/hr.types';

const onboardingService = OnboardingService.getInstance();

const EmployeeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState([
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Marketing' },
    { id: '3', name: 'Sales' },
    { id: '4', name: 'HR' }
  ]);
  
  const [formData, setFormData] = React.useState<Partial<EmployeeOnboardingData>>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    experience: {
      years: 0,
      level: 'junior',
      previousRoles: []
    },
    skills: [],
    learningPreferences: {
      preferredLearningStyle: 'visual',
      preferredContentTypes: ['video', 'interactive'],
      learningGoals: []
    }
  });

  const fetchDepartments = async () => {
    try {
      // In a real app, you would fetch departments from API
      console.log('Fetching departments');
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive'
      });
    }
  };
  
  React.useEffect(() => {
    fetchDepartments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'experience') {
      // Map the experience dropdown value to the correct structure
      const experienceLevelMap: Record<string, { years: number, level: 'junior' | 'mid' | 'senior' }> = {
        'entry': { years: 0, level: 'junior' },
        'mid': { years: 3, level: 'mid' },
        'senior': { years: 5, level: 'senior' },
        'lead': { years: 8, level: 'senior' }
      };
      
      setFormData(prev => ({
        ...prev,
        experience: {
          ...experienceLevelMap[value],
          previousRoles: prev.experience?.previousRoles || []
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a temporary password
      const temporaryPassword = Math.random().toString(36).slice(-8);

      const result = await onboardingService.handleEmployeeOnboarding({
        ...formData as EmployeeOnboardingData,
        temporaryPassword
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Employee onboarded successfully'
        });
        navigate(`${ROUTES.HR_DASHBOARD}/employees`);
      } else {
        throw new Error(result.error || 'Failed to onboard employee');
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to onboard employee',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Employee Onboarding</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div>
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

        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="department">Department</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => handleSelectChange('department', value)}
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

        <div>
          <Label htmlFor="experience">Experience Level</Label>
          <Select
            value={formData.experience?.level || ''}
            onValueChange={(value) => handleSelectChange('experience', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Onboarding...' : 'Onboard Employee'}
        </Button>
      </form>

      <div className="mt-10 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Bulk Import Employees</h2>
        <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
          <p className="mb-4">Upload a CSV file with employee information</p>
          <input 
            type="file" 
            accept=".csv"
            className="hidden" 
            id="csv-upload" 
          />
          <label 
            htmlFor="csv-upload"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 cursor-pointer"
          >
            Select CSV File
          </label>
          <p className="mt-4 text-sm text-gray-500">
            CSV should include: First Name, Last Name, Email, Department, Role, Experience Level
          </p>
        </div>
        
        <div className="mt-4">
          <a 
            href="#" 
            className="text-blue-600 hover:underline text-sm"
            onClick={(e) => {
              e.preventDefault();
              alert('Template would download in a real implementation');
            }}
          >
            Download CSV Template
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingPage;
