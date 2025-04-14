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
import { supabase } from '@/lib/supabase-client';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { Course } from '@/types/course.types';

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
  const [generatePersonalizedContent, setGeneratePersonalizedContent] = useState(true);
  
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
    setError(null);
    
    try {
      // Call our server-side API endpoint for course assignment
      const response = await fetch('/api/hr/course-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          employeeId: employeeId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('Error assigning course:', result.error || 'Unknown error');
        setError(result.message || 'Failed to assign course');
        toast({
          variant: 'destructive',
          title: 'Assignment Failed',
          description: result.message || 'Failed to assign course'
        });
        return;
      }
      
      // Handle successful course assignment
      toast({
        title: 'Course Assigned',
        description: 'Course has been successfully assigned to the employee',
      });
      
      // Reset the form
      setSelectedCourse('');
      setIsMandatory(false);
      setDueDate('');
      
      // Close the dialog
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error assigning course:', err);
      setError('Error assigning course: ' + (err.message || err));
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: err.message || 'An unexpected error occurred'
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
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="generatePersonalized" 
                checked={generatePersonalizedContent} 
                onCheckedChange={(checked) => setGeneratePersonalizedContent(checked === true)}
              />
              <Label htmlFor="generatePersonalized" className="cursor-pointer">
                Generate personalized content
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Personalized content is created based on the employee profile including their CV (if uploaded).
            </p>
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