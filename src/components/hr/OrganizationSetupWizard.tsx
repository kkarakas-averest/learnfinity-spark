import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Settings,
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Trash2,
  Users
} from 'lucide-react';
import { Plus } from '@/components/ui/icons/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Position {
  id: string;
  title: string;
  department_id: string;
  description?: string;
}

const OrganizationSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartment, setNewDepartment] = useState<{name: string, description: string}>({
    name: '',
    description: ''
  });
  
  // Position state
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState<{title: string, department_id: string, description: string}>({
    title: '',
    department_id: '',
    description: ''
  });
  
  // Get existing departments when component loads
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const result = await hrEmployeeService.getDepartments();
        if (result.success && result.departments) {
          setDepartments(result.departments);
          
          // If departments exist, auto-navigate to step 2
          if (result.departments.length > 0) {
            setStep(2);
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDepartments();
  }, []);
  
  // Calculate progress percentage
  const progressPercentage = (step / 3) * 100;
  
  // Handle adding a new department
  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) {
      setError('Department name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API to create a department
      // For now, let's simulate API call and response
      
      // Generate a temporary ID
      const tempId = Math.random().toString(36).substr(2, 9);
      
      // Add the new department to state
      const newDept: Department = {
        id: tempId,
        name: newDepartment.name,
        description: newDepartment.description
      };
      
      setDepartments([...departments, newDept]);
      
      // Reset form
      setNewDepartment({
        name: '',
        description: ''
      });
      
      // Show success message
      toast({
        title: "Department Added",
        description: `${newDepartment.name} has been added to your organization.`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error adding department:', error);
      setError('Failed to add department');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding a new position
  const handleAddPosition = async () => {
    if (!newPosition.title.trim()) {
      setError('Position title is required');
      return;
    }
    
    if (!newPosition.department_id) {
      setError('Please select a department for this position');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API to create a position
      // For now, let's simulate API call and response
      
      // Generate a temporary ID
      const tempId = Math.random().toString(36).substr(2, 9);
      
      // Add the new position to state
      const newPos: Position = {
        id: tempId,
        title: newPosition.title,
        department_id: newPosition.department_id,
        description: newPosition.description
      };
      
      setPositions([...positions, newPos]);
      
      // Reset form
      setNewPosition({
        title: '',
        department_id: '',
        description: ''
      });
      
      // Show success message
      toast({
        title: "Position Added",
        description: `${newPosition.title} has been added to your organization.`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error adding position:', error);
      setError('Failed to add position');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle removing a department
  const handleRemoveDepartment = (id: string) => {
    setDepartments(departments.filter((dept: Department) => dept.id !== id));
  };
  
  // Handle removing a position
  const handleRemovePosition = (id: string) => {
    setPositions(positions.filter((pos: Position) => pos.id !== id));
  };
  
  // Handle completing the setup
  const handleComplete = () => {
    try {
      // In a real implementation, this would finalize the setup in the database
      // For now, let's just set a flag in localStorage
      localStorage.setItem('hasOrganizationSetup', 'true');
      
      // Set global onboarding state - tracks progress across the full flow
      localStorage.setItem('onboardingFlow', JSON.stringify({
        orgSetupComplete: true,
        currentStep: 4, // First 3 steps are org setup, 4+ are employee creation
        totalSteps: 6   // 3 org setup + 3 employee creation steps
      }));
      
      // Show success message
      toast({
        title: "Setup Complete",
        description: "Your organization structure has been set up successfully.",
        duration: 3000
      });
      
      // Navigate to add employees page
      navigate('/hr-dashboard/employees/new');
      
    } catch (error) {
      console.error('Error completing setup:', error);
      setError('Failed to complete setup');
    }
  };
  
  // Handle navigating between steps
  const handleNext = () => {
    if (step === 1 && departments.length === 0) {
      setError('Please add at least one department before proceeding');
      return;
    }
    
    if (step === 2 && positions.length === 0) {
      setError('Please add at least one position before proceeding');
      return;
    }
    
    setError(null);
    setStep(step + 1);
  };
  
  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };
  
  // Helper to get department name by ID
  const getDepartmentName = (id: string) => {
    const department = departments.find((dept: Department) => dept.id === id);
    return department ? department.name : 'Unknown Department';
  };
  
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Set Up Your Organization</h1>
        <p className="text-gray-600">Define your departments and positions before adding employees</p>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm">Step {step} of 3</span>
          <span className="text-sm">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Step 1: Add Departments */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Add Departments
            </CardTitle>
            <CardDescription>
              Start by defining the departments in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department-name">Department Name</Label>
                  <Input 
                    id="department-name" 
                    value={newDepartment.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setNewDepartment({...newDepartment, name: e.target.value})}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department-description">Description (Optional)</Label>
                  <Textarea 
                    id="department-description" 
                    value={newDepartment.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setNewDepartment({...newDepartment, description: e.target.value})}
                    placeholder="Brief description of this department"
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={handleAddDepartment} 
                  disabled={isLoading || !newDepartment.name.trim()}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </div>
              
              {departments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Your Departments</h3>
                  <div className="space-y-2">
                    {departments.map((dept: Department) => (
                      <div key={dept.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          {dept.description && (
                            <p className="text-sm text-muted-foreground">{dept.description}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveDepartment(dept.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/hr-dashboard')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNext}
              disabled={departments.length === 0}
            >
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 2: Add Positions */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Add Positions
            </CardTitle>
            <CardDescription>
              Define the positions within your departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="position-title">Position Title</Label>
                  <Input 
                    id="position-title" 
                    value={newPosition.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setNewPosition({...newPosition, title: e.target.value})}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department-id">Department</Label>
                  <select 
                    id="department-id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newPosition.department_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      setNewPosition({...newPosition, department_id: e.target.value})}
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position-description">Description (Optional)</Label>
                  <Textarea 
                    id="position-description" 
                    value={newPosition.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setNewPosition({...newPosition, description: e.target.value})}
                    placeholder="Brief description of this position"
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={handleAddPosition} 
                  disabled={isLoading || !newPosition.title.trim() || !newPosition.department_id}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Position
                </Button>
              </div>
              
              {positions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Your Positions</h3>
                  <div className="space-y-2">
                    {positions.map((pos: Position) => (
                      <div key={pos.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <p className="font-medium">{pos.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Department: {getDepartmentName(pos.department_id)}
                          </p>
                          {pos.description && (
                            <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemovePosition(pos.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={positions.length === 0}
            >
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 3: Review and Complete */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Review & Complete
            </CardTitle>
            <CardDescription>
              Review your organization structure before finalizing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  Departments ({departments.length})
                </h3>
                <div className="bg-muted p-3 rounded-md space-y-2">
                  {departments.map((dept: Department) => (
                    <div key={dept.id} className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span>{dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Positions ({positions.length})
                </h3>
                <div className="bg-muted p-3 rounded-md space-y-2">
                  {positions.map((pos: Position) => (
                    <div key={pos.id}>
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>{pos.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        Department: {getDepartmentName(pos.department_id)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-medium mb-2 flex items-center text-blue-700">
                  <Users className="mr-2 h-4 w-4" />
                  Next Steps
                </h3>
                <p className="text-sm text-blue-600">
                  After completing your organization setup, you'll be able to:
                </p>
                <ul className="text-sm text-blue-600 list-disc list-inside mt-2 space-y-1">
                  <li>Add employees individually or in bulk</li>
                  <li>Assign them to departments and positions</li>
                  <li>Manage their skills and development</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Setup & Add Employees
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default OrganizationSetupWizard; 