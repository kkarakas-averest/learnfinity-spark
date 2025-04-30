import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Users, Bookmark } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  department_id?: string;
  position_id?: string;
}

interface BulkGenerationFormProps {
  onSuccess: (jobId: string, totalEmployees: number, estimatedTimeMinutes: number) => void;
  onCancel: () => void;
}

export function BulkGenerationForm({ onSuccess, onCancel }: BulkGenerationFormProps) {
  // Form state
  const [groupType, setGroupType] = React.useState<'department' | 'position'>('department');
  const [groupId, setGroupId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [difficultyLevel, setDifficultyLevel] = React.useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  // Data state
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<Employee[]>([]);
  const [employeeCount, setEmployeeCount] = React.useState(0);

  // UI state
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDataLoading, setIsDataLoading] = React.useState(true);

  // Load departments, positions and employees
  React.useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch departments
        const { data: deptData, error: deptError } = await supabase
          .from('hr_departments')
          .select('id, name');
          
        if (deptError) throw deptError;
        setDepartments(deptData || []);
        
        // Fetch positions
        const { data: posData, error: posError } = await supabase
          .from('hr_positions')
          .select('id, name, department_id');
          
        if (posError) throw posError;
        setPositions(posData || []);
        
        // Fetch employees
        const { data: empData, error: empError } = await supabase
          .from('hr_employees')
          .select('id, name, department_id, position_id')
          .eq('status', 'active');
          
        if (empError) throw empError;
        setEmployees(empData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error loading data',
          description: 'Could not load departments, positions, or employees.',
          variant: 'destructive',
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Update filtered employees when group changes
  React.useEffect(() => {
    if (!groupId) {
      setFilteredEmployees([]);
      setEmployeeCount(0);
      return;
    }
    
    const filtered = employees.filter((employee: Employee) => 
      groupType === 'department' 
        ? employee.department_id === groupId
        : employee.position_id === groupId
    );
    
    setFilteredEmployees(filtered);
    setEmployeeCount(filtered.length);
  }, [groupId, groupType, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!groupId) {
      toast({
        title: 'Missing selection',
        description: `Please select a ${groupType}.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!title || title.length < 5) {
      toast({
        title: 'Invalid title',
        description: 'Course title must be at least 5 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    if (employeeCount === 0) {
      toast({
        title: 'No employees',
        description: `There are no active employees in the selected ${groupType}.`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call bulk generation API
      const response = await fetch('/api/courses/bulk-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupType,
          groupId,
          title,
          description: description || undefined,
          difficultyLevel,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to start bulk generation: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.jobId) {
        throw new Error(`Failed to start bulk generation: ${result.error || 'Unknown error'}`);
      }
      
      // Call success callback
      onSuccess(
        result.jobId, 
        result.totalEmployees || employeeCount,
        result.estimatedTimeMinutes || Math.ceil(employeeCount * 2.5)
      );
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast({
        title: 'Error starting bulk generation',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get group options based on selected type
  const groupOptions = groupType === 'department' ? departments : positions;
  
  return (
    <Card className="w-full mt-4 mb-4">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Group Type</Label>
            <RadioGroup 
              value={groupType} 
              onValueChange={(value: 'department' | 'position') => {
                setGroupType(value);
                setGroupId(''); // Reset group selection when type changes
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="department" id="department" />
                <Label htmlFor="department" className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Department
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="position" id="position" />
                <Label htmlFor="position" className="flex items-center">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Position
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId" className="text-base font-semibold">
              {groupType === 'department' ? 'Department' : 'Position'}
            </Label>
            <Select 
              value={groupId} 
              onValueChange={setGroupId} 
              disabled={isDataLoading || groupOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isDataLoading ? 'Loading...' : `Select a ${groupType}`} />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((option: Department | Position) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {groupId && (
              <p className="text-sm text-muted-foreground">
                {employeeCount} employees in this {groupType}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Course Title</Label>
            <Input 
              id="title" 
              placeholder="Enter course title" 
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              This title will be personalized for each employee
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Enter course description" 
              className="resize-none h-20"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficultyLevel" className="text-base font-semibold">Difficulty Level</Label>
            <Select 
              value={difficultyLevel} 
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setDifficultyLevel(value)} 
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || employeeCount === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate Courses'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 