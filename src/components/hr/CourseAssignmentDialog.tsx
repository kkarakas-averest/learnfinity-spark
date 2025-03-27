import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Check, BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { hrEmployeeService } from '@/services/hrEmployeeService';

interface Course {
  id: string;
  title: string;
  description?: string;
  difficulty_level?: string;
  duration_hours?: number;
}

interface CourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
}

const CourseAssignmentDialog: React.FC<CourseAssignmentDialogProps> = ({
  open,
  onOpenChange,
  employeeId
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);
  
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('hr_courses')
        .select('*')
        .order('title');
        
      if (error) throw error;
      
      setCourses(data || []);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
  };
  
  const handleSubmit = async () => {
    if (!selectedCourse) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a course to assign'
      });
      return;
    }
    
    if (!employeeId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No employee selected'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      let enrollmentSuccess = false;
      
      // First check if the service method exists using type assertion
      if ('assignCourseToEmployee' in hrEmployeeService) {
        // Use the hrEmployeeService to assign the course with type assertion
        const { success, error } = await (hrEmployeeService as any).assignCourseToEmployee(employeeId, selectedCourse);
        
        if (!success) {
          console.warn('Service method failed:', error);
          // We'll try the direct DB approach below
        } else {
          enrollmentSuccess = true;
        }
      }
      
      // If the service method doesn't exist or failed, try direct DB access
      if (!enrollmentSuccess) {
        // Prepare the enrollment data
        const enrollmentData = {
          employee_id: employeeId,
          course_id: selectedCourse,
          enrollment_date: new Date().toISOString(),
          progress: 0,
          status: 'assigned'
        };
        
        // Check if enrollment already exists
        const { data: existingEnrollment, error: checkError } = await supabase
          .from('hr_course_enrollments')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('course_id', selectedCourse)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        // If enrollment exists, we'll just update it
        if (existingEnrollment) {
          console.log('Enrollment already exists, updating...');
          enrollmentSuccess = true;
        } else {
          // Insert the enrollment
          const { error: insertError } = await supabase
            .from('hr_course_enrollments')
            .insert([enrollmentData]);
          
          if (insertError) throw insertError;
          enrollmentSuccess = true;
        }
      }
      
      // First check if the column exists before trying to update it
      if (enrollmentSuccess && (dueDate || isMandatory)) {
        try {
          // First check if the columns exist in the table
          const { data: columnData, error: columnError } = await supabase
            .rpc('get_table_columns', { table_name: 'hr_course_enrollments' });
            
          if (columnError) {
            console.warn('Error checking columns:', columnError);
            // Continue without updating due date or mandatory status
          } else {
            // Extract column names
            const columnNames = columnData.map((col: any) => col.column_name);
            const updateData: any = {};
            
            // Only include fields that exist in the table
            if (dueDate && columnNames.includes('due_date')) {
              updateData.due_date = dueDate;
            }
            
            if (isMandatory && columnNames.includes('is_mandatory')) {
              updateData.is_mandatory = isMandatory;
            }
            
            // Only update if we have data to update
            if (Object.keys(updateData).length > 0) {
              // Update the enrollment with additional data
              const { error: updateError } = await supabase
                .from('hr_course_enrollments')
                .update(updateData)
                .eq('employee_id', employeeId)
                .eq('course_id', selectedCourse);
                
              if (updateError) {
                console.warn('Error updating additional fields:', updateError);
                // Continue as this is non-critical
              }
            }
          }
        } catch (columnCheckError) {
          console.warn('Error checking columns:', columnCheckError);
          // Continue without updating due date or mandatory status
        }
      }
      
      toast({
        title: 'Success',
        description: 'Course assigned successfully'
      });
      
      // Try to record activity
      try {
        await supabase
          .from('hr_employee_activities')
          .insert([{
            employee_id: employeeId,
            activity_type: 'course_assignment',
            description: `Assigned to course: ${courses.find(c => c.id === selectedCourse)?.title}`
          }]);
      } catch (activityError) {
        console.warn('Could not create activity record:', activityError);
        // Non-critical, continue
      }
      
      onOpenChange(false); // Close dialog
    } catch (err: any) {
      console.error('Error assigning course:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to assign course'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Course</DialogTitle>
          <DialogDescription>
            Assign a course directly to the employee.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchCourses}>Retry</Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Select Course</Label>
              <Select 
                value={selectedCourse} 
                onValueChange={handleCourseChange}
                disabled={submitting}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{course.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCourse && (
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium">{courses.find(c => c.id === selectedCourse)?.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {courses.find(c => c.id === selectedCourse)?.description || 'No description available'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span>
                    Difficulty: {courses.find(c => c.id === selectedCourse)?.difficulty_level || 'Not specified'}
                  </span>
                  <span>
                    Duration: {courses.find(c => c.id === selectedCourse)?.duration_hours || 'N/A'} hours
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <div className="relative">
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={submitting}
                  className="w-full"
                />
                <Calendar className="h-4 w-4 absolute right-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="mandatory" 
                checked={isMandatory}
                onCheckedChange={(checked) => setIsMandatory(checked === true)}
                disabled={submitting}
              />
              <Label htmlFor="mandatory" className="font-medium">
                Mark as Mandatory
              </Label>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || submitting || !selectedCourse}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Assign Course
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignmentDialog; 