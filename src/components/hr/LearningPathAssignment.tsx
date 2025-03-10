import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Check, Calendar, Info, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/state';
import { supabase } from '@/lib/supabase';
import { hrLearnerService } from '@/services/hrLearnerService';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[];
  enrolledCount: number;
  skillLevel: string;
  duration: string;
}

interface LearningPathAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;  // Required - learning program ID to be assigned
}

const DatePicker = ({ date, setDate, disabled = false }: { 
  date: Date | null, 
  setDate: (date: Date | null) => void,
  disabled?: boolean
}) => {
  return (
    <div className="relative">
      <Input
        type="date"
        value={date ? date.toISOString().substring(0, 10) : ''}
        onChange={(e) => {
          const value = e.target.value;
          setDate(value ? new Date(value) : null);
        }}
        disabled={disabled}
        className="w-full"
      />
      <Calendar className="h-4 w-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
    </div>
  );
};

const LearningPathAssignment: React.FC<LearningPathAssignmentProps> = ({
  open,
  onOpenChange,
  programId
}) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Generate new path controls
  const [showGenerateOptions, setShowGenerateOptions] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const onClose = () => {
    onOpenChange(false);
  };
  
  useEffect(() => {
    if (open) {
      fetchData();
      
      // Set the selected learning path if programId is provided
      if (programId) {
        setSelectedPath(programId);
      }
    }
  }, [open, programId]);
  
  const fetchData = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('hr_employees')
        .select('id, name, email, department, position')
        .eq('status', 'active')
        .order('name');
      
      if (employeesError) throw employeesError;
      
      // Fetch learning paths
      const { data: pathsData, error: pathsError } = await supabase
        .from('hr_learning_paths')
        .select('*')
        .order('title');
      
      if (pathsError) throw pathsError;
      
      // Transform learning paths data
      const transformedPaths = await Promise.all(pathsData.map(async (path) => {
        // Get courses for this path
        const { data: coursesData, error: coursesError } = await supabase
          .from('hr_learning_path_courses')
          .select('course:hr_courses(title)')
          .eq('learning_path_id', path.id);
        
        if (coursesError) throw coursesError;
        
        // Get enrollment count
        const { count, error: countError } = await supabase
          .from('hr_learning_path_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('learning_path_id', path.id);
        
        if (countError) throw countError;
        
        return {
          id: path.id,
          title: path.title,
          description: path.description || '',
          courses: coursesData.map((c: any) => c.course.title),
          enrolledCount: count || 0,
          skillLevel: path.skill_level || 'beginner',
          duration: path.duration || 'Varies'
        };
      }));
      
      setEmployees(employeesData);
      setLearningPaths(transformedPaths);
      
      // Set the selected employee if provided
      if (programId) {
        setSelectedPath(programId);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadingError('Failed to load employees or learning paths.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    setValidationErrors({ ...validationErrors, employee: '' });
  };
  
  const handlePathChange = (value: string) => {
    setSelectedPath(value);
    setValidationErrors({ ...validationErrors, path: '' });
  };
  
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedEmployee) {
      errors.employee = 'Please select an employee';
    }
    
    if (!selectedPath) {
      errors.path = 'Please select a learning path';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleGeneratePath = async () => {
    if (!selectedEmployee) {
      setValidationErrors({ ...validationErrors, employee: 'Please select an employee to generate a path for' });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Call the service to generate a personalized learning path
      const result = await hrLearnerService.generatePersonalizedPath(
        selectedEmployee,
        user?.id || 'unknown'
      );
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Learning Path Generated',
        description: `Created "${result.data.name}" with ${result.data.courses} courses`,
      });
      
      // Refresh the learning paths list to include the new one
      await fetchData();
      
      // Select the newly created learning path
      setSelectedPath(result.data.learningPathId);
      
      // Hide the generate options
      setShowGenerateOptions(false);
    } catch (error) {
      console.error('Error generating learning path:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Path',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Format the assignment data
      const assignmentData = {
        user_id: selectedEmployee!,
        learning_path_id: selectedPath,
        assigned_by: user?.id || 'unknown',
        due_date: dueDate,
        priority,
        mandatory: isMandatory,
        notes: notes.trim()
      };
      
      // Call the service to assign the learning path
      const result = await hrLearnerService.assignLearningPath(assignmentData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: 'Learning Path Assigned',
        description: 'The learning path has been successfully assigned to the employee.',
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error assigning learning path:', error);
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Learning Path</DialogTitle>
          <DialogDescription>
            Assign a learning path to an employee or generate a personalized path.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : loadingError ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-4 text-muted-foreground">{loadingError}</p>
            <Button variant="outline" className="mt-4" onClick={fetchData}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="employee">
                Employee <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={selectedEmployee || ''} 
                onValueChange={handleEmployeeChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.employee && (
                <p className="text-sm text-destructive">{validationErrors.employee}</p>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="path" className="mb-1 block">
                  Learning Path <span className="text-destructive">*</span>
                </Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => setShowGenerateOptions(!showGenerateOptions)}
                >
                  {showGenerateOptions ? 'Cancel' : 'Generate Personalized Path'}
                </Button>
              </div>
              
              {showGenerateOptions ? (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <Sparkles className="h-10 w-10 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800">
                          Generate AI Personalized Path
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Our AI will create a customized learning path based on the employee's
                          role, department, and skills.
                        </p>
                      </div>
                      <Button 
                        onClick={handleGeneratePath}
                        disabled={isGenerating || !selectedEmployee}
                        className="mt-2"
                      >
                        {isGenerating ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate Path for Selected Employee
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Select 
                    value={selectedPath} 
                    onValueChange={handlePathChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="path">
                      <SelectValue placeholder="Select a learning path" />
                    </SelectTrigger>
                    <SelectContent>
                      {learningPaths.map(path => (
                        <SelectItem key={path.id} value={path.id}>
                          {path.title} ({path.courses.length} courses)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedPath && (
                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                      {learningPaths.find(p => p.id === selectedPath)?.description}
                    </div>
                  )}
                </>
              )}
              
              {validationErrors.path && !showGenerateOptions && (
                <p className="text-sm text-destructive">{validationErrors.path}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <RadioGroup 
                  value={priority} 
                  onValueChange={(val) => setPriority(val as 'high' | 'medium' | 'low')}
                  className="flex space-x-2"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="text-red-600">High</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-amber-600">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="text-blue-600">Low</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker
                  date={dueDate}
                  setDate={setDueDate}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mandatory" 
                  checked={isMandatory}
                  onCheckedChange={(checked) => setIsMandatory(checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="mandatory" className="font-medium">
                  Mark as Mandatory
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Mandatory learning paths will be highlighted for employees and appear in compliance reports.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Assignment Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any notes about this assignment (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isSubmitting || Boolean(loadingError) || isGenerating}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Assign Path
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LearningPathAssignment; 